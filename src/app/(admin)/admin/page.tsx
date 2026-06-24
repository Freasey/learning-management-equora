import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Users, GraduationCap, ShieldCheck, Copy } from "lucide-react";
import { auth } from "@/auth";
import { db, schools, pricingPlans } from "@/db";
import { countRole } from "@/lib/quota";
import { quotaLabel } from "@/lib/format";

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

  const [studentCount, teacherCount, adminCount] = await Promise.all([
    countRole(schoolId, "student"),
    countRole(schoolId, "teacher"),
    countRole(schoolId, "school_admin"),
  ]);

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
