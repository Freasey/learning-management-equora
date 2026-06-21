import { redirect } from "next/navigation";
import { and, asc, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db, gradeItems, grades, subjects } from "@/db";
import { getStudentClass } from "@/lib/student";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nilai · Siswa" };

export default async function NilaiSiswaPage() {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  const studentId = session?.user?.id;
  if (!schoolId || !studentId || session?.user?.role !== "student") redirect("/dashboard");

  const cls = await getStudentClass(schoolId, studentId);
  if (!cls) return <Empty />;

  const items = await db
    .select({
      id: gradeItems.id,
      title: gradeItems.title,
      maxScore: gradeItems.maxScore,
      subjectName: subjects.name,
    })
    .from(gradeItems)
    .leftJoin(subjects, eq(subjects.id, gradeItems.subjectId))
    .where(and(eq(gradeItems.schoolId, schoolId), eq(gradeItems.classId, cls.classId)))
    .orderBy(asc(subjects.name), asc(gradeItems.createdAt));

  const ids = items.map((i) => i.id);
  const myGrades = ids.length
    ? await db
        .select({ gradeItemId: grades.gradeItemId, score: grades.score })
        .from(grades)
        .where(and(eq(grades.studentId, studentId), inArray(grades.gradeItemId, ids)))
    : [];
  const scoreOf = new Map(myGrades.map((g) => [g.gradeItemId, g.score]));

  return (
    <div>
      <h1 className="mb-1 font-kid-display text-2xl font-extrabold text-slate-800">
        Nilaiku
      </h1>
      <p className="mb-6 text-slate-500">Kelas {cls.className}</p>

      {items.length === 0 ? (
        <Empty text="Belum ada penilaian. Semangat belajar!" />
      ) : (
        <div className="overflow-hidden rounded-3xl border-2 border-slate-200/70 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-100 text-left">
                <th className="px-5 py-3 font-bold text-slate-500">Penilaian</th>
                <th className="px-5 py-3 font-bold text-slate-500">Mapel</th>
                <th className="px-5 py-3 font-bold text-slate-500">Nilai</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const score = scoreOf.get(it.id);
                return (
                  <tr key={it.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3 font-bold text-slate-700">{it.title}</td>
                    <td className="px-5 py-3 text-slate-500">{it.subjectName ?? "—"}</td>
                    <td className="px-5 py-3">
                      {score == null ? (
                        <span className="text-slate-400">Belum dinilai</span>
                      ) : (
                        <span className="font-kid-display text-lg font-extrabold text-slate-800">
                          {score}
                          <span className="text-sm font-bold text-slate-400">/{it.maxScore}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Empty({ text }: { text?: string }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
      {text ?? "Kamu belum ditempatkan di kelas."}
    </div>
  );
}
