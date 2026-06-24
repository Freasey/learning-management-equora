"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, users, memberships } from "@/db";
import { requireSchoolAdmin } from "@/lib/auth-guard";
import { assertQuota } from "@/lib/quota";
import { ensureMembership, parseRoles, serializeRoles } from "@/lib/membership";
import { logAudit } from "@/lib/audit";

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
  const [created] = await db
    .insert(users)
    .values({
      schoolId,
      role: "teacher",
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      status: "active",
    })
    .returning({ id: users.id });
  // A7: materialkan membership agar peran punya satu sumber yang konsisten.
  await ensureMembership(created.id, schoolId, ["teacher"]);

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

/**
 * Tambah/cabut sebuah peran (school_admin | teacher) pada keanggotaan seorang
 * anggota di workspace ini. Membuat baris membership bila belum ada (lazy).
 * Dipakai untuk: jadikan guru co-admin, atau admin mengaktifkan "saya juga
 * mengajar" (userId = dirinya sendiri).
 *
 * Catatan: perubahan peran pada AKUN SENDIRI baru aktif setelah keluar lalu
 * masuk lagi (sesi membaca peran saat login).
 */
export async function toggleMemberRole(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const userId = z.string().uuid().parse(formData.get("userId"));
  const role = z.enum(["school_admin", "teacher"]).parse(formData.get("role"));

  const [u] = await db
    .select({ id: users.id, role: users.role, schoolId: users.schoolId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) throw new Error("Anggota tidak ditemukan.");

  // Fallback roles hanya terpakai bila belum ada baris (anggota home).
  const m = await ensureMembership(
    userId,
    schoolId,
    u.schoolId === schoolId ? [u.role] : ["teacher"],
  );

  let roles = parseRoles(m.roles);
  roles = roles.includes(role)
    ? roles.filter((r) => r !== role)
    : [...roles, role];

  if (roles.length === 0) {
    throw new Error("Anggota harus memiliki minimal satu peran.");
  }
  if (m.isOwner && !roles.includes("school_admin")) {
    throw new Error("Pemilik workspace tidak bisa melepas peran admin.");
  }

  await db
    .update(memberships)
    .set({ roles: serializeRoles(roles) })
    .where(eq(memberships.id, m.id));

  revalidatePath("/admin/guru");
}

export async function deleteTeacher(formData: FormData) {
  const { session, schoolId } = await requireSchoolAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  // Soft-delete: tandai inactive (auth & listing otomatis mengabaikan) agar
  // jejak akademik (nilai yang ia buat, dll.) tak hilang permanen.
  await db
    .update(users)
    .set({ status: "inactive", updatedAt: new Date() })
    .where(and(eq(users.id, id), eq(users.schoolId, schoolId), eq(users.role, "teacher")));
  await logAudit({
    schoolId,
    actorId: session?.user?.id,
    action: "teacher.delete",
    target: id,
  });
  revalidatePath("/admin/guru");
}
