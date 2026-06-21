import { redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, schedules, classes, subjects } from "@/db";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jadwal · Guru" };

const days = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default async function JadwalGuruPage() {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  const teacherId = session?.user?.id;
  if (!schoolId || !teacherId || session?.user?.role !== "teacher") redirect("/dashboard");

  const rows = await db
    .select({
      dayOfWeek: schedules.dayOfWeek,
      startTime: schedules.startTime,
      endTime: schedules.endTime,
      room: schedules.room,
      className: classes.name,
      subjectName: subjects.name,
    })
    .from(schedules)
    .leftJoin(classes, eq(classes.id, schedules.classId))
    .leftJoin(subjects, eq(subjects.id, schedules.subjectId))
    .where(and(eq(schedules.schoolId, schoolId), eq(schedules.teacherId, teacherId)))
    .orderBy(asc(schedules.dayOfWeek), asc(schedules.startTime));

  const byDay = new Map<number, typeof rows>();
  for (const r of rows) {
    const list = byDay.get(r.dayOfWeek) ?? [];
    list.push(r);
    byDay.set(r.dayOfWeek, list);
  }

  return (
    <div>
      <PageHeader title="Jadwal Mengajar" description="Jadwal mingguan Anda." />

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-paper p-8 text-center text-muted">
          Belum ada jadwal. Admin sekolah yang menyusun jadwal mengajar.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6, 7]
            .filter((d) => byDay.has(d))
            .map((d) => (
              <div key={d} className="rounded-xl border border-line bg-paper p-5">
                <h2 className="mb-3 font-display text-lg font-medium text-ink">
                  {days[d]}
                </h2>
                <ul className="space-y-2">
                  {byDay.get(d)!.map((s, i) => (
                    <li key={i} className="rounded-lg border border-line px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-ink">
                          {s.subjectName ?? "—"}
                        </span>
                        <span className="font-mono text-[10px] text-muted">
                          {s.room ?? ""}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                        <span className="font-mono text-teal-700">
                          {s.startTime}–{s.endTime}
                        </span>
                        · <span>{s.className ?? "—"}</span>
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
