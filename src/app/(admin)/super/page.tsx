import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowRight, School, Tags, Megaphone, Inbox } from "lucide-react";
import { db, schools, pricingPlans, contactRequests } from "@/db";
import { getDemoLastReset, DEMO_RESET_INTERVAL_MS } from "@/lib/demo";
import { DemoResetCard } from "./demo-reset-card";

export const dynamic = "force-dynamic";

export const metadata = { title: "Ringkasan · Super Admin" };

export default async function SuperAdminHome() {
  const [totalSchools, activeSchools, activePlans, leadCount, demoLastReset] =
    await Promise.all([
      db.$count(schools),
      db.$count(schools, eq(schools.status, "active")),
      db.$count(pricingPlans, eq(pricingPlans.isActive, true)),
      db.$count(contactRequests),
      getDemoLastReset(),
    ]);

  const demoNextResetIso = demoLastReset
    ? new Date(demoLastReset.getTime() + DEMO_RESET_INTERVAL_MS).toISOString()
    : null;

  const stats = [
    { label: "Total sekolah", value: totalSchools },
    { label: "Sekolah aktif", value: activeSchools },
    { label: "Paket aktif", value: activePlans },
    { label: "Lead masuk", value: leadCount },
  ];

  const links = [
    {
      href: "/super/pricing",
      title: "Pricing & Kuota",
      desc: "Atur harga dan batas kuota tiap paket.",
      icon: Tags,
    },
    {
      href: "/super/schools",
      title: "Sekolah",
      desc: "Kelola sekolah, suspend / aktifkan langganan.",
      icon: School,
    },
    {
      href: "/super/leads",
      title: "Lead & Demo",
      desc: "Calon pelanggan dari formulir publik.",
      icon: Inbox,
    },
    {
      href: "/super/announcements",
      title: "Pengumuman",
      desc: "Banner global untuk seluruh pengguna.",
      icon: Megaphone,
    },
  ];

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl font-medium text-ink">Ringkasan</h1>
        <p className="mt-1 text-sm text-muted">
          Selamat datang di konsol platform Equora.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-line bg-paper p-5"
          >
            <div className="border-l-2 border-accent pl-3">
              <div className="font-display text-3xl font-medium text-ink">
                {s.value}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wide text-muted">
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <DemoResetCard initialNextResetIso={demoNextResetIso} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group rounded-xl border border-line bg-paper p-5 transition-colors hover:border-teal-500"
          >
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-teal-700/10 text-teal-700">
              <l.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display text-lg font-medium text-ink">
              {l.title}
            </h3>
            <p className="mt-1 text-sm text-muted">{l.desc}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-teal-700">
              Buka
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
