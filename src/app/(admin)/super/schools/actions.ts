"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schools } from "@/db";
import { requireSuperAdmin } from "@/lib/auth-guard";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function randomCode(len = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: len },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

const createSchema = z.object({
  name: z.string().min(2, "Nama sekolah minimal 2 karakter"),
  planKey: z.string().min(1),
  contactEmail: z.string().email().optional().or(z.literal("")),
});

export async function createTenant(formData: FormData) {
  await requireSuperAdmin();
  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    planKey: formData.get("planKey"),
    contactEmail: formData.get("contactEmail"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid");
  }

  const { name, planKey, contactEmail } = parsed.data;
  const baseSlug = slugify(name) || "sekolah";
  const slug = `${baseSlug}-${randomCode(4).toLowerCase()}`;

  await db.insert(schools).values({
    name,
    planKey,
    slug,
    code: randomCode(),
    contactEmail: contactEmail || null,
    status: "trial",
  });

  revalidatePath("/super/schools");
}

const statusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["trial", "active", "suspended"]),
});

export async function setTenantStatus(formData: FormData) {
  await requireSuperAdmin();
  const parsed = statusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) throw new Error("Status tidak valid");

  await db
    .update(schools)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(schools.id, parsed.data.id));

  revalidatePath("/super/schools");
}
