import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk · Equora" };

export default function MasukPage() {
  return (
    <div className="w-full max-w-sm">
      <Link href="/" className="mb-8 flex items-center justify-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-paper">
          <GraduationCap className="h-5 w-5" />
        </span>
        <span className="font-display text-2xl font-medium text-teal-900">
          Equora
        </span>
      </Link>

      <div className="rounded-2xl border border-line bg-paper p-8 shadow-[0_24px_60px_-30px_rgba(14,58,58,0.35)]">
        <h1 className="font-display text-2xl font-medium text-ink">
          Selamat datang kembali
        </h1>
        <p className="mt-1 mb-6 text-sm text-muted">
          Masuk sebagai guru atau admin sekolah.
        </p>
        <LoginForm />
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        Belum punya akun?{" "}
        <Link href="/daftar" className="font-semibold text-teal-700">
          Daftar di sini
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-muted">
        Diundang sebagai guru?{" "}
        <Link href="/gabung" className="font-semibold text-teal-700">
          Gabung dengan kode
        </Link>
      </p>

      <Link
        href="/masuk-siswa"
        className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-line bg-sand/60 px-4 py-3 transition-colors hover:border-teal-500/60 hover:bg-sand"
      >
        <span className="text-sm">
          <span className="font-semibold text-ink">Kamu seorang siswa?</span>{" "}
          <span className="text-muted">Masuk di Ruang Siswa</span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-teal-700" />
      </Link>
    </div>
  );
}
