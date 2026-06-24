"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  registerIndependentTeacher,
  type RegisterTeacherState,
} from "./actions";

export function RegisterTeacherForm() {
  const [state, formAction, isPending] = useActionState<
    RegisterTeacherState,
    FormData
  >(registerIndependentTeacher, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Nama Anda" name="name" required placeholder="cth. Bu Sari" />
      <Field
        label="Email"
        name="email"
        type="email"
        required
        placeholder="anda@email.com"
        autoComplete="email"
      />
      <Field
        label="Kata sandi"
        name="password"
        type="password"
        required
        placeholder="Minimal 8 karakter"
        autoComplete="new-password"
      />
      <div className="grid gap-4 sm:grid-cols-[1.6fr_1fr]">
        <Field
          label="Nama kelas/ruang (opsional)"
          name="workspaceName"
          placeholder="cth. Bimbel Sari"
        />
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink">Jenjang</span>
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
        {isPending ? "Membuat akun…" : "Buat Kelas Pribadi"}
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
