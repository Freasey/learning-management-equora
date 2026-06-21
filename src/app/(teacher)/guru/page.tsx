import Link from "next/link";
import { redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { CalendarDays, BookOpen, ClipboardList, Users, MessagesSquare } from "lucide-react";
import { auth } from "@/auth";
import { db, schedules, subjects, classes } from "@/db";
import { getTeacherAssignments } from "@/lib/teaching";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ringkasan · Guru" };

const days = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default async function GuruHome() {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  const teacherId = session?.user?.id;
  if (!schoolId || !teacherId || session?.user?.role !== "teacher") redirect("/dashboard");

  const jsDay = new Date().getDay();
  const today = jsDay === 0 ? 7 : jsDay;

  const [assignments, todaySchedule] = await Promise.all([
    getTeacherAssignments(schoolId, teacherId),
    db
      .select({
        startTime: schedules.startTime,
        endTime: schedules.endTime,
        room: schedules.room,
        className: classes.name,
        subjectName: subjects.name,
      })
      .from(schedules)
      .leftJoin(classes, eq(classes.id, schedules.classId))
      .leftJoin(subjects, eq(subjects.id, schedules.subjectId))
      .where(and(eq(schedules.schoolId, schoolId), eq(schedules.teacherId, teacherId), eq(schedules.dayOfWeek, today)))
      .orderBy(asc(schedules.startTime)),
  ]);

  const uniqueClasses = new Set(assignments.map((a) => a.classId)).size;
  const uniqueSubjects = new Set(assignments.map((a) => a.subjectId)).size;

  const stats = [
    { label: "Kelas diampu", value: uniqueClasses, icon: Users },
    { label: "Mata pelajaran", value: uniqueSubjects, icon: BookOpen },
    { label: "Sesi hari ini", value: todaySchedule.length, icon: CalendarDays },
  ];

  // Placeholder: akan dihitung dari pesan belum terbaca saat group chat (WebSocket) aktif.
  const chatUnread = false;

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl font-medium text-ink">
          Halo, {session?.user?.name?.split(" ")[0] ?? "Guru"} 👋
        </h1>
        <p className="mt-1 text-sm text-muted">
          Ringkasan mengajar Anda hari {days[today]}.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-paper p-5">
            <div className="flex items-center gap-2 text-muted">
              <s.icon className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">{s.label}</span>
            </div>
            <div className="mt-3 font-display text-3xl font-medium text-ink">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-xl border border-line bg-paper p-6">
          <h2 className="mb-4 font-display text-lg font-medium text-ink">
            Jadwal hari ini
          </h2>
          {todaySchedule.length === 0 ? (
            <p className="text-sm text-muted">Tidak ada sesi mengajar hari ini.</p>
          ) : (
            <ul className="space-y-2">
              {todaySchedule.map((s, i) => (
                <li
                  key={i}
                  className="flex items-center gap-4 rounded-lg border border-line px-4 py-3"
                >
                  <span className="font-mono text-xs text-teal-700">
                    {s.startTime}–{s.endTime}
                  </span>
                  <span className="flex-1 font-medium text-ink">
                    {s.subjectName ?? "—"}
                  </span>
                  <span className="text-sm text-muted">{s.className ?? "—"}</span>
                  {s.room && (
                    <span className="font-mono text-[10px] text-muted">{s.room}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-line bg-paper p-6">
          <h2 className="mb-4 font-display text-lg font-medium text-ink">Aksi cepat</h2>
          <div className="grid gap-3">
            {[
              // chatUnread: aktif saat group chat (WebSocket) live → titik merah unread
              { href: "/guru/chat", label: "Obrolan Kelas", icon: MessagesSquare, dot: chatUnread },
              { href: "/guru/materi", label: "Siapkan Materi", icon: BookOpen, dot: false },
              { href: "/guru/kuis", label: "Buat Kuis / Ujian", icon: ClipboardList, dot: false },
              { href: "/guru/nilai", label: "Input Nilai", icon: Users, dot: false },
            ].map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="relative flex items-center gap-3 rounded-lg border border-line px-4 py-3 text-sm font-semibold text-teal-700 transition-colors hover:border-teal-500"
              >
                <span className="relative">
                  <q.icon className="h-4 w-4" />
                  {q.dot && (
                    <span className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-paper" />
                  )}
                </span>
                {q.label}
              </Link>
            ))}
          </div>
        </section>
      </div>

      {assignments.length === 0 && (
        <p className="mt-6 rounded-lg border border-dashed border-line bg-paper px-4 py-3 text-sm text-muted">
          Anda belum punya jadwal mengajar. Hubungi admin sekolah untuk
          menambahkan Anda ke jadwal kelas &amp; mata pelajaran.
        </p>
      )}
    </div>
  );
}
