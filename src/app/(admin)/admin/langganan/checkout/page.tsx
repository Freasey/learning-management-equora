import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { ShieldCheck, Lock, CreditCard, Check } from "lucide-react";
import { auth } from "@/auth";
import { db, pricingPlans } from "@/db";
import { formatRupiah, quotaLabel } from "@/lib/format";
import { inputClass } from "@/components/admin/ui";
import { activatePlan } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pembayaran · Admin Sekolah" };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; cycle?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.schoolId) redirect("/super");

  const { plan: planKey, cycle } = await searchParams;
  if (!planKey) redirect("/admin/langganan");

  const [plan] = await db
    .select()
    .from(pricingPlans)
    .where(eq(pricingPlans.key, planKey))
    .limit(1);
  if (!plan || !plan.isActive) redirect("/admin/langganan");

  if (plan.isCustom) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-display text-2xl font-medium text-ink">Paket Custom</h1>
        <p className="mt-2 text-sm text-muted">
          Paket ini memakai harga khusus. Silakan hubungi tim kami untuk
          penawaran.
        </p>
        <Link
          href="/kontak"
          className="mt-5 inline-flex rounded-md bg-teal-700 px-5 py-2.5 text-sm font-semibold text-paper hover:bg-teal-900"
        >
          Hubungi Sales
        </Link>
      </div>
    );
  }

  const isFree = plan.priceMonthly === 0 && plan.priceYearly === 0;
  const defaultCycle = cycle === "yearly" ? "yearly" : "monthly";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-medium text-ink">Pembayaran</h1>
        <p className="mt-1 text-sm text-muted">
          Selesaikan langganan untuk mengaktifkan paket {plan.name}.
        </p>
      </div>

      <form action={activatePlan} className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <input type="hidden" name="planKey" value={plan.key} />

        {/* Kolom kiri: siklus + metode bayar */}
        <div className="space-y-6">
          {!isFree && (
            <section className="rounded-xl border border-line bg-paper p-6">
              <h2 className="mb-4 font-display text-lg font-medium text-ink">
                Siklus penagihan
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <CycleOption
                  value="monthly"
                  label="Bulanan"
                  price={`${formatRupiah(plan.priceMonthly)}/bln`}
                  defaultCycle={defaultCycle}
                />
                <CycleOption
                  value="yearly"
                  label="Tahunan"
                  price={`${formatRupiah(plan.priceYearly)}/thn`}
                  note="Hemat ~2 bulan"
                  defaultCycle={defaultCycle}
                />
              </div>
            </section>
          )}
          {isFree && <input type="hidden" name="cycle" value="monthly" />}

          <section className="rounded-xl border border-line bg-paper p-6">
            <h2 className="mb-1 font-display text-lg font-medium text-ink">
              Metode pembayaran
            </h2>
            <div className="mb-4 flex items-center gap-2 rounded-md bg-accent/10 px-3 py-2 text-xs text-accent">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Mode demo — pembayaran di-bypass. Klik bayar untuk mengaktifkan
              paket langsung.
            </div>
            <div className="space-y-3 opacity-70">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-ink">
                  Nomor kartu
                </span>
                <div className="relative">
                  <input
                    className={inputClass}
                    placeholder="4242 4242 4242 4242"
                    disabled
                  />
                  <CreditCard className="absolute right-3 top-2.5 h-4 w-4 text-muted" />
                </div>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-ink">
                    Kedaluwarsa
                  </span>
                  <input className={inputClass} placeholder="MM/YY" disabled />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-ink">
                    CVC
                  </span>
                  <input className={inputClass} placeholder="123" disabled />
                </label>
              </div>
            </div>
          </section>
        </div>

        {/* Kolom kanan: ringkasan order */}
        <aside className="h-fit rounded-xl border border-line bg-sand/40 p-6">
          <h2 className="mb-4 font-display text-lg font-medium text-ink">
            Ringkasan
          </h2>
          <div className="flex items-baseline justify-between">
            <span className="font-medium text-ink">Paket {plan.name}</span>
            <span className="font-display text-xl font-medium text-ink">
              {isFree ? "Gratis" : formatRupiah(plan.priceMonthly)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">{plan.description}</p>

          <ul className="mt-4 space-y-2 border-t border-line pt-4 text-xs text-ink">
            <Li>{quotaLabel(plan.quotaStudents)} siswa</Li>
            <Li>{quotaLabel(plan.quotaTeachers)} guru</Li>
            <Li>
              {plan.storageGb === null ? "Storage ∞" : `${plan.storageGb} GB storage`}
            </Li>
            <Li>Semua fitur inti</Li>
          </ul>

          <button
            type="submit"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-accent py-3 text-sm font-semibold text-paper transition-colors hover:brightness-95"
          >
            <Lock className="h-4 w-4" />
            {isFree ? "Aktifkan Paket" : "Bayar Sekarang"}
          </button>
          <Link
            href="/admin/langganan"
            className="mt-3 block text-center text-xs text-muted hover:text-ink"
          >
            Batal
          </Link>
        </aside>
      </form>
    </div>
  );
}

function CycleOption({
  value,
  label,
  price,
  note,
  defaultCycle,
}: {
  value: string;
  label: string;
  price: string;
  note?: string;
  defaultCycle: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-line bg-paper p-3 has-[:checked]:border-teal-700 has-[:checked]:bg-teal-700/5">
      <input
        type="radio"
        name="cycle"
        value={value}
        defaultChecked={defaultCycle === value}
        className="mt-0.5 h-4 w-4 text-teal-700 focus:ring-teal-500/30"
      />
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="block font-mono text-xs text-muted">{price}</span>
        {note && <span className="mt-0.5 block text-[10px] text-accent">{note}</span>}
      </span>
    </label>
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
