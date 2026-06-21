"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schools, academicYears } from "@/db";
import { requireSchoolAdmin } from "@/lib/auth-guard";

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
  const existing = await db.$count(academicYears, eq(academicYears.schoolId, schoolId));
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

export async function deleteAcademicYear(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  await db
    .delete(academicYears)
    .where(and(eq(academicYears.id, id), eq(academicYears.schoolId, schoolId)));
  revalidatePath("/admin/pengaturan");
}
