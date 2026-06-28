import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { auth } from "@/auth";
import { db, assessments, questions, subjects, classes, attempts, users } from "@/db";
import { isStorageConfigured } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { RowAction, Th } from "@/components/admin/ui";
import { deleteQuestion, setAssessmentStatus, toggleCountToGrade } from "../actions";
import { QuestionForms } from "./question-forms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Susun Kuis · Guru" };

export default async function KuisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  if (!schoolId || session?.user?.role !== "teacher") redirect("/dashboard");

  const { id } = await params;

  const [a] = await db
    .select({
      id: assessments.id,
      title: assessments.title,
      type: assessments.type,
      status: assessments.status,
      durationMin: assessments.durationMin,
      countToGrade: assessments.countToGrade,
      subjectName: subjects.name,
      className: classes.name,
    })
    .from(assessments)
    .leftJoin(subjects, eq(subjects.id, assessments.subjectId))
    .leftJoin(classes, eq(classes.id, assessments.classId))
    .where(and(eq(assessments.id, id), eq(assessments.schoolId, schoolId)))
    .limit(1);
  if (!a) notFound();

  const qs = await db
    .select()
    .from(questions)
    .where(eq(questions.assessmentId, id))
    .orderBy(asc(questions.sortOrder));

  const hasEssay = qs.some((q) => q.type === "essay");
  const totalPoints = qs.reduce((s, q) => s + q.points, 0);

  const subs = await db
    .select({
      id: attempts.id,
      status: attempts.status,
      totalScore: attempts.totalScore,
      autoScore: attempts.autoScore,
      maxScore: attempts.maxScore,
      studentName: users.name,
    })
    .from(attempts)
    .leftJoin(users, eq(users.id, attempts.studentId))
    .where(eq(attempts.assessmentId, id))
    .orderBy(asc(users.name));

  return (
    <div>
      <Link href="/guru/kuis" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-medium text-ink">{a.title}</h1>
            <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase ${
              a.status === "published" ? "bg-teal-700/10 text-teal-700" : "bg-sand-deep text-ink"
            }`}>
              {a.status === "published" ? "Terbit" : "Draf"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {a.type === "exam" ? "Ujian" : "Kuis"} · {a.subjectName} · {a.className}
            {a.durationMin ? ` · ${a.durationMin} menit` : ""} · {qs.length} soal · {totalPoints} poin
          </p>
          {a.countToGrade && (
            <p className="mt-1 text-xs text-teal-700">
              {a.status === "published"
                ? "Otomatis menjadi kolom nilai di Penilaian."
                : "Akan menjadi kolom nilai saat diterbitkan."}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <form action={toggleCountToGrade}>
            <input type="hidden" name="id" value={a.id} />
            <button
              type="submit"
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                a.countToGrade
                  ? "border-teal-700 bg-teal-700/5 text-teal-700"
                  : "border-line text-muted hover:bg-sand"
              }`}
            >
              {a.countToGrade ? "✓ Hitung ke nilai" : "Tidak dihitung"}
            </button>
          </form>
          <form action={setAssessmentStatus}>
            <input type="hidden" name="id" value={a.id} />
            <input type="hidden" name="status" value={a.status === "published" ? "draft" : "published"} />
            <Button type="submit" variant={a.status === "published" ? "ghost" : "primary"} size="sm">
              {a.status === "published" ? "Jadikan Draf" : "Terbitkan"}
            </Button>
          </form>
        </div>
      </header>

      {hasEssay && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm text-accent">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Ada soal esai — nilai tidak terisi otomatis; Anda perlu mengoreksi manual.
        </div>
      )}

      {/* Daftar soal */}
      <div className="mb-8 space-y-3">
        {qs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-paper px-4 py-8 text-center text-muted">
            Belum ada soal. Tambahkan di bawah.
          </p>
        ) : (
          qs.map((q, i) => (
            <div key={q.id} className="rounded-xl border border-line bg-paper p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted">#{i + 1}</span>
                    <span className="rounded-full bg-sand-deep px-2 py-0.5 font-mono text-[10px] uppercase text-ink">
                      {q.type === "mc" ? "Pilihan Ganda" : "Esai"}
                    </span>
                    <span className="font-mono text-[10px] text-muted">{q.points} poin</span>
                  </div>
                  <p className="mt-2 text-ink">{q.text}</p>
                  {q.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={q.imageUrl}
                      alt="Gambar soal"
                      className="mt-2 max-h-48 rounded-lg border border-line"
                    />
                  )}
                  {q.type === "mc" && q.options && (
                    <ul className="mt-2 space-y-1 text-sm">
                      {q.options.map((opt, idx) => (
                        <li
                          key={idx}
                          className={idx === q.correctIndex ? "font-semibold text-teal-700" : "text-muted"}
                        >
                          {String.fromCharCode(65 + idx)}. {opt}
                          {idx === q.correctIndex && " ✓"}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <form action={deleteQuestion}>
                  <input type="hidden" name="id" value={q.id} />
                  <input type="hidden" name="assessmentId" value={a.id} />
                  <RowAction danger>Hapus</RowAction>
                </form>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pengerjaan siswa */}
      <section className="mb-8">
        <h2 className="mb-3 font-display text-lg font-medium text-ink">
          Pengerjaan siswa ({subs.length})
        </h2>
        {subs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-paper px-4 py-6 text-center text-sm text-muted">
            Belum ada siswa yang mengerjakan.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-paper">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-sand/40">
                  <Th>Siswa</Th>
                  <Th>Status</Th>
                  <Th>Nilai</Th>
                  <Th>Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{s.studentName ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase ${
                          s.status === "graded"
                            ? "bg-teal-700/10 text-teal-700"
                            : "bg-accent/15 text-accent"
                        }`}
                      >
                        {s.status === "graded" ? "Dinilai" : "Perlu koreksi"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-ink">
                      {s.status === "graded" ? `${s.totalScore}/${s.maxScore}` : `${s.autoScore}/${s.maxScore} (PG)`}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/guru/kuis/${a.id}/koreksi/${s.id}`}
                        className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-700 hover:text-paper"
                      >
                        {s.status === "graded" ? "Lihat" : "Koreksi"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Tambah soal */}
      <QuestionForms assessmentId={a.id} storageOn={isStorageConfigured()} />
    </div>
  );
}
