import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
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
          Masuk untuk melanjutkan ke dasbor Anda.
        </p>
        <LoginForm />
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        Belum punya akun sekolah?{" "}
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
      <p className="mt-2 text-center text-xs text-muted">
        Seorang siswa?{" "}
        <Link href="/masuk-siswa" className="font-semibold text-teal-700">
          Masuk lewat halaman siswa
        </Link>
      </p>
    </div>
  );
}
