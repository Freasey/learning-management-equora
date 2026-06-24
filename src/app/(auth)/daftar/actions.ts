"use server";

import { AuthError } from "next-auth";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, schools, users, memberships } from "@/db";
import { signIn } from "@/auth";
import { slugify, randomCode } from "@/lib/ids";

export type RegisterState = { message: string } | undefined;

const schema = z.object({
  schoolName: z.string().min(2, "Nama sekolah minimal 2 karakter"),
  level: z.enum(["SD", "SMP", "SMA", "SMK"]),
  adminName: z.string().min(2, "Nama Anda minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  planKey: z.string().min(1, "Pilih paket"),
});

export async function registerSchool(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = schema.safeParse({
    schoolName: formData.get("schoolName"),
    level: formData.get("level"),
    adminName: formData.get("adminName"),
    email: formData.get("email"),
    password: formData.get("password"),
    planKey: formData.get("planKey"),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const { schoolName, level, adminName, email, password, planKey } = parsed.data;

  // Email harus unik secara global.
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    return { message: "Email ini sudah terdaftar. Coba masuk." };
  }

  // Buat sekolah baru (tenant).
  const baseSlug = slugify(schoolName) || "sekolah";
  const [school] = await db
    .insert(schools)
    .values({
      name: schoolName,
      level,
      planKey,
      slug: `${baseSlug}-${randomCode(4).toLowerCase()}`,
      code: randomCode(),
      status: "trial",
      contactEmail: email,
    })
    .returning();

  // Buat akun admin sekolah (= pemilik workspace).
  const passwordHash = await bcrypt.hash(password, 10);
  const [admin] = await db
    .insert(users)
    .values({
      schoolId: school.id,
      role: "school_admin",
      name: adminName,
      email,
      passwordHash,
      status: "active",
    })
    .returning({ id: users.id });

  // Keanggotaan pemilik — peran bisa ditambah (mis. "teacher") nanti.
  await db.insert(memberships).values({
    userId: admin.id,
    schoolId: school.id,
    roles: "school_admin",
    isOwner: true,
    status: "active",
  });

  // Auto-login lalu arahkan ke dashboard sekolah.
  try {
    await signIn("credentials", {
      identifier: email,
      password,
      redirectTo: `/admin/langganan/checkout?plan=${planKey}`,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "Akun dibuat, tetapi gagal masuk otomatis. Silakan login." };
    }
    throw error; // re-throw redirect (sukses)
  }

  return undefined;
}
