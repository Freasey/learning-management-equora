import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { db, attempts, answers, questions, users, assessments } from "@/db";
import { Button } from "@/components/ui/button";
import { gradeEssays } from "../../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Koreksi · Guru" };

export default async function KoreksiPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  if (!schoolId || session?.user?.role !== "teacher") redirect("/dashboard");

  const { id, attemptId } = await params;

  const [att] = await db
    .select({
      id: attempts.id,
      status: attempts.status,
      assessmentId: attempts.assessmentId,
      totalScore: attempts.totalScore,
      maxScore: attempts.maxScore,
      studentName: users.name,
      title: assessments.title,
    })
    .from(attempts)
    .leftJoin(users, eq(users.id, attempts.studentId))
    .leftJoin(assessments, eq(assessments.id, attempts.assessmentId))
    .where(and(eq(attempts.id, attemptId), eq(attempts.schoolId, schoolId)))
    .limit(1);
  if (!att || att.assessmentId !== id) notFound();

  const rows = await db
    .select({
      answerId: answers.id,
      text: questions.text,
      type: questions.type,
      points: questions.points,
      imageUrl: questions.imageUrl,
      options: questions.options,
      correctIndex: questions.correctIndex,
      choiceIndex: answers.choiceIndex,
      essayText: answers.essayText,
      fileUrl: answers.fileUrl,
      awarded: answers.awardedPoints,
    })
    .from(answers)
    .innerJoin(questions, eq(questions.id, answers.questionId))
    .where(eq(answers.attemptId, attemptId))
    .orderBy(asc(questions.sortOrder));

  const hasEssay = rows.some((r) => r.type === "essay");

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/guru/kuis/${id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>

      <header className="mb-6">
        <h1 className="font-display text-2xl font-medium text-ink">
          Koreksi — {att.studentName ?? "Siswa"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {att.title} ·{" "}
          {att.status === "graded"
            ? `Nilai ${att.totalScore}/${att.maxScore}`
            : "Menunggu koreksi esai"}
        </p>
      </header>

      <form action={gradeEssays} className="space-y-4">
        <input type="hidden" name="attemptId" value={att.id} />

        {rows.map((r, i) => (
          <div key={r.answerId} className="rounded-xl border border-line bg-paper p-5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted">#{i + 1}</span>
              <span className="rounded-full bg-sand-deep px-2 py-0.5 font-mono text-[10px] uppercase text-ink">
                {r.type === "mc" ? "Pilihan Ganda" : "Esai"}
              </span>
              <span className="font-mono text-[10px] text-muted">{r.points} poin</span>
            </div>
            <p className="mt-2 text-ink">{r.text}</p>
            {r.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.imageUrl} alt="Gambar soal" className="mt-2 max-h-48 rounded-lg border border-line" />
            )}

            {r.type === "mc" ? (
              <div className="mt-2 text-sm">
                <span className={r.choiceIndex === r.correctIndex ? "font-semibold text-teal-700" : "font-semibold text-red-600"}>
                  Jawaban siswa:{" "}
                  {r.choiceIndex != null && r.options
                    ? `${String.fromCharCode(65 + r.choiceIndex)}. ${r.options[r.choiceIndex] ?? ""}`
                    : "(kosong)"}
                  {r.choiceIndex === r.correctIndex ? " ✓" : " ✗"}
                </span>
              </div>
            ) : (
              <div className="mt-2">
                <div className="rounded-lg bg-sand/50 px-3 py-2 text-sm text-ink">
                  {r.essayText || <span className="text-muted">(kosong)</span>}
                </div>
                {r.fileUrl && (
                  <a
                    href={r.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:underline"
                  >
                    📎 Lihat lampiran jawaban
                  </a>
                )}
                <label className="mt-3 flex items-center gap-2">
                  <span className="text-xs font-semibold text-ink">Nilai esai:</span>
                  <input
                    name={`award_${r.answerId}`}
                    type="number"
                    min={0}
                    max={r.points}
                    defaultValue={r.awarded ?? ""}
                    placeholder="0"
                    className="w-20 rounded-md border border-line bg-paper px-2.5 py-1.5 text-sm text-ink focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
                  />
                  <span className="text-xs text-muted">/ {r.points}</span>
                </label>
              </div>
            )}
          </div>
        ))}

        {hasEssay ? (
          <Button type="submit" variant="primary" size="md">
            Simpan Nilai
          </Button>
        ) : (
          <p className="rounded-lg border border-line bg-paper px-4 py-3 text-sm text-muted">
            Semua soal pilihan ganda — nilai sudah dihitung otomatis.
          </p>
        )}
      </form>
    </div>
  );
}
