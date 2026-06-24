import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { Users, GraduationCap, ShieldCheck, Copy, Check, ArrowRight } from "lucide-react";
import { auth } from "@/auth";
import { db, schools, pricingPlans, subjects, classes, schedules } from "@/db";
import { countRole } from "@/lib/quota";
import { getActiveYear } from "@/lib/academic";
import { storageUsedBytes } from "@/lib/storage";
import { aiUsedThisMonth } from "@/lib/ai";
import { quotaLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { createInstantClass } from "./kelas/actions";
import { seedSampleData } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Ringkasan · Admin Sekolah" };

const statusStyle: Record<string, string> = {
  active: "bg-teal-700/10 text-teal-700",
  trial: "bg-accent/15 text-accent",
  suspended: "bg-sand-deep text-ink",
};

export default async function AdminHome() {
  const session = await auth();
  const schoolId = session?.user?.schoolId;

  // Super admin tak punya sekolah → arahkan ke konsolnya.
  if (!schoolId) redirect("/super");

  const [school] = await db
    .select()
    .from(schools)
    .where(eq(schools.id, schoolId))
    .limit(1);

  if (!school) redirect("/masuk");

  const [plan] = await db
    .select()
    .from(pricingPlans)
    .where(eq(pricingPlans.key, school.planKey))
    .limit(1);

  const [studentCount, teacherCount, adminCount, year, subjectCount, classCount, scheduleCount] =
    await Promise.all([
      countRole(schoolId, "student"),
      countRole(schoolId, "teacher"),
      countRole(schoolId, "school_admin"),
      getActiveYear(schoolId),
      db.$count(subjects, and(eq(subjects.schoolId, schoolId), isNull(subjects.deletedAt))),
      db.$count(classes, and(eq(classes.schoolId, schoolId), isNull(classes.deletedAt))),
      db.$count(schedules, eq(schedules.schoolId, schoolId)),
    ]);

  const [storageBytes, aiUsed] = await Promise.all([
    storageUsedBytes(schoolId),
    aiUsedThisMonth(schoolId),
  ]);
  const storageGb = plan?.storageGb ?? null;
  const aiCredits = plan?.aiCredits ?? null;

  // B2 — daftar langkah penyiapan. Urut sesuai dependensi.
  const setup = [
    { label: "Aktifkan tahun ajaran", done: Boolean(year), href: "/admin/pengaturan" },
    { label: "Tambah mata pelajaran", done: subjectCount > 0, href: "/admin/mapel" },
    { label: "Buat kelas", done: classCount > 0, href: "/admin/kelas" },
    { label: "Tambah guru", done: teacherCount > 0, href: "/admin/guru" },
    { label: "Tambah siswa", done: studentCount > 0, href: "/admin/siswa" },
    { label: "Susun jadwal (tugaskan guru)", done: scheduleCount > 0, href: "/admin/jadwal" },
  ];
  const doneCount = setup.filter((s) => s.done).length;
  const nextStep = setup.find((s) => !s.done);

  const usage = [
    { label: "Siswa", icon: Users, used: studentCount, quota: plan?.quotaStudents ?? null },
    { label: "Guru", icon: GraduationCap, used: teacherCount, quota: plan?.quotaTeachers ?? null },
    { label: "Admin", icon: ShieldCheck, used: adminCount, quota: plan?.quotaAdmins ?? null },
  ];

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-ink">
            {school.name}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-muted">
              Paket {plan?.name ?? school.planKey}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase ${
                statusStyle[school.status] ?? "bg-sand-deep text-ink"
              }`}
            >
              {school.status}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-sand/50 px-5 py-3 text-center">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
            Kode Sekolah
          </div>
          <div className="mt-1 flex items-center gap-2 font-mono text-xl font-medium tracking-widest text-teal-900">
            {school.code}
            <Copy className="h-3.5 w-3.5 text-muted" />
          </div>
        </div>
      </header>

      <p className="mb-6 rounded-lg border border-line bg-paper px-4 py-3 text-sm text-muted">
        Bagikan <strong className="text-ink">kode sekolah</strong> di atas: guru
        mendaftar di{" "}
        <Link href="/gabung" className="font-semibold text-teal-700">
          /gabung
        </Link>
        , siswa di{" "}
        <Link href="/daftar-siswa" className="font-semibold text-teal-700">
          /daftar-siswa
        </Link>
        , lalu setujui di menu{" "}
        <Link href="/admin/pendaftaran" className="font-semibold text-teal-700">
          Pendaftaran
        </Link>
        .
      </p>

      {school.type === "personal" && scheduleCount === 0 && (
        <div className="mb-8 rounded-xl border border-accent/40 bg-accent/5 p-6">
          <h2 className="font-display text-lg font-medium text-ink">
            Mulai cepat — buat kelas instan
          </h2>
          <p className="mb-4 mt-1 text-sm text-muted">
            Khusus ruang kerja pribadi: satu langkah menyiapkan tahun ajaran,
            mata pelajaran, kelas, dan jadwal — Anda langsung bisa mengajar.
          </p>
          <form
            action={createInstantClass}
            className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]"
          >
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Nama kelas</span>
              <input
                name="className"
                required
                placeholder="cth. Kelas Intensif"
                className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-teal-600"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Mata pelajaran</span>
              <input
                name="subjectName"
                required
                placeholder="cth. Matematika"
                className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-teal-600"
              />
            </label>
            <Button type="submit" variant="primary" size="md">
              Buat &amp; mulai mengajar
            </Button>
          </form>
        </div>
      )}

      {doneCount < setup.length && (
        <div className="mb-8 rounded-xl border border-teal-700/30 bg-teal-700/5 p-6">
          <div className="mb-1 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-medium text-ink">
              Penyiapan sekolah
            </h2>
            <span className="font-mono text-xs text-muted">
              {doneCount}/{setup.length} selesai
            </span>
          </div>
          <p className="mb-4 text-sm text-muted">
            Selesaikan langkah berikut agar guru &amp; siswa bisa mulai memakai
            sistem. Ikuti urutannya.
          </p>
          <ol className="space-y-2">
            {setup.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                    s.done
                      ? "border-line bg-paper/60 text-muted"
                      : s === nextStep
                        ? "border-teal-600 bg-paper font-semibold text-ink hover:bg-sand/40"
                        : "border-line bg-paper text-ink hover:bg-sand/40"
                  }`}
                >
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                      s.done
                        ? "border-teal-700 bg-teal-700 text-paper"
                        : "border-line text-transparent"
                    }`}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  <span className={s.done ? "line-through" : ""}>{s.label}</span>
                  {s === nextStep && (
                    <ArrowRight className="ml-auto h-4 w-4 text-teal-700" />
                  )}
                </Link>
              </li>
            ))}
          </ol>

          {school.type === "school" && classCount === 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <p className="text-sm text-muted">
                Ingin mencoba dulu tanpa input manual?
              </p>
              <form action={seedSampleData}>
                <Button type="submit" variant="ghost" size="sm">
                  Muat data contoh
                </Button>
              </form>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {usage.map((u) => {
          const pct =
            u.quota && u.quota > 0
              ? Math.min(100, Math.round((u.used / u.quota) * 100))
              : 0;
          return (
            <div
              key={u.label}
              className="rounded-xl border border-line bg-paper p-5"
            >
              <div className="flex items-center gap-2 text-muted">
                <u.icon className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">{u.label}</span>
              </div>
              <div className="mt-3 font-display text-2xl font-medium text-ink">
                {u.used}
                <span className="text-base font-normal text-muted">
                  {" "}
                  / {quotaLabel(u.quota)}
                </span>
              </div>
              {u.quota !== null && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sand-deep">
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-paper p-5">
          <div className="text-xs uppercase tracking-wide text-muted">Penyimpanan</div>
          <div className="mt-3 font-display text-2xl font-medium text-ink">
            {(storageBytes / 1e9).toFixed(2)} GB
            <span className="text-base font-normal text-muted">
              {" "}
              / {storageGb === null ? "∞" : `${storageGb} GB`}
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-line bg-paper p-5">
          <div className="text-xs uppercase tracking-wide text-muted">AI bulan ini</div>
          <div className="mt-3 font-display text-2xl font-medium text-ink">
            {aiUsed}
            <span className="text-base font-normal text-muted">
              {" "}
              / {aiCredits === null ? "∞" : aiCredits}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/admin/siswa", label: "Kelola Siswa" },
          { href: "/admin/guru", label: "Kelola Guru" },
          { href: "/admin/kelas", label: "Kelola Kelas" },
          { href: "/admin/pendaftaran", label: "Pendaftaran" },
        ].map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className="rounded-xl border border-line bg-paper px-5 py-4 text-sm font-semibold text-teal-700 transition-colors hover:border-teal-500"
          >
            {q.label} →
          </Link>
        ))}
      </div>
    </div>
  );
}
