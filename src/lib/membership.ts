import { and, eq, like } from "drizzle-orm";
import { db, memberships, users } from "@/db";

/** "school_admin,teacher" → ["school_admin","teacher"] */
export function parseRoles(s: string | null | undefined): string[] {
  return (s ?? "").split(",").map((x) => x.trim()).filter(Boolean);
}

/** ["school_admin","teacher"] → "school_admin,teacher" (unik) */
export function serializeRoles(roles: string[]): string {
  return Array.from(new Set(roles)).join(",");
}

/**
 * Pastikan ada baris membership untuk (user, workspace). Bila belum ada,
 * dibuat dari `fallbackRoles` (lazy — supaya tak perlu backfill semua orang).
 */
export async function ensureMembership(
  userId: string,
  schoolId: string,
  fallbackRoles: string[],
) {
  const [row] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.schoolId, schoolId)))
    .limit(1);
  if (row) return row;
  const [created] = await db
    .insert(memberships)
    .values({ userId, schoolId, roles: serializeRoles(fallbackRoles), status: "active" })
    .returning();
  return created;
}

/**
 * Daftar "pengajar" sebuah workspace = gabungan:
 *  - akun home dengan users.role='teacher' (alur lama), dan
 *  - anggota mana pun yang punya peran `teacher` di memberships
 *    (mis. admin yang mengaktifkan "saya juga mengajar", atau guru lintas-sekolah).
 * Distinct per user.
 */
export async function listWorkspaceTeachers(schoolId: string) {
  const [legacy, viaMembership] = await Promise.all([
    db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(
        and(
          eq(users.schoolId, schoolId),
          eq(users.role, "teacher"),
          eq(users.status, "active"),
        ),
      ),
    db
      .select({ id: users.id, name: users.name })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(
        and(
          eq(memberships.schoolId, schoolId),
          eq(memberships.status, "active"),
          like(memberships.roles, "%teacher%"),
        ),
      ),
  ]);

  const map = new Map<string, { id: string; name: string }>();
  for (const r of [...legacy, ...viaMembership]) map.set(r.id, r);
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}
