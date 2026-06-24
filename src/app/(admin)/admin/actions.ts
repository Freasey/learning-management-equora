"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signOut } from "@/auth";
import {
  db,
  academicYears,
  subjects,
  classes,
  enrollments,
  classSubjects,
  schedules,
  users,
} from "@/db";
import { requireSchoolAdmin } from "@/lib/auth-guard";
import { ensureMembership } from "@/lib/membership";
import { subjectCode } from "@/lib/ids";
import { logAudit } from "@/lib/audit";

export async function doSignOut() {
  await signOut({ redirectTo: "/masuk" });
}

/**
 * B7 — Muat data contoh (sandbox trial). Opt-in dari dashboard kosong: mengisi
 * tahun ajaran + mapel + kelas + guru contoh + siswa + jadwal supaya admin baru
 * langsung bisa "merasakan" sistem alih-alih kanvas kosong. Aman: hanya membuat,
 * tak menghapus apa pun; admin bisa hapus manual nanti.
 */
export async function seedSampleData() {
  const { session, schoolId } = await requireSchoolAdmin();

  // Hindari menumpuk: lewati bila sudah ada kelas.
  const existingClasses = await db.$count(
    classes,
    and(eq(classes.schoolId, schoolId), isNull(classes.deletedAt)),
  );
  if (existingClasses > 0) {
    revalidatePath("/admin");
    return;
  }

  // 1) Tahun ajaran aktif.
  let [year] = await db
    .select()
    .from(academicYears)
    .where(and(eq(academicYears.schoolId, schoolId), eq(academicYears.isActive, true), isNull(academicYears.deletedAt)))
    .limit(1);
  if (!year) {
    [year] = await db
      .insert(academicYears)
      .values({ schoolId, name: "Tahun Ajaran Contoh", isActive: true })
      .returning();
  }

  // 2) Mapel contoh.
  const subjNames = ["Matematika", "Bahasa Indonesia", "IPA"];
  const subjIds: string[] = [];
  for (const name of subjNames) {
    const [s] = await db
      .insert(subjects)
      .values({ schoolId, name, code: subjectCode(name), source: "custom" })
      .returning({ id: subjects.id });
    subjIds.push(s.id);
  }

  // 3) Guru contoh.
  const passwordHash = await bcrypt.hash("contoh1234", 10);
  const [teacher] = await db
    .insert(users)
    .values({
      schoolId,
      role: "teacher",
      name: "Guru Contoh",
      email: `guru.contoh+${schoolId.slice(0, 8)}@equora.id`,
      passwordHash,
      status: "active",
    })
    .returning({ id: users.id });
  await ensureMembership(teacher.id, schoolId, ["teacher"]);

  // 4) Kelas contoh.
  const [cls] = await db
    .insert(classes)
    .values({ schoolId, academicYearId: year.id, name: "Contoh-A", level: "X", homeroomTeacherId: teacher.id })
    .returning({ id: classes.id });

  // 5) Siswa contoh + enrol.
  const studentNames = ["Siswa Contoh 1", "Siswa Contoh 2", "Siswa Contoh 3"];
  for (let i = 0; i < studentNames.length; i++) {
    const [stu] = await db
      .insert(users)
      .values({
        schoolId,
        role: "student",
        name: studentNames[i],
        username: `contoh${i + 1}`,
        passwordHash,
        status: "active",
      })
      .returning({ id: users.id });
    await ensureMembership(stu.id, schoolId, ["student"]);
    await db
      .insert(enrollments)
      .values({ schoolId, academicYearId: year.id, classId: cls.id, studentId: stu.id });
  }

  // 6) Pengampu + jadwal (2 slot) untuk mapel pertama.
  await db.insert(classSubjects).values({ schoolId, classId: cls.id, subjectId: subjIds[0], teacherId: teacher.id });
  await db.insert(schedules).values([
    { schoolId, classId: cls.id, subjectId: subjIds[0], teacherId: teacher.id, dayOfWeek: 1, startTime: "07:30", endTime: "09:00" },
    { schoolId, classId: cls.id, subjectId: subjIds[1], teacherId: teacher.id, dayOfWeek: 3, startTime: "09:15", endTime: "10:45" },
  ]);

  await logAudit({ schoolId, actorId: session?.user?.id, action: "sample.seed" });
  revalidatePath("/admin");
}
