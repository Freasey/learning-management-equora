import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { db, pricingPlans } from "@/db";
import { formatRupiah, quotaLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/site/page-hero";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Harga — Equora",
  description:
    "Pilih paket sesuai skala sekolah. Semua fitur tersedia di setiap paket; yang membedakan kuota akun, penyimpanan, dan AI.",
};

export default async function HargaPage() {
  const plans = await db
    .select()
    .from(pricingPlans)
    .where(eq(pricingPlans.isActive, true))
    .orderBy(asc(pricingPlans.sortOrder));

  return (
    <>
      <PageHero
        eyebrow="Harga"
        title="Bayar sesuai skala sekolah"
        subtitle="Semua fitur tersedia di setiap paket. Yang membedakan hanya kuota akun, penyimpanan, dan AI."
      />

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-6 lg:grid-cols-4">
          {plans.map((plan) => {
            const highlight = plan.key === "pro";
            return (
              <div
                key={plan.id}
                className={`flex flex-col rounded-2xl border p-6 ${
                  highlight
                    ? "border-teal-700 bg-teal-900 text-paper shadow-[0_24px_60px_-30px_rgba(14,58,58,0.55)]"
                    : "border-line bg-paper"
                }`}
              >
                {highlight && (
                  <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-accent px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-paper">
                    <Sparkles className="h-3 w-3" /> Terpopuler
                  </span>
                )}
                <h3
                  className={`font-display text-2xl font-medium ${
                    highlight ? "text-paper" : "text-ink"
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`mt-1 min-h-10 text-sm ${
                    highlight ? "text-paper/70" : "text-muted"
                  }`}
                >
                  {plan.description}
                </p>

                <div className="mt-5">
                  {plan.isCustom ? (
                    <div className="font-display text-3xl font-medium">Hubungi kami</div>
                  ) : plan.priceMonthly === 0 ? (
                    <div className="font-display text-3xl font-medium">Gratis</div>
                  ) : (
                    <>
                      <div className="font-display text-3xl font-medium">
                        {formatRupiah(plan.priceMonthly)}
                        <span
                          className={`text-base font-normal ${
                            highlight ? "text-paper/60" : "text-muted"
                          }`}
                        >
                          /bln
                        </span>
                      </div>
                      {plan.priceYearly > 0 && (
                        <div
                          className={`mt-1 font-mono text-xs ${
                            highlight ? "text-paper/60" : "text-muted"
                          }`}
                        >
                          atau {formatRupiah(plan.priceYearly)}/tahun
                        </div>
                      )}
                    </>
                  )}
                </div>

                <Button
                  href={plan.isCustom ? "/kontak" : "/daftar"}
                  variant={highlight ? "accent" : "primary"}
                  size="md"
                  className="mt-5 w-full"
                >
                  {plan.isCustom ? "Hubungi Sales" : "Mulai Sekarang"}
                </Button>

                <ul className="mt-6 space-y-3 text-sm">
                  <Feature highlight={highlight}>
                    {quotaLabel(plan.quotaStudents)} siswa
                  </Feature>
                  <Feature highlight={highlight}>
                    {quotaLabel(plan.quotaTeachers)} guru
                  </Feature>
                  <Feature highlight={highlight}>
                    {quotaLabel(plan.quotaAdmins)} admin
                  </Feature>
                  <Feature highlight={highlight}>
                    {plan.storageGb === null
                      ? "Storage tak terbatas"
                      : `${plan.storageGb} GB penyimpanan`}
                  </Feature>
                  <Feature highlight={highlight}>
                    {plan.aiCredits === null
                      ? "Kuota AI sesuai kebutuhan"
                      : `${quotaLabel(plan.aiCredits)} kredit AI / bln`}
                  </Feature>
                  <Feature highlight={highlight}>Semua fitur inti</Feature>
                </ul>
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-12 max-w-2xl text-center text-sm text-muted">
          Harga belum termasuk PPN. Butuh penyesuaian untuk yayasan atau
          multi-cabang?{" "}
          <a href="/kontak" className="font-semibold text-teal-700">
            Hubungi kami
          </a>
          .
        </p>
      </section>

      <section className="border-t border-line bg-sand/40">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-5 py-14 text-center">
          <h2 className="font-display text-2xl font-medium text-ink md:text-3xl">
            Masih ragu paket mana yang cocok?
          </h2>
          <p className="max-w-lg text-muted">
            Jadwalkan demo gratis—kami bantu pilihkan paket sesuai jumlah siswa
            dan kebutuhan sekolah Anda.
          </p>
          <Button href="/demo" variant="accent" size="lg">
            Jadwalkan Demo <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </>
  );
}

function Feature({
  children,
  highlight,
}: {
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <li className="flex gap-2.5">
      <Check
        className={`mt-0.5 h-4 w-4 shrink-0 ${
          highlight ? "text-accent" : "text-teal-700"
        }`}
      />
      <span className={highlight ? "text-paper/90" : "text-ink"}>{children}</span>
    </li>
  );
}
