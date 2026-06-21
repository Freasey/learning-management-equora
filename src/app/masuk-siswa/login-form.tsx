"use client";

import { useActionState } from "react";
import { IconAlert } from "@/components/kid/icons";
import { authenticateStudent } from "./actions";

const field =
  "w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-base text-slate-800 placeholder:text-slate-300 focus:border-sky focus:outline-none focus:ring-4 focus:ring-sky/15";

export function StudentLoginForm() {
  const [error, formAction, pending] = useActionState(
    authenticateStudent,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-slate-700">
          Kode sekolah
        </span>
        <input
          name="schoolCode"
          required
          autoComplete="off"
          placeholder="cth. DEMO01"
          className={`${field} font-kid-display uppercase tracking-wide`}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-slate-700">
          NIS / Username
        </span>
        <input
          name="identifier"
          required
          autoComplete="username"
          placeholder="cth. 1713"
          className={field}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-slate-700">
          Kata sandi
        </span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className={field}
        />
      </label>

      {error && (
        <p className="flex items-center gap-2 rounded-xl bg-coral/10 px-3 py-2.5 text-sm font-semibold text-coral">
          <IconAlert className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-coral py-3.5 text-base font-extrabold text-white shadow-[0_4px_0_#d8503f] transition active:translate-y-1 active:shadow-[0_1px_0_#d8503f] disabled:opacity-60"
      >
        {pending ? "Sebentar…" : "Masuk"}
      </button>
    </form>
  );
}
