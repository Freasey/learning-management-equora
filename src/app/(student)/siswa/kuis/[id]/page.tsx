import { redirect, notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, assessments, questions, attempts, answers, subjects } from "@/db";
import { getStudentClass } from "@/lib/student";
import { submitAttempt } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kuis · Siswa" };

export default async function KuisKerjakanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  const studentId = session?.user?.id;
  if (!schoolId || !studentId || session?.user?.role !== "student") redirect("/dashboard");

  const { id } = await params;

  const [a] = await db
    .select({
      id: assessments.id,
      title: assessments.title,
      type: assessments.type,
      description: assessments.description,
      classId: assessments.classId,
      subjectName: subjects.name,
    })
    .from(assessments)
    .leftJoin(subjects, eq(subjects.id, assessments.subjectId))
    .where(and(eq(assessments.id, id), eq(assessments.schoolId, schoolId), eq(assessments.status, "published")))
    .limit(1);
  if (!a) notFound();

  const cls = await getStudentClass(schoolId, studentId);
  if (!cls || cls.classId !== a.classId) notFound();

  const [attempt] = await db
    .select()
    .from(attempts)
    .where(and(eq(attempts.assessmentId, id), eq(attempts.studentId, studentId)))
    .limit(1);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <span className="rounded-full bg-sky/15 px-2.5 py-0.5 text-xs font-bold text-sky">
          {a.type === "exam" ? "Ujian" : "Kuis"}
        </span>
        <h1 className="mt-2 font-kid-display text-2xl font-extrabold text-slate-800">{a.title}</h1>
        <p className="mt-1 text-slate-500">{a.subjectName}</p>
        {a.description && <p className="mt-2 text-sm text-slate-500">{a.description}</p>}
      </div>

      {attempt ? (
        <Result attemptId={attempt.id} status={attempt.status} totalScore={attempt.totalScore} autoScore={attempt.autoScore} maxScore={attempt.maxScore} />
      ) : (
        <AttemptForm assessmentId={a.id} />
      )}
    </div>
  );
}

async function AttemptForm({ assessmentId }: { assessmentId: string }) {
  const qs = await db
    .select()
    .from(questions)
    .where(eq(questions.assessmentId, assessmentId))
    .orderBy(asc(questions.sortOrder));

  if (qs.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
        Kuis ini belum punya soal.
      </div>
    );
  }

  return (
    <form action={submitAttempt} className="space-y-4">
      <input type="hidden" name="assessmentId" value={assessmentId} />
      {qs.map((q, i) => (
        <div key={q.id} className="rounded-3xl border-2 border-slate-200/70 bg-white p-5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-coral">Soal {i + 1}</span>
            <span className="text-xs font-semibold text-slate-400">{q.points} poin</span>
          </div>
          <p className="mt-2 font-bold text-slate-800">{q.text}</p>

          {q.type === "mc" && q.options ? (
            <div className="mt-3 space-y-2">
              {q.options.map((opt, idx) => (
                <label
                  key={idx}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-3 py-2.5 text-slate-700 has-checked:border-coral has-checked:bg-coral/5"
                >
                  <input type="radio" name={`choice_${q.id}`} value={idx} className="h-4 w-4 accent-coral" />
                  <span className="font-semibold">{String.fromCharCode(65 + idx)}. {opt}</span>
                </label>
              ))}
            </div>
          ) : (
            <textarea
              name={`essay_${q.id}`}
              rows={4}
              placeholder="Tulis jawabanmu…"
              className="mt-3 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-300 focus:border-sky focus:outline-none focus:ring-4 focus:ring-sky/15"
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        className="w-full rounded-2xl bg-coral py-4 text-base font-extrabold text-white shadow-[0_4px_0_#d8503f] transition active:translate-y-1 active:shadow-[0_1px_0_#d8503f]"
      >
        Kumpulkan Jawaban
      </button>
    </form>
  );
}

async function Result({
  attemptId,
  status,
  totalScore,
  autoScore,
  maxScore,
}: {
  attemptId: string;
  status: string;
  totalScore: number | null;
  autoScore: number;
  maxScore: number;
}) {
  const rows = await db
    .select({
      text: questions.text,
      type: questions.type,
      points: questions.points,
      options: questions.options,
      correctIndex: questions.correctIndex,
      choiceIndex: answers.choiceIndex,
      essayText: answers.essayText,
      awarded: answers.awardedPoints,
      isCorrect: answers.isCorrect,
      sortOrder: questions.sortOrder,
    })
    .from(answers)
    .innerJoin(questions, eq(questions.id, answers.questionId))
    .where(eq(answers.attemptId, attemptId))
    .orderBy(asc(questions.sortOrder));

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-mint/10 p-6 text-center">
        {status === "graded" ? (
          <>
            <div className="font-kid-display text-5xl font-extrabold text-mint">
              {totalScore}
              <span className="text-2xl text-slate-400">/{maxScore}</span>
            </div>
            <p className="mt-1 font-bold text-slate-600">Kerja bagus! Sudah dinilai.</p>
          </>
        ) : (
          <>
            <div className="font-kid-display text-3xl font-extrabold text-amber-600">
              Menunggu koreksi
            </div>
            <p className="mt-1 font-semibold text-slate-600">
              Pilihan ganda: {autoScore} poin. Soal esai sedang dinilai gurumu.
            </p>
          </>
        )}
      </div>

      {rows.map((r, i) => (
        <div key={i} className="rounded-3xl border-2 border-slate-200/70 bg-white p-5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Soal {i + 1}</span>
            <span className="text-xs font-semibold text-slate-400">
              {r.awarded == null ? "menunggu" : `${r.awarded}/${r.points}`} poin
            </span>
          </div>
          <p className="mt-2 font-bold text-slate-800">{r.text}</p>

          {r.type === "mc" && r.options ? (
            <ul className="mt-2 space-y-1 text-sm">
              {r.options.map((opt, idx) => {
                const chosen = idx === r.choiceIndex;
                const correct = idx === r.correctIndex;
                return (
                  <li
                    key={idx}
                    className={
                      correct
                        ? "font-bold text-mint"
                        : chosen
                          ? "font-bold text-coral"
                          : "text-slate-500"
                    }
                  >
                    {String.fromCharCode(65 + idx)}. {opt}
                    {correct && " ✓"}
                    {chosen && !correct && " (jawabanmu)"}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-2 rounded-2xl bg-cream px-3 py-2 text-sm text-slate-700">
              {r.essayText || <span className="text-slate-400">(kosong)</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
