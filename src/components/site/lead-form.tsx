"use client";

import { useActionState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitLead, type LeadState } from "@/app/(marketing)/lead-actions";

type Props = {
  type: "demo" | "contact";
  plans?: { key: string; name: string }[];
  submitLabel?: string;
};

export function LeadForm({ type, plans, submitLabel }: Props) {
  const [state, formAction, isPending] = useActionState<LeadState, FormData>(
    submitLead,
    undefined,
  );

  if (state?.ok) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-teal-700/20 bg-teal-700/5 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-teal-700" />
        <p className="font-display text-lg font-medium text-ink">Berhasil!</p>
        <p className="text-sm text-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="type" value={type} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama lengkap" name="name" required placeholder="Nama Anda" />
        <Field
          label="Nama sekolah"
          name="schoolName"
          placeholder="cth. SMA Nusantara"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Email"
          name="email"
          type="email"
          required
          placeholder="anda@sekolah.sch.id"
        />
        <Field label="No. WhatsApp" name="phone" placeholder="08xxxxxxxxxx" />
      </div>

      {plans && plans.length > 0 && (
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink">
            Paket yang diminati
          </span>
          <select
            name="planKey"
            defaultValue=""
            className="w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
          >
            <option value="">— Belum yakin —</option>
            {plans.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink">
          Pesan {type === "demo" ? "(opsional)" : ""}
        </span>
        <textarea
          name="message"
          rows={4}
          placeholder={
            type === "demo"
              ? "Ceritakan kebutuhan sekolah Anda…"
              : "Apa yang bisa kami bantu?"
          }
          className="w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-muted/50 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
        />
      </label>

      {state && !state.ok && (
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
        {isPending ? "Mengirim…" : (submitLabel ?? "Kirim")}
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
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
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
        required={required}
        placeholder={placeholder}
        className="w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-muted/50 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
      />
    </label>
  );
}
