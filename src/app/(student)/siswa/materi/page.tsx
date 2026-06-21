import { redirect } from "next/navigation";
import { and, desc, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db, schedules, materials, subjects } from "@/db";
import { getStudentClass } from "@/lib/student";

export const dynamic = "force-dynamic";
export const metadata = { title: "Materi · Siswa" };

const typeLabel: Record<string, string> = {
  ai: "PPT",
  link: "Tautan",
  manual: "Catatan",
};

export default async function MateriSiswaPage() {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  const studentId = session?.user?.id;
  if (!schoolId || !studentId || session?.user?.role !== "student") redirect("/dashboard");

  const cls = await getStudentClass(schoolId, studentId);
  if (!cls) return <Empty />;

  const subjRows = await db
    .selectDistinct({ subjectId: schedules.subjectId })
    .from(schedules)
    .where(and(eq(schedules.schoolId, schoolId), eq(schedules.classId, cls.classId)));
  const subjectIds = subjRows.map((r) => r.subjectId).filter((x): x is string => Boolean(x));

  const rows = subjectIds.length
    ? await db
        .select({
          id: materials.id,
          title: materials.title,
          topic: materials.topic,
          type: materials.type,
          url: materials.url,
          subjectName: subjects.name,
        })
        .from(materials)
        .leftJoin(subjects, eq(subjects.id, materials.subjectId))
        .where(and(eq(materials.schoolId, schoolId), inArray(materials.subjectId, subjectIds)))
        .orderBy(desc(materials.createdAt))
    : [];

  return (
    <div>
      <h1 className="mb-1 font-kid-display text-2xl font-extrabold text-slate-800">
        Materi Belajar
      </h1>
      <p className="mb-6 text-slate-500">Kelas {cls.className}</p>

      {rows.length === 0 ? (
        <Empty text="Belum ada materi. Tunggu gurumu mengunggah, ya." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((m) => {
            const inner = (
              <>
                <span className="inline-block rounded-full bg-grape/15 px-2.5 py-0.5 text-xs font-bold text-grape">
                  {typeLabel[m.type] ?? "Materi"}
                </span>
                <h2 className="mt-2 font-kid-display text-lg font-extrabold text-slate-800">
                  {m.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {m.subjectName ?? "—"}
                  {m.topic ? ` · ${m.topic}` : ""}
                </p>
              </>
            );
            return m.url ? (
              <a
                key={m.id}
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-3xl border-2 border-slate-200/70 bg-white p-5 transition hover:border-grape"
              >
                {inner}
                <span className="mt-3 inline-block text-sm font-bold text-grape">Buka →</span>
              </a>
            ) : (
              <div key={m.id} className="rounded-3xl border-2 border-slate-200/70 bg-white p-5">
                {inner}
              </div>
            );
          })}
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
