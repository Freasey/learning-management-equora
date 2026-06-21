import { and, eq } from "drizzle-orm";
import { db, schedules, classes, subjects } from "@/db";

export type Assignment = {
  classId: string;
  className: string | null;
  subjectId: string;
  subjectName: string | null;
};

/**
 * Pasangan (kelas, mapel) yang diajar guru — diturunkan dari jadwal.
 * Admin menugaskan guru lewat Jadwal (schedules.teacherId).
 */
export async function getTeacherAssignments(
  schoolId: string,
  teacherId: string,
): Promise<Assignment[]> {
  const rows = await db
    .selectDistinct({
      classId: schedules.classId,
      className: classes.name,
      subjectId: schedules.subjectId,
      subjectName: subjects.name,
    })
    .from(schedules)
    .leftJoin(classes, eq(classes.id, schedules.classId))
    .leftJoin(subjects, eq(subjects.id, schedules.subjectId))
    .where(and(eq(schedules.schoolId, schoolId), eq(schedules.teacherId, teacherId)));

  return rows.filter((r): r is Assignment => Boolean(r.subjectId && r.classId));
}
