import { redirect } from "next/navigation";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { CheckCircle2, Check } from "lucide-react";
import { auth } from "@/auth";
import { db, schools, pricingPlans } from "@/db";
import { formatRupiah, quotaLabel } from "@/lib/format";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Langganan · Admin Sekolah" };

export default async function LanggananPage({
  searchParams,
}: {
  searchParams: Promise<{ activated?: string }>;
}) {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  if (!schoolId) redirect("/super");

  const { activated } = await searchParams;

  const [school] = await db
    .select()
    .from(schools)
    .where(eq(schools.id, schoolId))
    .limit(1);
  const plans = await db
    .select()
    .from(pricingPlans)
    .where(eq(pricingPlans.isActive, true))
    .orderBy(asc(pricingPlans.sortOrder));

  const current = plans.find((p) => p.key === school.planKey);

  return (
    <div>
      <PageHeader title="Langganan" description="Paket aktif sekolah & opsi upgrade." />

      {activated && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-teal-700/20 bg-teal-700/5 px-4 py-3 text-sm text-teal-800">
          <CheckCircle2 className="h-4 w-4" />
          Paket berhasil diaktifkan. Terima kasih!
        </div>
      )}

      <div className="mb-8 rounded-xl border border-line bg-paper p-6">
        <div className="font-mono text-xs uppercase tracking-wider text-muted">
          Paket aktif
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-3">
          <span className="font-display text-2xl font-medium text-ink">
            {current?.name ?? school.planKey}
          </span>
          <span className="rounded-full bg-accent/15 px-2.5 py-1 font-mono text-[10px] uppercase text-accent">
            {school.status}
          </span>
          <span className="font-mono text-xs text-muted">
            {school.billingCycle === "yearly" ? "Tahunan" : "Bulanan"}
          </span>
        </div>
        {current && (
          <p className="mt-2 text-sm text-muted">
            {current.isCustom
              ? "Harga khusus (nego)."
              : current.priceMonthly === 0
                ? "Gratis."
                : `${formatRupiah(current.priceMonthly)}/bln`}{" "}
            · {quotaLabel(current.quotaStudents)} siswa ·{" "}
            {quotaLabel(current.quotaTeachers)} guru
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {plans.map((plan) => {
          const isCurrent = plan.key === school.planKey;
          return (
            <div
              key={plan.id}
              className={`flex flex-col rounded-xl border p-5 ${
                isCurrent ? "border-teal-700 bg-teal-700/5" : "border-line bg-paper"
              }`}
            >
              <h3 className="font-display text-lg font-medium text-ink">{plan.name}</h3>
              <div className="mt-1 font-mono text-xs text-teal-700">
                {plan.isCustom
                  ? "Hubungi kami"
                  : plan.priceMonthly === 0
                    ? "Gratis"
                    : `${formatRupiah(plan.priceMonthly)}/bln`}
              </div>
              <ul className="mt-4 flex-1 space-y-2 text-xs text-ink">
                <Li>{quotaLabel(plan.quotaStudents)} siswa</Li>
                <Li>{quotaLabel(plan.quotaTeachers)} guru</Li>
                <Li>
                  {plan.storageGb === null ? "Storage ∞" : `${plan.storageGb} GB storage`}
                </Li>
              </ul>

              {isCurrent ? (
                <div className="mt-4 rounded-md border border-teal-700/30 py-2 text-center text-xs font-semibold text-teal-700">
                  Paket Anda
                </div>
              ) : plan.isCustom ? (
                <Link
                  href="/kontak"
                  className="mt-4 block rounded-md border border-teal-700 py-2 text-center text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-700 hover:text-paper"
                >
                  Hubungi Sales
                </Link>
              ) : (
                <Link
                  href={`/admin/langganan/checkout?plan=${plan.key}`}
                  className="mt-4 block rounded-md bg-teal-700 py-2 text-center text-xs font-semibold text-paper transition-colors hover:bg-teal-900"
                >
                  Pilih Paket
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-muted">
        Pembayaran online (Midtrans/Xendit) akan tersedia. Saat ini aktivasi
        paket berjalan dalam mode demo.
      </p>
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-700" />
      {children}
    </li>
  );
}
