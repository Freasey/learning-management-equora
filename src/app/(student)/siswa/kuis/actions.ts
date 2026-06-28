"use server";

import { redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, withTenant, assessments, questions, attempts, answers, gradeItems, grades } from "@/db";
import { requireStudent } from "@/lib/auth-guard";
import { getStudentClass } from "@/lib/student";
import { notify } from "@/lib/notify";
import { uploadFile } from "@/lib/storage";

/** Tulis/timpa nilai siswa ke item nilai tertaut assessment. */
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

export async function submitAttempt(formData: FormData) {
  const { schoolId, studentId } = await requireStudent();
  const assessmentId = z.string().uuid().parse(formData.get("assessmentId"));

  await withTenant(schoolId, async () => {
  const [a] = await db
    .select()
    .from(assessments)
    .where(
      and(
        eq(assessments.id, assessmentId),
        eq(assessments.schoolId, schoolId),
        eq(assessments.status, "published"),
      ),
    )
    .limit(1);
  if (!a) throw new Error("Kuis tidak tersedia.");

  const cls = await getStudentClass(schoolId, studentId);
  if (!cls || cls.classId !== a.classId) throw new Error("Kuis ini bukan untuk kelasmu.");

  // Cegah pengerjaan ganda.
  const [existing] = await db
    .select({ id: attempts.id })
    .from(attempts)
    .where(and(eq(attempts.assessmentId, assessmentId), eq(attempts.studentId, studentId)))
    .limit(1);
  if (existing) redirect(`/siswa/kuis/${assessmentId}`);

  const qs = await db
    .select()
    .from(questions)
    .where(eq(questions.assessmentId, assessmentId))
    .orderBy(asc(questions.sortOrder));

  let autoScore = 0;
  let maxScore = 0;
  let hasEssay = false;

  const rows: {
    questionId: string;
    choiceIndex: number | null;
    essayText: string | null;
    fileUrl: string | null;
    awardedPoints: number | null;
    isCorrect: boolean | null;
  }[] = [];

  for (const q of qs) {
    maxScore += q.points;
    if (q.type === "mc") {
      const raw = formData.get(`choice_${q.id}`);
      const choiceIndex = raw === null || raw === "" ? null : Number(raw);
      const isCorrect = choiceIndex !== null && choiceIndex === q.correctIndex;
      const awarded = isCorrect ? q.points : 0;
      autoScore += awarded;
      rows.push({
        questionId: q.id,
        choiceIndex,
        essayText: null,
        fileUrl: null,
        awardedPoints: awarded,
        isCorrect,
      });
      continue;
    }
    hasEssay = true;
    // Lampiran jawaban esai (opsional).
    let fileUrl: string | null = null;
    const f = formData.get(`essayfile_${q.id}`);
    if (f instanceof File && f.size > 0) {
      const stored = await uploadFile({
        schoolId,
        ownerId: studentId,
        file: f,
        kind: "attachment",
        prefix: "answers",
        maxBytes: 10_000_000,
      });
      fileUrl = stored.url;
    }
    rows.push({
      questionId: q.id,
      choiceIndex: null,
      essayText: String(formData.get(`essay_${q.id}`) || ""),
      fileUrl,
      awardedPoints: null,
      isCorrect: null,
    });
  }

  const status = hasEssay ? "submitted" : "graded";
  const totalScore = hasEssay ? null : autoScore;

  const [att] = await db
    .insert(attempts)
    .values({
      schoolId,
      academicYearId: a.academicYearId,
      assessmentId,
      studentId,
      status,
      autoScore,
      totalScore,
      maxScore,
    })
    .returning({ id: attempts.id });

  if (rows.length) {
    await db.insert(answers).values(
      rows.map((r) => ({ ...r, schoolId, attemptId: att.id })),
    );
  }

  if (status === "graded") {
    await writeGrade(schoolId, assessmentId, studentId, autoScore, a.academicYearId);
  } else if (a.teacherId) {
    // B1: ada esai → beri tahu guru untuk mengoreksi.
    await notify({
      userId: a.teacherId,
      schoolId,
      type: "info",
      title: "Esai menunggu koreksi",
      body: `Seorang siswa mengumpulkan "${a.title}".`,
      href: `/guru/kuis/${a.id}`,
    });
  }

  redirect(`/siswa/kuis/${assessmentId}`);
  });
}
