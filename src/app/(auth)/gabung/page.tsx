import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { JoinForm } from "./join-form";

export const metadata: Metadata = { title: "Gabung Sekolah · Equora" };

export default function GabungPage() {
  return (
    <div className="w-full max-w-md">
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
          Gabung ke sekolah
        </h1>
        <p className="mt-1 mb-6 text-sm text-muted">
          Masukkan kode sekolah dari admin Anda. Akun akan aktif setelah
          disetujui.
        </p>
        <JoinForm />
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="font-semibold text-teal-700">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
