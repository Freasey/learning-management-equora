import { and, eq } from "drizzle-orm";
import { db, users, pricingPlans, schools } from "@/db";

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

/** Jumlah pengguna sekolah dengan peran tertentu. */
export function countRole(schoolId: string, role: string) {
  return db.$count(users, and(eq(users.schoolId, schoolId), eq(users.role, role)));
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
