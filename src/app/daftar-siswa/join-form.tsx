"use client";

import { useActionState } from "react";
import Link from "next/link";
import { IconAlert } from "@/components/kid/icons";
import { joinSchool, type JoinState } from "@/app/(auth)/gabung/actions";

const field =
  "w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-base text-slate-800 placeholder:text-slate-300 focus:border-grape focus:outline-none focus:ring-4 focus:ring-grape/15";

export function StudentJoinForm() {
  const [state, formAction, pending] = useActionState<JoinState, FormData>(
    joinSchool,
    undefined,
  );

  if (state?.ok) {
    return (
      <div className="rounded-2xl border-2 border-mint/40 bg-mint/10 p-6 text-center">
        <p className="font-kid-display text-xl font-extrabold text-slate-800">
          Berhasil dikirim!
        </p>
        <p className="mt-1.5 text-sm text-slate-600">{state.message}</p>
        <Link
          href="/masuk-siswa"
          className="mt-4 inline-block rounded-xl bg-grape px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_4px_0_#5b3fd8] transition active:translate-y-1 active:shadow-[0_1px_0_#5b3fd8]"
        >
          Ke halaman masuk
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="role" value="student" />

      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-slate-700">
          Kode sekolah
        </span>
        <input
          name="code"
          required
          autoComplete="off"
          placeholder="cth. DEMO01"
          className={`${field} font-kid-display uppercase tracking-wide`}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-slate-700">
          Nama lengkap
        </span>
        <input
          name="name"
          required
          autoComplete="name"
          placeholder="Nama kamu"
          className={field}
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
          placeholder="cth. 2026001"
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
          autoComplete="new-password"
          placeholder="Buat kata sandi"
          className={field}
        />
      </label>

      {state && !state.ok && (
        <p className="flex items-center gap-2 rounded-xl bg-coral/10 px-3 py-2.5 text-sm font-semibold text-coral">
          <IconAlert className="h-4 w-4 shrink-0" />
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-grape py-3.5 text-base font-extrabold text-white shadow-[0_4px_0_#5b3fd8] transition active:translate-y-1 active:shadow-[0_1px_0_#5b3fd8] disabled:opacity-60"
      >
        {pending ? "Sebentar…" : "Daftar"}
      </button>
    </form>
  );
}
