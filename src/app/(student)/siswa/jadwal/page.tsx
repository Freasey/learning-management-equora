import { redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, schedules, subjects, users } from "@/db";
import { getStudentClass } from "@/lib/student";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jadwal · Siswa" };

const days = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default async function JadwalSiswaPage() {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  const studentId = session?.user?.id;
  if (!schoolId || !studentId || session?.user?.role !== "student") redirect("/dashboard");

  const cls = await getStudentClass(schoolId, studentId);
  if (!cls) return <Empty />;

  const rows = await db
    .select({
      dayOfWeek: schedules.dayOfWeek,
      startTime: schedules.startTime,
      endTime: schedules.endTime,
      room: schedules.room,
      subjectName: subjects.name,
      teacherName: users.name,
    })
    .from(schedules)
    .leftJoin(subjects, eq(subjects.id, schedules.subjectId))
    .leftJoin(users, eq(users.id, schedules.teacherId))
    .where(and(eq(schedules.schoolId, schoolId), eq(schedules.classId, cls.classId)))
    .orderBy(asc(schedules.dayOfWeek), asc(schedules.startTime));

  const byDay = new Map<number, typeof rows>();
  for (const r of rows) {
    const list = byDay.get(r.dayOfWeek) ?? [];
    list.push(r);
    byDay.set(r.dayOfWeek, list);
  }

  return (
    <div>
      <h1 className="mb-1 font-kid-display text-2xl font-extrabold text-slate-800">
        Jadwal Pelajaran
      </h1>
      <p className="mb-6 text-slate-500">Kelas {cls.className}</p>

      {rows.length === 0 ? (
        <Empty text="Jadwal belum disusun oleh sekolah." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6, 7]
            .filter((d) => byDay.has(d))
            .map((d) => (
              <div key={d} className="rounded-3xl border-2 border-slate-200/70 bg-white p-5">
                <h2 className="mb-3 font-kid-display text-lg font-extrabold text-slate-800">
                  {days[d]}
                </h2>
                <ul className="space-y-2">
                  {byDay.get(d)!.map((s, i) => (
                    <li key={i} className="rounded-2xl bg-cream px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">{s.subjectName ?? "—"}</span>
                        <span className="text-xs font-semibold text-slate-400">{s.room ?? ""}</span>
                      </div>
                      <div className="mt-0.5 text-sm text-slate-500">
                        <span className="font-bold text-coral">{s.startTime}–{s.endTime}</span>
                        {s.teacherName ? ` · ${s.teacherName}` : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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
