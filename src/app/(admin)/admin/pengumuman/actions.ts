"use server";

import { revalidatePath } from "next/cache";
import { and, eq, not } from "drizzle-orm";
import { z } from "zod";
import { db, withTenant, schoolAnnouncements } from "@/db";
import { requireSchoolAdmin } from "@/lib/auth-guard";

const addSchema = z.object({
  title: z.string().min(2, "Judul minimal 2 karakter"),
  body: z.string().optional().or(z.literal("")),
  audience: z.enum(["all", "teachers", "students"]),
});

export async function addSchoolAnnouncement(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const parsed = addSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    audience: formData.get("audience"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);

  await withTenant(schoolId, async () => {
    await db.insert(schoolAnnouncements).values({
      schoolId,
      title: parsed.data.title,
      body: parsed.data.body || "",
      audience: parsed.data.audience,
    });
  });
  revalidatePath("/admin/pengumuman");
}

export async function toggleSchoolAnnouncement(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  await withTenant(schoolId, async () => {
    await db
      .update(schoolAnnouncements)
      .set({ isActive: not(schoolAnnouncements.isActive) })
      .where(and(eq(schoolAnnouncements.id, id), eq(schoolAnnouncements.schoolId, schoolId)));
  });
  revalidatePath("/admin/pengumuman");
}

export async function deleteSchoolAnnouncement(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  await withTenant(schoolId, async () => {
    await db
      .delete(schoolAnnouncements)
      .where(and(eq(schoolAnnouncements.id, id), eq(schoolAnnouncements.schoolId, schoolId)));
  });
  revalidatePath("/admin/pengumuman");
}
