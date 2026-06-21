import { asc } from "drizzle-orm";
import { db, pricingPlans, type PricingPlan } from "@/db";
import { formatRupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { updatePlan } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Pricing & Kuota · Super Admin" };

export default async function PricingPage() {
  const plans = await db
    .select()
    .from(pricingPlans)
    .orderBy(asc(pricingPlans.sortOrder));

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl font-medium text-ink">
          Pricing &amp; Kuota
        </h1>
        <p className="mt-1 text-sm text-muted">
          Atur harga dan batas kuota tiap paket. Kosongkan kuota untuk
          &ldquo;tak terbatas&rdquo; (mis. paket Custom).
        </p>
      </header>

      <div className="space-y-5">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}

function PlanCard({ plan }: { plan: PricingPlan }) {
  return (
    <form
      action={updatePlan}
      className="rounded-xl border border-line bg-paper p-6"
    >
      <input type="hidden" name="id" value={plan.id} />

      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xl font-medium text-ink">
            {plan.name}
          </h2>
          <span className="rounded-full bg-sand px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-teal-700">
            {plan.key}
          </span>
        </div>
        <span className="font-mono text-xs text-muted">
          {plan.isCustom ? "Harga nego" : `${formatRupiah(plan.priceMonthly)}/bln`}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nama paket" name="name" defaultValue={plan.name} />
        <Field
          label="Deskripsi"
          name="description"
          defaultValue={plan.description}
        />
        <Field
          label="Harga / bulan (Rp)"
          name="priceMonthly"
          type="number"
          defaultValue={plan.priceMonthly}
        />
        <Field
          label="Harga / tahun (Rp)"
          name="priceYearly"
          type="number"
          defaultValue={plan.priceYearly}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field
          label="Kuota siswa"
          name="quotaStudents"
          type="number"
          defaultValue={plan.quotaStudents}
          placeholder="∞"
        />
        <Field
          label="Kuota guru"
          name="quotaTeachers"
          type="number"
          defaultValue={plan.quotaTeachers}
          placeholder="∞"
        />
        <Field
          label="Kuota admin"
          name="quotaAdmins"
          type="number"
          defaultValue={plan.quotaAdmins}
          placeholder="∞"
        />
        <Field
          label="Storage (GB)"
          name="storageGb"
          type="number"
          defaultValue={plan.storageGb}
          placeholder="∞"
        />
        <Field
          label="Kuota AI / bln"
          name="aiCredits"
          type="number"
          defaultValue={plan.aiCredits}
          placeholder="∞"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
        <div className="flex gap-6">
          <Checkbox
            label="Harga nego (Custom)"
            name="isCustom"
            defaultChecked={plan.isCustom}
          />
          <Checkbox
            label="Aktif"
            name="isActive"
            defaultChecked={plan.isActive}
          />
        </div>
        <Button type="submit" variant="primary" size="sm">
          Simpan
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink">
        {label}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted/50 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
      />
    </label>
  );
}

function Checkbox({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-line text-teal-700 focus:ring-teal-500/30"
      />
      {label}
    </label>
  );
}
