import { and, eq, isNull } from "drizzle-orm";
import { db, schedules, classes, subjects, classSubjects } from "@/db";

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
    .where(
      and(
        eq(schedules.schoolId, schoolId),
        eq(schedules.teacherId, teacherId),
        isNull(classes.deletedAt),
      ),
    );

  return rows.filter((r): r is Assignment => Boolean(r.subjectId && r.classId));
}

/**
 * Apakah guru ditugaskan mengajar sebuah kelas di workspace ini?
 * Sumber penugasan: jadwal (schedules.teacherId) atau pengampu (classSubjects).
 * Dipakai untuk otorisasi (A2) — cegah guru mengelola kelas yang bukan asuhannya.
 */
export async function teacherTeachesClass(
  schoolId: string,
  teacherId: string,
  classId: string,
): Promise<boolean> {
  const [sched, cs] = await Promise.all([
    db
      .select({ id: schedules.id })
      .from(schedules)
      .where(
        and(
          eq(schedules.schoolId, schoolId),
          eq(schedules.teacherId, teacherId),
          eq(schedules.classId, classId),
        ),
      )
      .limit(1),
    db
      .select({ id: classSubjects.id })
      .from(classSubjects)
      .where(
        and(
          eq(classSubjects.schoolId, schoolId),
          eq(classSubjects.teacherId, teacherId),
          eq(classSubjects.classId, classId),
        ),
      )
      .limit(1),
  ]);
  return sched.length > 0 || cs.length > 0;
}

/** Lempar error bila guru tak berhak atas kelas tsb. */
export async function assertTeacherTeachesClass(
  schoolId: string,
  teacherId: string,
  classId: string,
) {
  if (!(await teacherTeachesClass(schoolId, teacherId, classId))) {
    throw new Error("Anda tidak ditugaskan mengajar kelas ini.");
  }
}
