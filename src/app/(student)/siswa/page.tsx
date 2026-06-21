import Link from "next/link";
import { redirect } from "next/navigation";
import { and, asc, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db, schedules, subjects, assessments, attempts } from "@/db";
import { getStudentClass } from "@/lib/student";
import { ArtBooks } from "@/components/kid/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Beranda · Siswa" };

const days = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default async function SiswaHome() {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  const studentId = session?.user?.id;
  if (!schoolId || !studentId || session?.user?.role !== "student") redirect("/dashboard");

  const firstName = session?.user?.name?.split(" ")[0] ?? "Siswa";
  const cls = await getStudentClass(schoolId, studentId);
  if (!cls) return <EmptyClass />;

  const jsDay = new Date().getDay();
  const today = jsDay === 0 ? 7 : jsDay;

  const [todaySchedule, published] = await Promise.all([
    db
      .select({
        startTime: schedules.startTime,
        subjectName: subjects.name,
      })
      .from(schedules)
      .leftJoin(subjects, eq(subjects.id, schedules.subjectId))
      .where(and(eq(schedules.schoolId, schoolId), eq(schedules.classId, cls.classId), eq(schedules.dayOfWeek, today)))
      .orderBy(asc(schedules.startTime)),
    db
      .select({ id: assessments.id })
      .from(assessments)
      .where(and(eq(assessments.schoolId, schoolId), eq(assessments.classId, cls.classId), eq(assessments.status, "published"))),
  ]);

  const ids = published.map((a) => a.id);
  const done = ids.length
    ? await db
        .select({ assessmentId: attempts.assessmentId })
        .from(attempts)
        .where(and(eq(attempts.studentId, studentId), inArray(attempts.assessmentId, ids)))
    : [];
  const doneSet = new Set(done.map((d) => d.assessmentId));
  const pending = ids.filter((id) => !doneSet.has(id)).length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {/* Hero */}
      <section className="col-span-2 flex items-center justify-between gap-4 rounded-3xl border-2 border-slate-200/70 bg-white p-6">
        <div>
          <span className="inline-block rounded-full bg-mint/15 px-3 py-1 text-xs font-bold text-mint">
            Kelas {cls.className}
          </span>
          <h1 className="mt-2 font-kid-display text-2xl font-extrabold leading-tight text-slate-800 sm:text-3xl">
            Halo, {firstName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Mau belajar apa hari ini?</p>
        </div>
        <ArtBooks className="hidden h-24 w-28 shrink-0 sm:block" />
      </section>

      {/* Kuis menunggu */}
      <Tile href="/siswa/kuis" className="bg-coral text-white shadow-[0_5px_0_#d8503f]">
        <div className="font-kid-display text-4xl font-extrabold">{pending}</div>
        <div className="mt-auto font-bold">Kuis menunggu →</div>
      </Tile>

      {/* Nilai */}
      <Tile href="/siswa/nilai" className="bg-mint text-white shadow-[0_5px_0_#1ea783]">
        <NoteSvg className="h-7 w-7" />
        <div className="mt-auto font-bold">Nilaiku →</div>
      </Tile>

      {/* Jadwal hari ini (lebar) */}
      <Link
        href="/siswa/jadwal"
        className="col-span-2 flex flex-col rounded-3xl border-2 border-slate-200/70 bg-white p-6 transition hover:border-sky"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-kid-display text-lg font-extrabold text-slate-800">
            Jadwal {days[today]}
          </h2>
          <span className="text-sm font-bold text-sky">Lihat semua →</span>
        </div>
        {todaySchedule.length === 0 ? (
          <p className="text-sm text-slate-500">Tidak ada pelajaran hari ini.</p>
        ) : (
          <ul className="space-y-1.5">
            {todaySchedule.slice(0, 4).map((s, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl bg-cream px-3 py-2">
                <span className="text-sm font-bold text-coral">{s.startTime}</span>
                <span className="text-sm font-bold text-slate-700">{s.subjectName ?? "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </Link>

      {/* Materi */}
      <Tile href="/siswa/materi" className="bg-sky text-white shadow-[0_5px_0_#2b87d6]">
        <BookSvg className="h-7 w-7" />
        <div className="mt-auto font-bold">Materi →</div>
      </Tile>

      {/* Kelas Online */}
      <Tile href="/siswa/meet" className="bg-grape text-white shadow-[0_5px_0_#6243db]">
        <CamSvg className="h-7 w-7" />
        <div className="mt-auto font-bold">Kelas Online →</div>
      </Tile>

      {/* Obrolan */}
      <Tile href="/siswa/chat" className="col-span-2 bg-sunny text-slate-800 shadow-[0_5px_0_#e0a52f]">
        <div className="flex items-center justify-between">
          <ChatSvg className="h-7 w-7" />
          <span className="font-bold">Obrolan kelas →</span>
        </div>
        <div className="mt-auto font-kid-display text-lg font-extrabold">Tanya guru &amp; teman</div>
      </Tile>

      {/* Pengaturan */}
      <Tile
        href="/siswa/pengaturan"
        className="col-span-2 border-2 border-slate-200/70 bg-white text-slate-700"
      >
        <div className="flex items-center justify-between">
          <span className="font-kid-display text-lg font-extrabold text-slate-800">
            Pengaturan
          </span>
          <span className="font-bold text-slate-400">→</span>
        </div>
        <div className="mt-auto text-sm text-slate-500">Suara &amp; bahasa isyarat</div>
      </Tile>
    </div>
  );
}

function Tile({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-30 flex-col gap-2 rounded-3xl p-5 transition active:translate-y-0.5 ${className ?? ""}`}
    >
      {children}
    </Link>
  );
}

/* ── SVG manual ringkas ── */
function NoteSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function BookSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 5.5C6.5 5 9 5.3 11 6.5v12C9 17.3 6.5 17 4 17.5Z" />
      <path d="M20 5.5C17.5 5 15 5.3 13 6.5v12c2-1.2 4.5-1.5 7-1Z" />
    </svg>
  );
}
function CamSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10 5-3v10l-5-3" />
    </svg>
  );
}
function ChatSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12Z" />
    </svg>
  );
}

function EmptyClass() {
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
      <h1 className="font-kid-display text-2xl font-extrabold text-slate-800">
        Kamu belum punya kelas
      </h1>
      <p className="mx-auto mt-2 max-w-md text-slate-500">
        Sepertinya kamu belum ditempatkan di kelas. Hubungi guru atau admin
        sekolahmu, ya.
      </p>
    </div>
  );
}
