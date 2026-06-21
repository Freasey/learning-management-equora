import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { CheckCircle2 } from "lucide-react";
import { db, pricingPlans } from "@/db";
import { LeadForm } from "@/components/site/lead-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Coba Gratis — Equora",
  description: "Jadwalkan demo atau mulai uji coba Equora untuk sekolah Anda.",
};

const benefits = [
  "Demo langsung sesuai kebutuhan sekolah Anda",
  "Bantuan migrasi data siswa & guru",
  "Tanpa kartu kredit, tanpa komitmen",
  "Pendampingan setup dari tim kami",
];

export default async function DemoPage() {
  const plans = await db
    .select({ key: pricingPlans.key, name: pricingPlans.name })
    .from(pricingPlans)
    .where(eq(pricingPlans.isActive, true))
    .orderBy(asc(pricingPlans.sortOrder));

  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-2 md:py-24">
      <div>
        <span className="font-mono text-xs uppercase tracking-widest text-teal-700">
          Coba Gratis
        </span>
        <h1 className="mt-3 font-display text-4xl font-medium leading-tight text-ink md:text-5xl">
          Mulai dengan Equora hari ini
        </h1>
        <p className="mt-4 text-lg text-muted">
          Isi formulir ini dan tim kami akan menghubungi Anda untuk menjadwalkan
          demo serta membantu menyiapkan sekolah Anda.
        </p>
        <ul className="mt-8 space-y-3">
          {benefits.map((b) => (
            <li key={b} className="flex gap-3 text-ink">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              {b}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-line bg-paper p-7 shadow-[0_24px_60px_-30px_rgba(14,58,58,0.3)]">
        <LeadForm type="demo" plans={plans} submitLabel="Jadwalkan Demo" />
      </div>
    </section>
  );
}
