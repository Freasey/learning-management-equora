"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRupiah, quotaLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { registerSchool, type RegisterState } from "./actions";

type Plan = {
  key: string;
  name: string;
  description: string;
  priceMonthly: number;
  quotaStudents: number | null;
  storageGb: number | null;
  isCustom: boolean;
};

function priceLabel(plan: Plan): string {
  if (plan.isCustom) return "Hubungi kami";
  if (plan.priceMonthly === 0) return "Gratis";
  return `${formatRupiah(plan.priceMonthly)}/bln`;
}

export function RegisterForm({ plans }: { plans: Plan[] }) {
  const [state, formAction, isPending] = useActionState<RegisterState, FormData>(
    registerSchool,
    undefined,
  );
  const [selected, setSelected] = useState(plans[0]?.key ?? "");

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <Field
          label="Nama sekolah"
          name="schoolName"
          required
          placeholder="cth. SMA Nusantara"
        />
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink">
            Jenjang
          </span>
          <select
            name="level"
            defaultValue="SMA"
            className="w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
          >
            <option value="SD">SD/MI</option>
            <option value="SMP">SMP/MTs</option>
            <option value="SMA">SMA/MA</option>
            <option value="SMK">SMK/MAK</option>
          </select>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama Anda" name="adminName" required placeholder="Nama admin" />
        <Field
          label="Email"
          name="email"
          type="email"
          required
          placeholder="anda@sekolah.sch.id"
          autoComplete="email"
        />
      </div>
      <Field
        label="Kata sandi"
        name="password"
        type="password"
        required
        placeholder="Minimal 8 karakter"
        autoComplete="new-password"
      />

      <div>
        <span className="mb-2 block text-xs font-semibold text-ink">
          Pilih paket
        </span>
        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((plan) => {
            const active = selected === plan.key;
            return (
              <label
                key={plan.key}
                className={cn(
                  "relative cursor-pointer rounded-xl border p-4 transition-colors",
                  active
                    ? "border-teal-700 bg-teal-700/5 ring-2 ring-teal-500/20"
                    : "border-line bg-paper hover:border-teal-500/50",
                )}
              >
                <input
                  type="radio"
                  name="planKey"
                  value={plan.key}
                  checked={active}
                  onChange={() => setSelected(plan.key)}
                  className="sr-only"
                />
                <span
                  className={cn(
                    "absolute right-3 top-3 grid h-4 w-4 place-items-center rounded-full border",
                    active
                      ? "border-teal-700 bg-teal-700 text-paper"
                      : "border-line",
                  )}
                >
                  {active && <Check className="h-3 w-3" />}
                </span>

                <div className="font-display text-base font-medium text-ink">
                  {plan.name}
                </div>
                <div className="mt-0.5 font-mono text-xs text-teal-700">
                  {priceLabel(plan)}
                </div>
                <div className="mt-2 text-xs leading-snug text-muted">
                  {quotaLabel(plan.quotaStudents)} siswa ·{" "}
                  {plan.storageGb === null ? "∞" : `${plan.storageGb} GB`} storage
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {state && (
        <p className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.message}
        </p>
      )}

      <Button
        type="submit"
        variant="accent"
        size="lg"
        className="w-full"
        disabled={isPending}
      >
        {isPending ? "Membuat akun…" : "Daftarkan Sekolah"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-muted/50 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
      />
    </label>
  );
}
