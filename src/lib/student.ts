import { and, desc, eq } from "drizzle-orm";
import { db, enrollments, classes } from "@/db";

/** Kelas aktif siswa (enrolment terbaru). */
export async function getStudentClass(schoolId: string, studentId: string) {
  const [row] = await db
    .select({
      classId: classes.id,
      className: classes.name,
      academicYearId: classes.academicYearId,
    })
    .from(enrollments)
    .innerJoin(classes, eq(classes.id, enrollments.classId))
    .where(
      and(eq(enrollments.schoolId, schoolId), eq(enrollments.studentId, studentId)),
    )
    .orderBy(desc(enrollments.createdAt))
    .limit(1);
  return row ?? null;
}
