import { and, eq, like } from "drizzle-orm";
import { db, users, memberships, pricingPlans, schools } from "@/db";

/** Ambil paket aktif sebuah sekolah. */
export async function getSchoolPlan(schoolId: string) {
  const [school] = await db
    .select()
    .from(schools)
    .where(eq(schools.id, schoolId))
    .limit(1);
  if (!school) return null;
  const [plan] = await db
    .select()
    .from(pricingPlans)
    .where(eq(pricingPlans.key, school.planKey))
    .limit(1);
  return plan ?? null;
}

/**
 * Jumlah pengguna sebuah workspace dengan peran tertentu — sadar-membership.
 * Menghitung gabungan (distinct per user):
 *  - akun home: users.schoolId = workspace & users.role = role, dan
 *  - anggota via memberships aktif yang punya `role` di daftar perannya
 *    (mis. pemilik workspace yang akunnya "milik" sekolah lain).
 */
export async function countRole(schoolId: string, role: string): Promise<number> {
  const [legacy, viaMembership] = await Promise.all([
    db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.schoolId, schoolId), eq(users.role, role))),
    db
      .select({ id: memberships.userId })
      .from(memberships)
      .where(
        and(
          eq(memberships.schoolId, schoolId),
          eq(memberships.status, "active"),
          like(memberships.roles, `%${role}%`),
        ),
      ),
  ]);

  const set = new Set<string>();
  for (const r of legacy) set.add(r.id);
  for (const r of viaMembership) set.add(r.id);
  return set.size;
}

/**
 * Lempar error bila menambah satu pengguna lagi akan melampaui kuota paket.
 * Kuota null = tak terbatas.
 */
export async function assertQuota(
  schoolId: string,
  role: "student" | "teacher",
) {
  const plan = await getSchoolPlan(schoolId);
  const quota = role === "student" ? plan?.quotaStudents : plan?.quotaTeachers;
  if (quota === null || quota === undefined) return; // unlimited

  const used = await countRole(schoolId, role);
  if (used >= quota) {
    const label = role === "student" ? "siswa" : "guru";
    throw new Error(
      `Kuota ${label} paket Anda penuh (${used}/${quota}). Upgrade paket untuk menambah.`,
    );
  }
}
