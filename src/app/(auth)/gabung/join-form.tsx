"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { joinSchool, type JoinState } from "./actions";

const fieldClass =
  "w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-muted/50 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15";

export function JoinForm() {
  const [state, formAction, isPending] = useActionState<JoinState, FormData>(
    joinSchool,
    undefined,
  );

  if (state?.ok) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-teal-700/20 bg-teal-700/5 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-teal-700" />
        <p className="font-display text-lg font-medium text-ink">Terkirim!</p>
        <p className="text-sm text-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="role" value="teacher" />

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink">
          Kode sekolah
        </span>
        <input name="code" required placeholder="cth. K7P2QX" className={`${fieldClass} font-mono uppercase`} />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink">
          Nama lengkap
        </span>
        <input name="name" required placeholder="Nama Anda" className={fieldClass} />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink">
          Email
        </span>
        <input name="identifier" type="email" required placeholder="nama@sekolah.sch.id" className={fieldClass} />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink">
          Kata sandi
        </span>
        <input
          name="password"
          type="password"
          required
          placeholder="Buat kata sandi"
          className={fieldClass}
          autoComplete="new-password"
        />
      </label>

      {state && !state.ok && (
        <p className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.message}
        </p>
      )}

      <Button type="submit" variant="accent" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Mengirim…" : "Daftar"}
      </Button>
    </form>
  );
}
