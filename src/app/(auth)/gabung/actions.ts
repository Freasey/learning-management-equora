"use server";

import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, schools, users, memberships } from "@/db";
import { auth } from "@/auth";

export type JoinState = { ok: boolean; message: string } | undefined;

const schema = z.object({
  code: z.string().min(4, "Kode sekolah tidak valid"),
  role: z.enum(["teacher", "student"]),
  name: z.string().min(2, "Nama minimal 2 karakter"),
  identifier: z.string().min(3, "Email/NIS wajib diisi"),
  password: z.string().min(4, "Kata sandi minimal 4 karakter"),
});

export async function joinSchool(
  _prev: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const code = String(formData.get("code") || "").trim().toUpperCase();
  if (code.length < 4) return { ok: false, message: "Kode sekolah tidak valid." };

  const [school] = await db
    .select()
    .from(schools)
    .where(eq(schools.code, code))
    .limit(1);
  if (!school) return { ok: false, message: "Kode sekolah tidak ditemukan." };

  // ── Jalur A: sudah login (mis. guru dengan workspace pribadi) → tambahkan
  // KEANGGOTAAN ke sekolah ini tanpa membuat akun baru. Menunggu persetujuan.
  const session = await auth();
  if (session?.user?.id) {
    if (school.id === session.user.schoolId) {
      return { ok: false, message: "Ini adalah workspace utama Anda." };
    }
    const [dup] = await db
      .select({ id: memberships.id })
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, session.user.id),
          eq(memberships.schoolId, school.id),
        ),
      )
      .limit(1);
    if (dup) {
      return { ok: false, message: "Anda sudah terhubung / menunggu di sekolah ini." };
    }
    await db.insert(memberships).values({
      userId: session.user.id,
      schoolId: school.id,
      roles: "teacher",
      status: "pending",
    });
    return {
      ok: true,
      message: `Permintaan gabung ke ${school.name} terkirim dari akun Anda. Menunggu persetujuan admin.`,
    };
  }

  // ── Jalur B: belum punya akun → buat akun baru berstatus pending (alur lama).
  const parsed = schema.safeParse({
    code,
    role: formData.get("role"),
    name: formData.get("name"),
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const { role, name, identifier, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  if (role === "teacher") {
    if (!z.string().email().safeParse(identifier).success) {
      return { ok: false, message: "Guru harus mendaftar dengan email yang valid." };
    }
    const [exists] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, identifier))
      .limit(1);
    if (exists) return { ok: false, message: "Email sudah terdaftar." };

    await db.insert(users).values({
      schoolId: school.id,
      role: "teacher",
      name,
      email: identifier,
      passwordHash,
      status: "pending",
    });
  } else {
    const [exists] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.schoolId, school.id), eq(users.username, identifier)))
      .limit(1);
    if (exists) return { ok: false, message: "NIS/username sudah terdaftar di sekolah ini." };

    await db.insert(users).values({
      schoolId: school.id,
      role: "student",
      name,
      username: identifier,
      passwordHash,
      status: "pending",
    });
  }

  return {
    ok: true,
    message: `Pendaftaran ke ${school.name} terkirim. Menunggu persetujuan admin sekolah.`,
  };
}
