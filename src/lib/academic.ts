import { and, desc, eq } from "drizzle-orm";
import { db, academicYears } from "@/db";

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
