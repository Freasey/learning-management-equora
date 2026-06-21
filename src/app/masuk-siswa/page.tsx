import type { Metadata } from "next";
import Link from "next/link";
import { LogoBook } from "@/components/kid/icons";
import { StudentLoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk Siswa · Equora" };

export default function MasukSiswaPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_10px_30px_-12px_rgba(29,36,34,0.18)]">
        {/* pita header berwarna dengan logo */}
        <div className="flex items-center gap-3 bg-coral px-7 py-5 text-white">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/20">
            <LogoBook className="h-6 w-6 text-white" />
          </span>
          <div className="leading-tight">
            <div className="font-kid-display text-lg font-extrabold">Equora</div>
            <div className="text-xs font-bold text-white/80">Ruang Siswa</div>
          </div>
        </div>

        <div className="px-7 py-7">
          <h1 className="font-kid-display text-2xl font-extrabold text-slate-800">
            Ayo masuk
          </h1>
          <p className="mb-6 mt-1 text-sm text-slate-500">
            Pakai NIS dan kata sandi dari sekolahmu.
          </p>
          <StudentLoginForm />
        </div>
      </div>

      <div className="mt-5 space-y-1.5 text-center">
        <p className="text-sm font-semibold text-slate-500">
          Punya kode sekolah?{" "}
          <Link href="/gabung" className="text-grape underline-offset-2 hover:underline">
            Gabung di sini
          </Link>
        </p>
        <p className="text-xs text-slate-400">
          Guru atau admin?{" "}
          <Link href="/masuk" className="font-semibold text-sky underline-offset-2 hover:underline">
            Masuk lewat halaman utama
          </Link>
        </p>
      </div>
    </div>
  );
}
