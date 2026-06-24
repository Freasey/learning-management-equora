import { and, eq } from "drizzle-orm";
import { db, memberships, schools, pricingPlans, users } from "@/db";
import { parseRoles } from "@/lib/membership";
import { primaryRole, type WorkspaceMembership } from "@/lib/roles";

type PlanShape = { priceMonthly: number; priceYearly: number; isCustom: boolean };

/** Paket "gratis" = harga 0 (bulanan & tahunan) dan bukan paket custom/nego. */
export function isFreePlan(plan: PlanShape | null | undefined): boolean {
  return (
    !!plan && plan.priceMonthly === 0 && plan.priceYearly === 0 && !plan.isCustom
  );
}

export type MyWorkspace = {
  schoolId: string;
  name: string;
  type: string; // school | personal
  roles: string[];
  isOwner: boolean;
  isHome: boolean; // workspace utama (users.schoolId)
  planKey: string;
  planName: string | null;
  free: boolean;
  status: string;
};

/**
 * Semua workspace yang dimiliki/diikuti seorang user (untuk halaman Kelola
 * Workspace). Menyertakan workspace HOME walau belum punya baris membership
 * (sintesis dari users.schoolId — konsisten dgn loadWorkspaces di auth).
 *
 * Home diambil dari DB (users.schoolId), BUKAN dari workspace aktif sesi —
 * agar home tak hilang saat sedang aktif di workspace lain.
 */
export async function listMyWorkspaces(userId: string): Promise<MyWorkspace[]> {
  const [me] = await db
    .select({ schoolId: users.schoolId, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const homeSchoolId = me?.schoolId ?? null;
  const homeRole = me?.role ?? null;

  const rows = await db
    .select({
      schoolId: memberships.schoolId,
      roles: memberships.roles,
      isOwner: memberships.isOwner,
      name: schools.name,
      type: schools.type,
      status: schools.status,
      planKey: schools.planKey,
      planName: pricingPlans.name,
      priceM: pricingPlans.priceMonthly,
      priceY: pricingPlans.priceYearly,
      isCustom: pricingPlans.isCustom,
    })
    .from(memberships)
    .innerJoin(schools, eq(schools.id, memberships.schoolId))
    .leftJoin(pricingPlans, eq(pricingPlans.key, schools.planKey))
    .where(and(eq(memberships.userId, userId), eq(memberships.status, "active")));

  let list: MyWorkspace[] = rows.map((r) => ({
    schoolId: r.schoolId,
    name: r.name,
    type: r.type,
    roles: parseRoles(r.roles),
    isOwner: r.isOwner,
    isHome: r.schoolId === homeSchoolId,
    planKey: r.planKey,
    planName: r.planName,
    free: isFreePlan({
      priceMonthly: r.priceM ?? 0,
      priceYearly: r.priceY ?? 0,
      isCustom: r.isCustom ?? false,
    }),
    status: r.status,
  }));

  if (homeSchoolId && !list.some((w) => w.schoolId === homeSchoolId)) {
    const [s] = await db
      .select({
        name: schools.name,
        type: schools.type,
        status: schools.status,
        planKey: schools.planKey,
        planName: pricingPlans.name,
        priceM: pricingPlans.priceMonthly,
        priceY: pricingPlans.priceYearly,
        isCustom: pricingPlans.isCustom,
      })
      .from(schools)
      .leftJoin(pricingPlans, eq(pricingPlans.key, schools.planKey))
      .where(eq(schools.id, homeSchoolId))
      .limit(1);
    if (s) {
      list = [
        {
          schoolId: homeSchoolId,
          name: s.name,
          type: s.type,
          roles: homeRole ? [homeRole] : [],
          isOwner: false,
          isHome: true,
          planKey: s.planKey,
          planName: s.planName,
          free: isFreePlan({
            priceMonthly: s.priceM ?? 0,
            priceYearly: s.priceY ?? 0,
            isCustom: s.isCustom ?? false,
          }),
          status: s.status,
        },
        ...list,
      ];
    }
  }
  return list;
}

/** Berapa workspace BERPAKET GRATIS yang dimiliki user (sebagai owner). */
export async function ownedFreeWorkspaceCount(
  userId: string,
  excludeSchoolId?: string,
): Promise<number> {
  const rows = await db
    .select({
      schoolId: memberships.schoolId,
      priceM: pricingPlans.priceMonthly,
      priceY: pricingPlans.priceYearly,
      isCustom: pricingPlans.isCustom,
    })
    .from(memberships)
    .innerJoin(schools, eq(schools.id, memberships.schoolId))
    .leftJoin(pricingPlans, eq(pricingPlans.key, schools.planKey))
    .where(and(eq(memberships.userId, userId), eq(memberships.isOwner, true)));

  return rows.filter(
    (r) =>
      r.schoolId !== excludeSchoolId &&
      isFreePlan({
        priceMonthly: r.priceM ?? 0,
        priceYearly: r.priceY ?? 0,
        isCustom: r.isCustom ?? false,
      }),
  ).length;
}

/** Lempar bila user sudah punya 1 workspace gratis (batas: 1 gratis per user). */
export async function assertCanCreateFreeWorkspace(userId: string) {
  if ((await ownedFreeWorkspaceCount(userId)) >= 1) {
    throw new Error(
      "Anda sudah memiliki satu workspace gratis. Workspace tambahan memerlukan paket berbayar.",
    );
  }
}

/**
 * Susun payload untuk unstable_update saat berpindah/membuat workspace.
 * Berbasis DB (bukan token) supaya berfungsi untuk workspace yang baru dibuat
 * / baru di-join (yang belum ada di token sesi lama).
 */
export async function buildActiveUpdate(userId: string, schoolId: string) {
  const [row] = await db
    .select({
      roles: memberships.roles,
      isOwner: memberships.isOwner,
      name: schools.name,
      type: schools.type,
    })
    .from(memberships)
    .innerJoin(schools, eq(schools.id, memberships.schoolId))
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.schoolId, schoolId),
        eq(memberships.status, "active"),
      ),
    )
    .limit(1);

  if (!row) {
    // Fallback: workspace HOME yang belum punya baris membership (akun lama
    // hasil seed). Sintesis dari users.schoolId + users.role agar tetap bisa
    // dibuka/di-switch.
    const [me] = await db
      .select({ schoolId: users.schoolId, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!me || me.schoolId !== schoolId) return null;
    const [s] = await db
      .select({ name: schools.name, type: schools.type })
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1);
    if (!s) return null;
    const roles = [me.role];
    return {
      activeSchoolId: schoolId,
      activeRoles: roles,
      activeRole: primaryRole(roles),
      activeMembership: {
        schoolId,
        schoolName: s.name,
        type: s.type,
        roles,
        isOwner: false,
      },
    };
  }

  const roles = parseRoles(row.roles);
  const membership: WorkspaceMembership = {
    schoolId,
    schoolName: row.name,
    type: row.type,
    roles,
    isOwner: row.isOwner,
  };
  return {
    activeSchoolId: schoolId,
    activeRoles: roles,
    activeRole: primaryRole(roles),
    activeMembership: membership,
  };
}
