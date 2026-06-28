"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, withTenant, schedules } from "@/db";
import { requireSchoolAdmin } from "@/lib/auth-guard";

const addSchema = z.object({
  classId: z.string().uuid("Pilih kelas"),
  dayOfWeek: z.coerce.number().int().min(1).max(7),
  startTime: z.string().min(1, "Jam mulai wajib"),
  endTime: z.string().min(1, "Jam selesai wajib"),
  subjectId: z.string().optional().or(z.literal("")),
  teacherId: z.string().optional().or(z.literal("")),
  room: z.string().optional().or(z.literal("")),
});

export async function addSchedule(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const parsed = addSchema.safeParse({
    classId: formData.get("classId"),
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    subjectId: formData.get("subjectId"),
    teacherId: formData.get("teacherId"),
    room: formData.get("room"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);

  await withTenant(schoolId, async () => {
    await db.insert(schedules).values({
      schoolId,
      classId: parsed.data.classId,
      dayOfWeek: parsed.data.dayOfWeek,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      subjectId: parsed.data.subjectId || null,
      teacherId: parsed.data.teacherId || null,
      room: parsed.data.room || null,
    });
  });
  revalidatePath("/admin/jadwal");
}

export async function deleteSchedule(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  await withTenant(schoolId, async () => {
    await db
      .delete(schedules)
      .where(and(eq(schedules.id, id), eq(schedules.schoolId, schoolId)));
  });
  revalidatePath("/admin/jadwal");
}
