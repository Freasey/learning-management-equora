"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, users } from "@/db";
import { requireSchoolAdmin } from "@/lib/auth-guard";
import { assertQuota } from "@/lib/quota";

const addSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
});

export async function addTeacher(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const parsed = addSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);

  await assertQuota(schoolId, "teacher");

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  if (existing) throw new Error("Email sudah dipakai.");

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await db.insert(users).values({
    schoolId,
    role: "teacher",
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
    status: "active",
  });

  revalidatePath("/admin/guru");
}

export async function setTeacherStatus(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const status = z.enum(["active", "suspended"]).parse(formData.get("status"));
  await db
    .update(users)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(users.id, id), eq(users.schoolId, schoolId), eq(users.role, "teacher")));
  revalidatePath("/admin/guru");
}

export async function deleteTeacher(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  await db
    .delete(users)
    .where(and(eq(users.id, id), eq(users.schoolId, schoolId), eq(users.role, "teacher")));
  revalidatePath("/admin/guru");
}
