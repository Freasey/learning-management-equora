"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, assessments, questions, gradeItems, attempts, answers, grades } from "@/db";
import { requireTeacher } from "@/lib/auth-guard";
import { getActiveYear } from "@/lib/academic";

async function writeGrade(
  schoolId: string,
  assessmentId: string,
  studentId: string,
  score: number,
  academicYearId: string | null,
) {
  const [gi] = await db
    .select({ id: gradeItems.id })
    .from(gradeItems)
    .where(and(eq(gradeItems.assessmentId, assessmentId), eq(gradeItems.schoolId, schoolId)))
    .limit(1);
  if (!gi) return;
  await db
    .insert(grades)
    .values({ schoolId, academicYearId, gradeItemId: gi.id, studentId, score })
    .onConflictDoUpdate({
      target: [grades.gradeItemId, grades.studentId],
      set: { score },
    });
}

/** Beri nilai jawaban esai → hitung ulang total → tulis ke gradebook. */
export async function gradeEssays(formData: FormData) {
  const { schoolId } = await requireTeacher();
  const attemptId = z.string().uuid().parse(formData.get("attemptId"));

  const [att] = await db
    .select()
    .from(attempts)
    .where(and(eq(attempts.id, attemptId), eq(attempts.schoolId, schoolId)))
    .limit(1);
  if (!att) throw new Error("Pengerjaan tidak ditemukan.");

  const rows = await db
    .select({
      answerId: answers.id,
      type: questions.type,
      points: questions.points,
      awarded: answers.awardedPoints,
    })
    .from(answers)
    .innerJoin(questions, eq(questions.id, answers.questionId))
    .where(eq(answers.attemptId, attemptId));

  let total = 0;
  let anyPending = false;
  for (const r of rows) {
    if (r.type === "essay") {
      const raw = formData.get(`award_${r.answerId}`);
      if (raw === null || String(raw).trim() === "") {
        anyPending = true;
        continue;
      }
      const val = Math.max(0, Math.min(r.points, Math.trunc(Number(raw))));
      await db.update(answers).set({ awardedPoints: val }).where(eq(answers.id, r.answerId));
      total += val;
    } else {
      total += r.awarded ?? 0;
    }
  }

  const status = anyPending ? "submitted" : "graded";
  await db
    .update(attempts)
    .set({ status, totalScore: anyPending ? null : total })
    .where(eq(attempts.id, attemptId));

  if (!anyPending) {
    await writeGrade(schoolId, att.assessmentId, att.studentId, total, att.academicYearId);
  }
  revalidatePath(`/guru/kuis/${att.assessmentId}`);
  revalidatePath(`/guru/kuis/${att.assessmentId}/koreksi/${attemptId}`);
}

type AssessmentRow = typeof assessments.$inferSelect;

/** Pastikan ada item nilai tertaut untuk assessment (idempotent). */
async function ensureGradeItem(schoolId: string, a: AssessmentRow) {
  if (!a.classId) return; // butuh kelas untuk menautkan
  const [existing] = await db
    .select({ id: gradeItems.id })
    .from(gradeItems)
    .where(eq(gradeItems.assessmentId, a.id))
    .limit(1);
  if (existing) return;

  const qrows = await db
    .select({ points: questions.points })
    .from(questions)
    .where(eq(questions.assessmentId, a.id));
  const total = qrows.reduce((s, q) => s + q.points, 0) || 100;

  await db.insert(gradeItems).values({
    schoolId,
    academicYearId: a.academicYearId,
    teacherId: a.teacherId,
    classId: a.classId,
    subjectId: a.subjectId,
    title: a.title,
    maxScore: total,
    source: "assessment",
    assessmentId: a.id,
  });
}

async function ownAssessment(schoolId: string, id: string) {
  const [a] = await db
    .select()
    .from(assessments)
    .where(and(eq(assessments.id, id), eq(assessments.schoolId, schoolId)))
    .limit(1);
  if (!a) throw new Error("Kuis tidak ditemukan.");
  return a;
}

const createSchema = z.object({
  title: z.string().min(2, "Judul minimal 2 karakter"),
  type: z.enum(["quiz", "exam"]),
  subjectId: z.string().uuid("Pilih mapel"),
  classId: z.string().uuid("Pilih kelas"),
  durationMin: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.coerce.number().int().min(1).nullable(),
  ),
});

