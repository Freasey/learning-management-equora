import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db, assessments, subjects, attempts } from "@/db";
import { getStudentClass } from "@/lib/student";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kuis · Siswa" };

export default async function KuisSiswaPage() {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  const studentId = session?.user?.id;
  if (!schoolId || !studentId || session?.user?.role !== "student") redirect("/dashboard");

  const cls = await getStudentClass(schoolId, studentId);
  if (!cls) return <Empty />;

  const list = await db
    .select({
      id: assessments.id,
      title: assessments.title,
      type: assessments.type,
      subjectName: subjects.name,
    })
    .from(assessments)
    .leftJoin(subjects, eq(subjects.id, assessments.subjectId))
    .where(
      and(
        eq(assessments.schoolId, schoolId),
        eq(assessments.classId, cls.classId),
        eq(assessments.status, "published"),
      ),
    )
    .orderBy(desc(assessments.createdAt));

  const ids = list.map((a) => a.id);
  const myAttempts = ids.length
    ? await db
        .select({
          assessmentId: attempts.assessmentId,
          status: attempts.status,
          totalScore: attempts.totalScore,
          maxScore: attempts.maxScore,
        })
        .from(attempts)
        .where(and(eq(attempts.studentId, studentId), inArray(attempts.assessmentId, ids)))
    : [];
  const byId = new Map(myAttempts.map((a) => [a.assessmentId, a]));

  return (
    <div>
      <h1 className="mb-1 font-kid-display text-2xl font-extrabold text-slate-800">
        Kuis &amp; Ujian
      </h1>
      <p className="mb-6 text-slate-500">Kelas {cls.className}</p>

      {list.length === 0 ? (
        <Empty text="Belum ada kuis. Nanti muncul di sini, ya." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((a) => {
            const at = byId.get(a.id);
            return (
              <Link
                key={a.id}
                href={`/siswa/kuis/${a.id}`}
                className="rounded-3xl border-2 border-slate-200/70 bg-white p-6 transition hover:border-coral"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-sky/15 px-2.5 py-0.5 text-xs font-bold text-sky">
                    {a.type === "exam" ? "Ujian" : "Kuis"}
                  </span>
                  <Status at={at} />
                </div>
                <h2 className="mt-2 font-kid-display text-lg font-extrabold text-slate-800">
                  {a.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{a.subjectName ?? "—"}</p>
                <span className="mt-3 inline-block text-sm font-bold text-coral">
                  {at ? "Lihat hasil →" : "Kerjakan →"}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Status({
  at,
}: {
  at?: { status: string; totalScore: number | null; maxScore: number };
}) {
  if (!at) {
    return (
      <span className="rounded-full bg-coral/15 px-2.5 py-0.5 text-xs font-bold text-coral">
        Belum dikerjakan
      </span>
    );
  }
  if (at.status === "graded") {
    return (
      <span className="rounded-full bg-mint/15 px-2.5 py-0.5 text-xs font-bold text-mint">
        Selesai · {at.totalScore}/{at.maxScore}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-sunny/25 px-2.5 py-0.5 text-xs font-bold text-amber-700">
      Menunggu koreksi
    </span>
  );
}

function Empty({ text }: { text?: string }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
      {text ?? "Kamu belum ditempatkan di kelas."}
    </div>
  );
}
