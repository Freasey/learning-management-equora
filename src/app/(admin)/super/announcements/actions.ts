"use server";

import { revalidatePath } from "next/cache";
import { eq, not } from "drizzle-orm";
import { z } from "zod";
import { db, announcements } from "@/db";
import { requireSuperAdmin } from "@/lib/auth-guard";

const createSchema = z.object({
  title: z.string().min(2, "Judul minimal 2 karakter"),
  body: z.string().optional().default(""),
  level: z.enum(["info", "warning", "critical"]),
});

export async function createAnnouncement(formData: FormData) {
  await requireSuperAdmin();
  const parsed = createSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    level: formData.get("level"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid");
  }

  await db.insert(announcements).values(parsed.data);
  revalidatePath("/super/announcements");
}

export async function toggleAnnouncement(formData: FormData) {
  await requireSuperAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  await db
    .update(announcements)
    .set({ isActive: not(announcements.isActive) })
    .where(eq(announcements.id, id));
  revalidatePath("/super/announcements");
}

export async function deleteAnnouncement(formData: FormData) {
  await requireSuperAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  await db.delete(announcements).where(eq(announcements.id, id));
  revalidatePath("/super/announcements");
}
