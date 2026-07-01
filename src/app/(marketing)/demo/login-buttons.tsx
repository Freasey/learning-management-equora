"use client";

import { useState, useTransition } from "react";
import { GraduationCap, Users, ShieldCheck, ArrowRight } from "lucide-react";
import type { DemoRole } from "@/lib/demo";
import { loginAsDemo } from "./actions";

const ROLES: {
  role: DemoRole;
  title: string;
  desc: string;
  icon: typeof Users;
}[] = [
  {
    role: "admin",
    title: "Admin Sekolah",
    desc: "Kelola siswa, guru, kelas, dan langganan.",
    icon: ShieldCheck,
  },
  {
    role: "teacher",
    title: "Guru",
    desc: "Buat materi, kuis, dan kelola nilai.",
    icon: Users,
  },
  {
    role: "student",
    title: "Siswa",
    desc: "Ikuti pelajaran, kuis, dan ujian.",
    icon: GraduationCap,
  },
];

export function DemoLoginButtons() {
  const [pending, startTransition] = useTransition();
  const [active, setActive] = useState<DemoRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  function go(role: DemoRole) {
    setActive(role);
    setError(null);
    startTransition(async () => {
      // Sukses → server melempar redirect (tak kembali ke sini).
      const err = await loginAsDemo(role);
      if (err) setError(err);
    });
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {ROLES.map((r) => {
          const loading = pending && active === r.role;
          return (
            <button
              key={r.role}
              type="button"
              disabled={pending}
              onClick={() => go(r.role)}
              className="group flex items-start gap-4 rounded-2xl border border-line bg-paper p-5 text-left transition-colors hover:border-teal-500 disabled:opacity-60"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-teal-700/10 text-teal-700">
                <r.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 font-display text-lg font-medium text-ink">
                  Masuk sebagai {r.title}
                  {loading ? (
                    <span className="text-sm font-normal text-muted">…</span>
                  ) : (
                    <ArrowRight className="h-4 w-4 text-teal-700 transition-transform group-hover:translate-x-0.5" />
                  )}
                </span>
                <span className="mt-1 block text-sm text-muted">{r.desc}</span>
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
