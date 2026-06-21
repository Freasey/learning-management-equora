"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, users, enrollments } from "@/db";
import { requireSchoolAdmin } from "@/lib/auth-guard";
import { assertQuota } from "@/lib/quota";

export async function approveMember(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const classId = String(formData.get("classId") || "");

  const [member] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), eq(users.schoolId, schoolId), eq(users.status, "pending")))
    .limit(1);
  if (!member) throw new Error("Pendaftar tidak ditemukan.");

  await assertQuota(schoolId, member.role === "teacher" ? "teacher" : "student");

  await db
    .update(users)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(users.id, id));

  if (member.role === "student" && classId) {
    await db.insert(enrollments).values({ schoolId, classId, studentId: id });
  }

  revalidatePath("/admin/pendaftaran");
}

export async function rejectMember(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  await db
    .delete(users)
    .where(and(eq(users.id, id), eq(users.schoolId, schoolId), eq(users.status, "pending")));
  revalidatePath("/admin/pendaftaran");
}
