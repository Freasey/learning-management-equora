"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, classes, academicYears, subjects, classSubjects, schedules } from "@/db";
import { requireSchoolAdmin } from "@/lib/auth-guard";
import { getActiveYear } from "@/lib/academic";
import { subjectCode } from "@/lib/ids";
import { ensureMembership } from "@/lib/membership";

const addSchema = z.object({
  name: z.string().min(1, "Nama kelas wajib diisi"),
  level: z.string().optional().or(z.literal("")),
  capacity: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.coerce.number().int().min(1).nullable(),
  ),
  homeroomTeacherId: z.string().optional().or(z.literal("")),
});

export async function addClass(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const year = await getActiveYear(schoolId);
  if (!year) {
    throw new Error("Aktifkan tahun ajaran dulu di Pengaturan.");
  }

  const parsed = addSchema.safeParse({
    name: formData.get("name"),
    level: formData.get("level"),
    capacity: formData.get("capacity"),
    homeroomTeacherId: formData.get("homeroomTeacherId"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);

  await db.insert(classes).values({
    schoolId,
    academicYearId: year.id,
    name: parsed.data.name,
    level: parsed.data.level || null,
    capacity: parsed.data.capacity,
    homeroomTeacherId: parsed.data.homeroomTeacherId || null,
  });
  revalidatePath("/admin/kelas");
}

/**
 * B4 — Jalur cepat guru independen: satu aksi menyiapkan semua yang
 * dibutuhkan untuk langsung mengajar (tahun ajaran → mapel → kelas →
 * pengampu + 1 slot jadwal yang menugaskan pemilik sebagai guru).
 * Setelah ini, getTeacherAssignments langsung mengenali pasangan kelas+mapel.
 */
const instantSchema = z.object({
  className: z.string().min(1, "Nama kelas wajib diisi"),
  subjectName: z.string().min(1, "Nama mata pelajaran wajib diisi"),
});

export async function createInstantClass(formData: FormData) {
  const { session, schoolId } = await requireSchoolAdmin();
  const teacherId = session?.user?.id;
  const parsed = instantSchema.safeParse({
    className: formData.get("className"),
    subjectName: formData.get("subjectName"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);

  // 1) Tahun ajaran aktif (buat bila belum ada).
  let year = await getActiveYear(schoolId);
  if (!year) {
    [year] = await db
      .insert(academicYears)
      .values({ schoolId, name: "Tahun Berjalan", isActive: true })
      .returning();
  }

  // 2) Mapel — pakai yang sudah ada (nama sama) atau buat baru.
  const [existingSubject] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(
      and(
        eq(subjects.schoolId, schoolId),
        eq(subjects.name, parsed.data.subjectName),
        isNull(subjects.deletedAt),
      ),
    )
    .limit(1);
  let subjectId = existingSubject?.id;
  if (!subjectId) {
    const [s] = await db
      .insert(subjects)
      .values({
        schoolId,
        name: parsed.data.subjectName,
        code: subjectCode(parsed.data.subjectName),
        source: "custom",
      })
      .returning({ id: subjects.id });
    subjectId = s.id;
  }

  // 3) Kelas.
  const [cls] = await db
    .insert(classes)
    .values({
      schoolId,
      academicYearId: year.id,
      name: parsed.data.className,
      homeroomTeacherId: teacherId ?? null,
    })
    .returning({ id: classes.id });

  // 4) Pastikan pemilik punya peran teacher + tugaskan mengajar (pengampu + jadwal).
  if (teacherId) {
    await ensureMembership(teacherId, schoolId, ["school_admin", "teacher"]);
    await db.insert(classSubjects).values({
      schoolId,
      classId: cls.id,
      subjectId,
      teacherId,
    });
    await db.insert(schedules).values({
      schoolId,
      classId: cls.id,
      subjectId,
      teacherId,
      dayOfWeek: 1,
      startTime: "08:00",
      endTime: "09:00",
    });
  }

  redirect("/guru");
}

export async function deleteClass(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  // Soft-delete: jangan hard-delete agar enrolment & nilai historis tak hilang.
  await db
    .update(classes)
    .set({ deletedAt: new Date() })
    .where(and(eq(classes.id, id), eq(classes.schoolId, schoolId)));
  revalidatePath("/admin/kelas");
}