export async function createAssessment(formData: FormData) {
  const { schoolId, teacherId } = await requireTeacher();
  const parsed = createSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    subjectId: formData.get("subjectId"),
    classId: formData.get("classId"),
    durationMin: formData.get("durationMin"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);

  const year = await getActiveYear(schoolId);
  const [created] = await db
    .insert(assessments)
    .values({
      schoolId,
      academicYearId: year?.id ?? null,
      teacherId,
      subjectId: parsed.data.subjectId,
      classId: parsed.data.classId,
      title: parsed.data.title,
      type: parsed.data.type,
      durationMin: parsed.data.durationMin,
      status: "draft",
    })
    .returning({ id: assessments.id });

  redirect(`/guru/kuis/${created.id}`);
}

export async function deleteAssessment(formData: FormData) {
  const { schoolId } = await requireTeacher();
  const id = z.string().uuid().parse(formData.get("id"));
  await db
    .delete(assessments)
    .where(and(eq(assessments.id, id), eq(assessments.schoolId, schoolId)));
  revalidatePath("/guru/kuis");
}

export async function setAssessmentStatus(formData: FormData) {
  const { schoolId } = await requireTeacher();
  const id = z.string().uuid().parse(formData.get("id"));
  const status = z.enum(["draft", "published"]).parse(formData.get("status"));
  const a = await ownAssessment(schoolId, id);
  await db.update(assessments).set({ status }).where(eq(assessments.id, id));
  // Saat diterbitkan & dihitung ke nilai → buat item nilai tertaut.
  if (status === "published" && a.countToGrade) await ensureGradeItem(schoolId, a);
  revalidatePath(`/guru/kuis/${id}`);
}

export async function toggleCountToGrade(formData: FormData) {
  const { schoolId } = await requireTeacher();
  const id = z.string().uuid().parse(formData.get("id"));
  const a = await ownAssessment(schoolId, id);
  const next = !a.countToGrade;
  await db.update(assessments).set({ countToGrade: next }).where(eq(assessments.id, id));

  if (next) {
    if (a.status === "published") await ensureGradeItem(schoolId, a);
  } else {
    // Tidak dihitung → lepas item nilai tertaut.
    await db.delete(gradeItems).where(eq(gradeItems.assessmentId, id));
  }
  revalidatePath(`/guru/kuis/${id}`);
}

export type QuestionState = { error: string } | undefined;

const questionSchema = z.object({
  assessmentId: z.string().uuid(),
  type: z.enum(["mc", "essay"]),
  text: z.string().min(2, "Tulis pertanyaan dulu."),
  points: z.coerce.number().int().min(1).max(100),
});

export async function addQuestion(
  _prev: QuestionState,
  formData: FormData,
): Promise<QuestionState> {
  const { schoolId } = await requireTeacher();
  const parsed = questionSchema.safeParse({
    assessmentId: formData.get("assessmentId"),
    type: formData.get("type"),
    text: formData.get("text"),
    points: formData.get("points"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const [owned] = await db
    .select({ id: assessments.id })
    .from(assessments)
    .where(and(eq(assessments.id, parsed.data.assessmentId), eq(assessments.schoolId, schoolId)))
    .limit(1);
  if (!owned) return { error: "Kuis tidak ditemukan." };

  let options: string[] | null = null;
  let correctIndex: number | null = null;

  if (parsed.data.type === "mc") {
    options = [0, 1, 2, 3]
      .map((i) => String(formData.get(`option_${i}`) || "").trim())
      .filter(Boolean);
    if (options.length < 2) return { error: "Pilihan ganda butuh minimal 2 opsi." };
    correctIndex = Number(formData.get("correctIndex"));
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
      return { error: "Tandai jawaban benar yang valid." };
    }
  }

  const count = await db.$count(
    questions,
    eq(questions.assessmentId, parsed.data.assessmentId),
  );

  await db.insert(questions).values({
    schoolId,
    assessmentId: parsed.data.assessmentId,
    type: parsed.data.type,
    text: parsed.data.text,
    options,
    correctIndex,
    points: parsed.data.points,
    sortOrder: count,
  });
  revalidatePath(`/guru/kuis/${parsed.data.assessmentId}`);
  return undefined;
}

export async function deleteQuestion(formData: FormData) {
  const { schoolId } = await requireTeacher();
  const id = z.string().uuid().parse(formData.get("id"));
  const assessmentId = z.string().uuid().parse(formData.get("assessmentId"));
  await db
    .delete(questions)
    .where(and(eq(questions.id, id), eq(questions.schoolId, schoolId)));
  revalidatePath(`/guru/kuis/${assessmentId}`);
}
