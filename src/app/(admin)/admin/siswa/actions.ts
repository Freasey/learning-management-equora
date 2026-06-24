"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, users, enrollments } from "@/db";
import { requireSchoolAdmin } from "@/lib/auth-guard";
import { assertQuota, getSchoolPlan, countRole } from "@/lib/quota";
import { getClassYear } from "@/lib/academic";
import { ensureMembership } from "@/lib/membership";

async function usernameTaken(schoolId: string, username: string) {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.schoolId, schoolId), eq(users.username, username)))
    .limit(1);
  return Boolean(row);
}

async function enroll(schoolId: string, studentId: string, classId: string) {
  // Satu siswa = satu kelas aktif: bersihkan dulu lalu pasang.
  await db.delete(enrollments).where(
    and(eq(enrollments.schoolId, schoolId), eq(enrollments.studentId, studentId)),
  );
  if (classId) {
    const academicYearId = await getClassYear(schoolId, classId);
    await db.insert(enrollments).values({ schoolId, classId, studentId, academicYearId });
  }
}

const addSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  username: z.string().min(3, "NIS/username minimal 3 karakter"),
  password: z.string().min(4, "Kata sandi minimal 4 karakter"),
  classId: z.string().optional().or(z.literal("")),
});

export async function addStudent(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const parsed = addSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    password: formData.get("password"),
    classId: formData.get("classId"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);

  await assertQuota(schoolId, "student");
  if (await usernameTaken(schoolId, parsed.data.username)) {
    throw new Error(`NIS/username "${parsed.data.username}" sudah dipakai.`);
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const [student] = await db
    .insert(users)
    .values({
      schoolId,
      role: "student",
      name: parsed.data.name,
      username: parsed.data.username,
      passwordHash,
      status: "active",
    })
    .returning({ id: users.id });
  await ensureMembership(student.id, schoolId, ["student"]);

  if (parsed.data.classId) {
    await enroll(schoolId, student.id, parsed.data.classId);
  }

  revalidatePath("/admin/siswa");
}

export async function bulkAddStudents(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const raw = String(formData.get("rows") ?? "");
  const password = String(formData.get("password") || "siswa12345");
  const classId = String(formData.get("classId") || "");

  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) throw new Error("Tidak ada data untuk diimpor.");

  // Cek kuota total.
  const plan = await getSchoolPlan(schoolId);
  if (plan?.quotaStudents != null) {
    const used = await countRole(schoolId, "student");
    if (used + lines.length > plan.quotaStudents) {
      throw new Error(
        `Impor melebihi kuota siswa (${used}+${lines.length} > ${plan.quotaStudents}).`,
      );
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  let added = 0;
  for (const line of lines) {
    const [name, username] = line.split(",").map((s) => s.trim());
    if (!name || !username) continue;
    if (await usernameTaken(schoolId, username)) continue;

    const [student] = await db
      .insert(users)
      .values({
        schoolId,
        role: "student",
        name,
        username,
        passwordHash,
        status: "active",
      })
      .returning({ id: users.id });
    await ensureMembership(student.id, schoolId, ["student"]);
    if (classId) await enroll(schoolId, student.id, classId);
    added++;
  }

  if (added === 0) throw new Error("Tidak ada siswa baru ditambahkan (mungkin semua NIS sudah ada).");
  revalidatePath("/admin/siswa");
}

export async function setStudentClass(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const studentId = z.string().uuid().parse(formData.get("studentId"));
  const classId = String(formData.get("classId") || "");
  await enroll(schoolId, studentId, classId);
  revalidatePath("/admin/siswa");
}

export async function deleteStudent(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  // Soft-delete: tandai inactive agar nilai & pengerjaan siswa tetap tersimpan.
  await db
    .update(users)
    .set({ status: "inactive", updatedAt: new Date() })
    .where(and(eq(users.id, id), eq(users.schoolId, schoolId), eq(users.role, "student")));
  revalidatePath("/admin/siswa");
}
