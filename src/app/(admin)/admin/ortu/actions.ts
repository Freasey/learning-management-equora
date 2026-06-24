"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, users, parentLinks } from "@/db";
import { requireSchoolAdmin } from "@/lib/auth-guard";
import { ensureMembership } from "@/lib/membership";

const addSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  studentId: z.string().uuid("Pilih anak (siswa)"),
});

export async function addParent(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const parsed = addSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    studentId: formData.get("studentId"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);

  const [exists] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  if (exists) throw new Error("Email sudah dipakai.");

  // Pastikan siswa milik sekolah ini.
  const [student] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.id, parsed.data.studentId),
        eq(users.schoolId, schoolId),
        eq(users.role, "student"),
      ),
    )
    .limit(1);
  if (!student) throw new Error("Siswa tidak ditemukan.");

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const [parent] = await db
    .insert(users)
    .values({
      schoolId,
      role: "parent",
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      status: "active",
    })
    .returning({ id: users.id });
  await ensureMembership(parent.id, schoolId, ["parent"]);
  await db
    .insert(parentLinks)
    .values({ schoolId, parentId: parent.id, studentId: parsed.data.studentId })
    .onConflictDoNothing();

  revalidatePath("/admin/ortu");
}

export async function linkChild(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const parentId = z.string().uuid().parse(formData.get("parentId"));
  const studentId = z.string().uuid().parse(formData.get("studentId"));
  await db
    .insert(parentLinks)
    .values({ schoolId, parentId, studentId })
    .onConflictDoNothing();
  revalidatePath("/admin/ortu");
}

export async function unlinkChild(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  await db
    .delete(parentLinks)
    .where(and(eq(parentLinks.id, id), eq(parentLinks.schoolId, schoolId)));
  revalidatePath("/admin/ortu");
}

export async function deleteParent(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  await db
    .update(users)
    .set({ status: "inactive", updatedAt: new Date() })
    .where(and(eq(users.id, id), eq(users.schoolId, schoolId), eq(users.role, "parent")));
  revalidatePath("/admin/ortu");
}
