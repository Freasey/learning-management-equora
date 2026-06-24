"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  schools,
  academicYears,
  classes,
  classSubjects,
  schedules,
  enrollments,
} from "@/db";
import { requireSchoolAdmin } from "@/lib/auth-guard";
import { logAudit } from "@/lib/audit";

const profileSchema = z.object({
  name: z.string().min(2, "Nama sekolah minimal 2 karakter"),
  level: z.enum(["SD", "SMP", "SMA", "SMK"]),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
});

export async function updateSchoolProfile(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    level: formData.get("level"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);

  await db
    .update(schools)
    .set({
      name: parsed.data.name,
      level: parsed.data.level,
      contactEmail: parsed.data.contactEmail || null,
      contactPhone: parsed.data.contactPhone || null,
      updatedAt: new Date(),
    })
    .where(eq(schools.id, schoolId));

  revalidatePath("/admin/pengaturan");
}

export async function addAcademicYear(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const name = z.string().min(2, "Nama tahun ajaran minimal 2 karakter").parse(
    formData.get("name"),
  );

  // Jadikan aktif bila ini tahun ajaran pertama.
  const existing = await db.$count(
    academicYears,
    and(eq(academicYears.schoolId, schoolId), isNull(academicYears.deletedAt)),
  );
  await db.insert(academicYears).values({
    schoolId,
    name,
    isActive: existing === 0,
  });

  revalidatePath("/admin/pengaturan");
}

export async function setActiveYear(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const id = z.string().uuid().parse(formData.get("id"));

  await db
    .update(academicYears)
    .set({ isActive: false })
    .where(eq(academicYears.schoolId, schoolId));
  await db
    .update(academicYears)
    .set({ isActive: true })
    .where(and(eq(academicYears.id, id), eq(academicYears.schoolId, schoolId)));

  revalidatePath("/admin/pengaturan");
}

const rolloverSchema = z.object({
  name: z.string().min(2, "Nama tahun ajaran baru minimal 2 karakter"),
  sourceYearId: z.string().uuid("Pilih tahun ajaran sumber"),
  includeStudents: z.boolean(),
});

/**
 * Mulai tahun ajaran baru dari tahun yang sudah ada (rollover).
 * Menyalin STRUKTUR (kelas, pengampu, jadwal) ke tahun baru & menjadikannya
 * aktif. Siswa ikut "naik kelas apa adanya" bila dicentang. Data historis
 * (nilai, kuis, pengerjaan) TIDAK disalin — tetap diarsip di tahun lama.
 */
export async function rolloverAcademicYear(formData: FormData) {
  const { session, schoolId } = await requireSchoolAdmin();
  const parsed = rolloverSchema.safeParse({
    name: formData.get("name"),
    sourceYearId: formData.get("sourceYearId"),
    includeStudents: formData.get("includeStudents") === "on",
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);

  // Tahun sumber wajib milik sekolah ini.
  const [src] = await db
    .select()
    .from(academicYears)
    .where(
      and(
        eq(academicYears.id, parsed.data.sourceYearId),
        eq(academicYears.schoolId, schoolId),
      ),
    )
    .limit(1);
  if (!src) throw new Error("Tahun ajaran sumber tidak ditemukan.");

  // 1) Tahun baru → aktif (nonaktifkan yang lain).
  await db
    .update(academicYears)
    .set({ isActive: false })
    .where(eq(academicYears.schoolId, schoolId));
  const [newYear] = await db
    .insert(academicYears)
    .values({ schoolId, name: parsed.data.name, isActive: true })
    .returning({ id: academicYears.id });

  // 2) Salin kelas → bangun peta kelas lama→baru.
  const srcClasses = await db
    .select()
    .from(classes)
    .where(
      and(
        eq(classes.schoolId, schoolId),
        eq(classes.academicYearId, src.id),
        isNull(classes.deletedAt),
      ),
    );
  const classMap = new Map<string, string>();
  for (const c of srcClasses) {
    const [nc] = await db
      .insert(classes)
      .values({
        schoolId,
        academicYearId: newYear.id,
        name: c.name,
        level: c.level,
        capacity: c.capacity,
        homeroomTeacherId: c.homeroomTeacherId,
      })
      .returning({ id: classes.id });
    classMap.set(c.id, nc.id);
  }

  const srcClassIds = [...classMap.keys()];
  if (srcClassIds.length === 0) {
    revalidatePath("/admin/pengaturan");
    revalidatePath("/admin/kelas");
    return; // tak ada struktur untuk disalin
  }

  // 3) Salin pengampu (classSubjects) ke kelas baru.
  const srcCS = await db
    .select()
    .from(classSubjects)
    .where(
      and(
        eq(classSubjects.schoolId, schoolId),
        inArray(classSubjects.classId, srcClassIds),
      ),
    );
  for (const cs of srcCS) {
    const newClassId = classMap.get(cs.classId);
    if (!newClassId) continue;
    await db.insert(classSubjects).values({
      schoolId,
      classId: newClassId,
      subjectId: cs.subjectId,
      teacherId: cs.teacherId,
    });
  }

  // 4) Salin jadwal ke kelas baru.
  const srcSched = await db
    .select()
    .from(schedules)
    .where(
      and(eq(schedules.schoolId, schoolId), inArray(schedules.classId, srcClassIds)),
    );
  for (const s of srcSched) {
    const newClassId = classMap.get(s.classId);
    if (!newClassId) continue;
    await db.insert(schedules).values({
      schoolId,
      classId: newClassId,
      subjectId: s.subjectId,
      teacherId: s.teacherId,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room,
    });
  }

  // 5) (Opsional) Bawa siswa: re-enroll ke kelas baru yang sepadan.
  if (parsed.data.includeStudents) {
    const srcEnroll = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.schoolId, schoolId),
          inArray(enrollments.classId, srcClassIds),
        ),
      );
    for (const e of srcEnroll) {
      const newClassId = classMap.get(e.classId);
      if (!newClassId) continue;
      await db.insert(enrollments).values({
        schoolId,
        academicYearId: newYear.id,
        classId: newClassId,
        studentId: e.studentId,
      });
    }
  }

  await logAudit({
    schoolId,
    actorId: session?.user?.id,
    action: "year.rollover",
    target: newYear.id,
    meta: { name: parsed.data.name, includeStudents: parsed.data.includeStudents },
  });

  revalidatePath("/admin/pengaturan");
  revalidatePath("/admin/kelas");
}

export async function deleteAcademicYear(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  await db
    .update(academicYears)
    .set({ deletedAt: new Date() })
    .where(and(eq(academicYears.id, id), eq(academicYears.schoolId, schoolId)));
  revalidatePath("/admin/pengaturan");
}
