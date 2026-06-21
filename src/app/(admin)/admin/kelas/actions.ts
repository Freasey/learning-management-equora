"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, classes } from "@/db";
import { requireSchoolAdmin } from "@/lib/auth-guard";
import { getActiveYear } from "@/lib/academic";

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

export async function deleteClass(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  await db
    .delete(classes)
    .where(and(eq(classes.id, id), eq(classes.schoolId, schoolId)));
  revalidatePath("/admin/kelas");
}
