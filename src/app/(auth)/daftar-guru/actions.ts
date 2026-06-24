"use server";

import { AuthError } from "next-auth";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, schools, users, memberships, academicYears } from "@/db";
import { signIn } from "@/auth";
import { slugify, randomCode } from "@/lib/ids";

export type RegisterTeacherState = { message: string } | undefined;

const schema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  level: z.enum(["SD", "SMP", "SMA", "SMK"]),
  workspaceName: z.string().optional(),
});

/**
 * Registrasi GURU INDEPENDEN (tanpa sekolah). Membuat sebuah workspace
 * PERSONAL (schools.type = "personal") tempat guru menjadi pemilik:
 * ia memegang peran school_admin + teacher sekaligus, sehingga bisa
 * mengelola kelas pribadinya (/admin) dan mengajar (/guru).
 */
export async function registerIndependentTeacher(
  _prev: RegisterTeacherState,
  formData: FormData,
): Promise<RegisterTeacherState> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    level: formData.get("level"),
    workspaceName: formData.get("workspaceName"),
  });
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const { name, email, password, level, workspaceName } = parsed.data;

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) return { message: "Email ini sudah terdaftar. Coba masuk." };

  const wsName = (workspaceName?.trim() || `Kelas ${name}`).slice(0, 80);
  const baseSlug = slugify(wsName) || "kelas";

  // 1) Workspace personal (paket gratis "starting").
  const [ws] = await db
    .insert(schools)
    .values({
      name: wsName,
      type: "personal",
      level,
      planKey: "starting",
      slug: `${baseSlug}-${randomCode(4).toLowerCase()}`,
      code: randomCode(),
      status: "active",
      contactEmail: email,
    })
    .returning({ id: schools.id });

  // 2) Akun guru (home = workspace personal-nya).
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(users)
    .values({
      schoolId: ws.id,
      role: "teacher",
      name,
      email,
      passwordHash,
      status: "active",
    })
    .returning({ id: users.id });

  // 3) Keanggotaan pemilik: kelola + mengajar.
  await db.insert(memberships).values({
    userId: user.id,
    schoolId: ws.id,
    roles: "school_admin,teacher",
    isOwner: true,
    status: "active",
  });

  // 4) Tahun ajaran aktif agar fitur akademik langsung jalan.
  const y = new Date().getFullYear();
  await db.insert(academicYears).values({
    schoolId: ws.id,
    name: `${y}/${y + 1} Ganjil`,
    isActive: true,
  });

  try {
    await signIn("credentials", { identifier: email, password, redirectTo: "/guru" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "Akun dibuat, tetapi gagal masuk otomatis. Silakan login." };
    }
    throw error; // re-throw redirect (sukses)
  }

  return undefined;
}
