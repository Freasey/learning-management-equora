"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, withTenant, assessments, questions, attempts, answers, gradeItems, grades, users } from "@/db";
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

  // Kuis bermode game dikerjakan lewat game (aksi startGameAttempt), bukan form
  // biasa  kecuali siswa tunanetra yang otomatis mendapat versi kuis biasa.
  if (a.gameType && !(await isBlindStudent(studentId))) {
    throw new Error("Kuis ini dikerjakan lewat mode game.");
  }

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

/* ============================================================
 * Mode game (kuis latihan bergamifikasi)
 *
 * Anti-curang: kunci jawaban TIDAK pernah dikirim ke browser. Tiap soal
 * dinilai lewat answerGameQuestion  server yang memutus benar/salah dan
 * mencatat jawaban SEKALI (baris answers = gembok; soal terjawab tidak bisa
 * dijawab ulang, termasuk lewat reload halaman).
 * ============================================================ */

/** Siswa tunanetra otomatis mendapat versi kuis biasa (game butuh visual+refleks). */
async function isBlindStudent(studentId: string): Promise<boolean> {
  const [me] = await db
    .select({ disabilities: users.disabilities })
    .from(users)
    .where(eq(users.id, studentId))
    .limit(1);
  return Boolean(me?.disabilities?.includes("netra"));
}

/** Assessment bermode game yang sah untuk siswa ini, atau lempar error. */
async function gameAssessmentFor(schoolId: string, studentId: string, assessmentId: string) {
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
  if (!a?.gameType) throw new Error("Kuis ini tidak bermode game.");
  const cls = await getStudentClass(schoolId, studentId);
  if (!cls || cls.classId !== a.classId) throw new Error("Kuis ini bukan untuk kelasmu.");
  return a;
}

/**
 * Mulai pengerjaan mode game: buat attempt status "playing" (sekali; kalau
 * sudah ada, kembalikan yang ada supaya reload halaman melanjutkan, bukan
 * mengulang). maxScore di-snapshot di awal seperti kuis biasa.
 */
export async function startGameAttempt(assessmentId: string): Promise<{ attemptId: string }> {
  const { schoolId, studentId } = await requireStudent();
  z.string().uuid().parse(assessmentId);

  return withTenant(schoolId, async () => {
    const a = await gameAssessmentFor(schoolId, studentId, assessmentId);

    const [existing] = await db
      .select({ id: attempts.id, status: attempts.status })
      .from(attempts)
      .where(and(eq(attempts.assessmentId, assessmentId), eq(attempts.studentId, studentId)))
      .limit(1);
    if (existing) {
      if (existing.status !== "playing") throw new Error("Kuis ini sudah kamu kerjakan.");
      return { attemptId: existing.id };
    }

    const qs = await db
      .select({ points: questions.points })
      .from(questions)
      .where(eq(questions.assessmentId, assessmentId));
    const maxScore = qs.reduce((s, q) => s + q.points, 0);

    const [att] = await db
      .insert(attempts)
      .values({
        schoolId,
        academicYearId: a.academicYearId,
        assessmentId,
        studentId,
        status: "playing",
        autoScore: 0,
        totalScore: null,
        maxScore,
      })
      .returning({ id: attempts.id });
    return { attemptId: att.id };
  });
}

const gameAnswerSchema = z.object({
  attemptId: z.string().uuid(),
  questionId: z.string().uuid(),
  cause: z.enum(["answer", "death", "timeout"]),
  // Wajib saat cause="answer" (memakan buah); null saat mati/waktu habis.
  choiceIndex: z.number().int().min(0).max(9).nullable(),
});

/**
 * Nilai satu soal mode game di server. Mengembalikan benar/salah + kunci
 * (untuk umpan balik  soal sudah terkunci, tidak bisa dijawab ulang).
 */
export async function answerGameQuestion(input: {
  attemptId: string;
  questionId: string;
  cause: "answer" | "death" | "timeout";
  choiceIndex: number | null;
}): Promise<{ correct: boolean; correctIndex: number }> {
  const { schoolId, studentId } = await requireStudent();
  const parsed = gameAnswerSchema.parse(input);
  if (parsed.cause === "answer" && parsed.choiceIndex === null) {
    throw new Error("Jawaban tidak valid.");
  }

  return withTenant(schoolId, async () => {
    const [att] = await db
      .select({ id: attempts.id, assessmentId: attempts.assessmentId, status: attempts.status })
      .from(attempts)
      .where(
        and(
          eq(attempts.id, parsed.attemptId),
          eq(attempts.schoolId, schoolId),
          eq(attempts.studentId, studentId),
        ),
      )
      .limit(1);
    if (!att || att.status !== "playing") throw new Error("Pengerjaan tidak aktif.");

    const [q] = await db
      .select({ correctIndex: questions.correctIndex, points: questions.points, type: questions.type })
      .from(questions)
      .where(and(eq(questions.id, parsed.questionId), eq(questions.assessmentId, att.assessmentId)))
      .limit(1);
    if (!q || q.type !== "mc" || q.correctIndex === null) throw new Error("Soal tidak valid.");

    // Gembok: soal yang sudah terjawab dikembalikan apa adanya (idempoten
    // terhadap klik ganda / reload), tidak dinilai ulang.
    const [prev] = await db
      .select({ isCorrect: answers.isCorrect })
      .from(answers)
      .where(and(eq(answers.attemptId, att.id), eq(answers.questionId, parsed.questionId)))
      .limit(1);
    if (prev) return { correct: Boolean(prev.isCorrect), correctIndex: q.correctIndex };

    const correct = parsed.cause === "answer" && parsed.choiceIndex === q.correctIndex;
    const awarded = correct ? q.points : 0;

    await db.insert(answers).values({
      schoolId,
      attemptId: att.id,
      questionId: parsed.questionId,
      choiceIndex: parsed.cause === "answer" ? parsed.choiceIndex : null,
      essayText: null,
      fileUrl: null,
      awardedPoints: awarded,
      isCorrect: correct,
      gameCause: parsed.cause,
    });
    if (awarded > 0) {
      await db
        .update(attempts)
        .set({ autoScore: sql`${attempts.autoScore} + ${awarded}` })
        .where(eq(attempts.id, att.id));
    }

    return { correct, correctIndex: q.correctIndex };
  });
}

/** Tutup pengerjaan mode game setelah semua soal terjawab → langsung ternilai. */
export async function finishGameAttempt(attemptId: string): Promise<void> {
  const { schoolId, studentId } = await requireStudent();
  z.string().uuid().parse(attemptId);

  await withTenant(schoolId, async () => {
    const [att] = await db
      .select()
      .from(attempts)
      .where(
        and(
          eq(attempts.id, attemptId),
          eq(attempts.schoolId, schoolId),
          eq(attempts.studentId, studentId),
        ),
      )
      .limit(1);
    if (!att) throw new Error("Pengerjaan tidak ditemukan.");
    if (att.status !== "playing") return; // sudah ditutup (idempoten)

    const totalQuestions = await db.$count(questions, eq(questions.assessmentId, att.assessmentId));
    const answered = await db.$count(answers, eq(answers.attemptId, att.id));
    if (answered < totalQuestions) throw new Error("Masih ada soal yang belum terjawab.");

    await db
      .update(attempts)
      .set({ status: "graded", totalScore: att.autoScore })
      .where(eq(attempts.id, att.id));
    // Kuis game = latihan (countToGrade false), jadi tidak menulis ke gradebook.
    revalidatePath(`/siswa/kuis/${att.assessmentId}`);
  });
}
