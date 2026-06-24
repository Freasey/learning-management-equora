"use server";

import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, gradeItems, grades } from "@/db";
import { requireTeacher } from "@/lib/auth-guard";
import { getClassYear } from "@/lib/academic";

function pairOf(classId: string, subjectId: string) {
  return encodeURIComponent(`${classId}:${subjectId}`);
}

const itemSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  title: z.string().min(2, "Judul penilaian minimal 2 karakter"),
  maxScore: z.coerce.number().int().min(1).max(1000),
});

export async function addGradeItem(formData: FormData) {
  const { schoolId, teacherId } = await requireTeacher();
  const parsed = itemSchema.safeParse({
    classId: formData.get("classId"),
    subjectId: formData.get("subjectId"),
    title: formData.get("title"),
    maxScore: formData.get("maxScore"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);

  const academicYearId = await getClassYear(schoolId, parsed.data.classId);
  await db.insert(gradeItems).values({
    schoolId,
    academicYearId,
    teacherId,
    classId: parsed.data.classId,
    subjectId: parsed.data.subjectId,
    title: parsed.data.title,
    maxScore: parsed.data.maxScore,
  });
  redirect(`/guru/nilai?pair=${pairOf(parsed.data.classId, parsed.data.subjectId)}`);
}

export async function deleteGradeItem(formData: FormData) {
  const { schoolId } = await requireTeacher();
  const id = z.string().uuid().parse(formData.get("id"));
  const classId = z.string().uuid().parse(formData.get("classId"));
  const subjectId = z.string().uuid().parse(formData.get("subjectId"));
  await db
    .delete(gradeItems)
    .where(and(eq(gradeItems.id, id), eq(gradeItems.schoolId, schoolId)));
  redirect(`/guru/nilai?pair=${pairOf(classId, subjectId)}`);
}

export async function saveGrades(formData: FormData) {
  const { schoolId } = await requireTeacher();
  const gradeItemId = z.string().uuid().parse(formData.get("gradeItemId"));
  const classId = z.string().uuid().parse(formData.get("classId"));
  const subjectId = z.string().uuid().parse(formData.get("subjectId"));

  // Pastikan item milik sekolah ini.
  const [item] = await db
    .select()
    .from(gradeItems)
    .where(and(eq(gradeItems.id, gradeItemId), eq(gradeItems.schoolId, schoolId)))
    .limit(1);
  if (!item) throw new Error("Item penilaian tidak ditemukan.");

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("score_")) continue;
    const studentId = key.slice(6);
    const raw = String(value).trim();

    if (raw === "") {
      await db
        .delete(grades)
        .where(and(eq(grades.gradeItemId, gradeItemId), eq(grades.studentId, studentId)));
      continue;
    }
    const score = Math.max(0, Math.min(item.maxScore, Math.trunc(Number(raw))));
    if (!Number.isFinite(score)) continue;

    await db
      .insert(grades)
      .values({ schoolId, academicYearId: item.academicYearId, gradeItemId, studentId, score })
      .onConflictDoUpdate({
        target: [grades.gradeItemId, grades.studentId],
        set: { score },
      });
  }

  redirect(`/guru/nilai?pair=${pairOf(classId, subjectId)}&item=${gradeItemId}`);
}
