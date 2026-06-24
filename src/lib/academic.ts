import { and, desc, eq } from "drizzle-orm";
import { db, academicYears, classes } from "@/db";

/** Tahun ajaran aktif sekolah (atau null bila belum ada). */
export async function getActiveYear(schoolId: string) {
  const [year] = await db
    .select()
    .from(academicYears)
    .where(and(eq(academicYears.schoolId, schoolId), eq(academicYears.isActive, true)))
    .limit(1);
  return year ?? null;
}

/** Semua tahun ajaran sekolah, terbaru dulu. */
export function listYears(schoolId: string) {
  return db
    .select()
    .from(academicYears)
    .where(eq(academicYears.schoolId, schoolId))
    .orderBy(desc(academicYears.createdAt));
}

/**
 * Tahun ajaran sebuah kelas (untuk men-stamp data turunan: enrolment, nilai).
 * Mengembalikan null bila kelas tak ada / tak ter-stamp.
 */
export async function getClassYear(
  schoolId: string,
  classId: string,
): Promise<string | null> {
  const [c] = await db
    .select({ y: classes.academicYearId })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.schoolId, schoolId)))
    .limit(1);
  return c?.y ?? null;
}
