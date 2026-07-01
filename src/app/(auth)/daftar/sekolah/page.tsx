import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { db, pricingPlans } from "@/db";
import { RegisterForm } from "../register-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Daftar Sekolah · Equora" };

export default async function DaftarSekolahPage() {
  const plans = await db
    .select({
      key: pricingPlans.key,
      name: pricingPlans.name,
      description: pricingPlans.description,
      priceMonthly: pricingPlans.priceMonthly,
      quotaStudents: pricingPlans.quotaStudents,
      storageGb: pricingPlans.storageGb,
      isCustom: pricingPlans.isCustom,
    })
    .from(pricingPlans)
    .where(eq(pricingPlans.isActive, true))
    .orderBy(asc(pricingPlans.sortOrder));

  return (
    <div className="w-full max-w-lg">
      <Link href="/" className="mb-8 flex items-center justify-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-paper">
          <GraduationCap className="h-5 w-5" />
        </span>
        <span className="font-display text-2xl font-medium text-teal-900">
          Equora
        </span>
      </Link>

      <div className="rounded-2xl border border-line bg-paper p-8 shadow-[0_24px_60px_-30px_rgba(14,58,58,0.35)]">
        <h1 className="font-display text-2xl font-medium text-ink">
          Daftarkan sekolah Anda
        </h1>
        <p className="mt-1 mb-6 text-sm text-muted">
          Mulai gratis. Tanpa kartu kredit.
        </p>
        <RegisterForm plans={plans} />
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="font-semibold text-teal-700">
          Masuk di sini
        </Link>
      </p>
      <p className="mt-3 text-center">
        <Link
          href="/daftar"
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
        >
          <ArrowLeft className="h-3 w-3" /> Pilih jenis pendaftaran lain
        </Link>
      </p>
    </div>
  );
}
