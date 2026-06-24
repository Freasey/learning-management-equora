import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Sparkles } from "lucide-react";
import { RegisterTeacherForm } from "./register-teacher-form";

export const metadata: Metadata = { title: "Daftar Guru Mandiri · Equora" };

export default function DaftarGuruPage() {
  return (
    <div className="w-full max-w-lg">
      <Link href="/" className="mb-8 flex items-center justify-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-paper">
          <GraduationCap className="h-5 w-5" />
        </span>
        <span className="font-display text-2xl font-medium text-teal-900">Equora</span>
      </Link>

      <div className="rounded-2xl border border-line bg-paper p-8 shadow-[0_24px_60px_-30px_rgba(14,58,58,0.35)]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-coral/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-coral">
          <Sparkles className="h-3 w-3" /> Tanpa sekolah
        </span>
        <h1 className="mt-3 font-display text-2xl font-medium text-ink">
          Punya kelas sendiri?
        </h1>
        <p className="mt-1 mb-6 text-sm text-muted">
          Buat ruang mengajar pribadi untuk les / bimbel. Gratis. Anda yang
          mengelola kelas, siswa, materi, kuis, dan nilai. Nanti tetap bisa
          bergabung ke sekolah dan berpindah workspace kapan saja.
        </p>
        <RegisterTeacherForm />
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        Mengajar di sebuah sekolah?{" "}
        <Link href="/gabung" className="font-semibold text-teal-700">
          Gabung pakai kode sekolah
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-muted">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="font-semibold text-teal-700">
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
