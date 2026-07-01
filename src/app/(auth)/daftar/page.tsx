import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ChevronRight, GraduationCap, UserRound } from "lucide-react";

export const metadata: Metadata = { title: "Mulai Gratis · Equora" };

const options = [
  {
    href: "/daftar/sekolah",
    icon: Building2,
    title: "Untuk sekolah",
    subtitle: "Sekolah / yayasan / madrasah",
    desc: "Kelola banyak guru, kelas, dan siswa dalam satu sekolah. Anda menjadi admin sekolah.",
  },
  {
    href: "/daftar-guru",
    icon: UserRound,
    title: "Untuk guru les / bimbel",
    subtitle: "Mengajar mandiri, tanpa sekolah",
    desc: "Buat ruang kelas pribadi. Anda sendiri yang mengelola siswa, materi, kuis, dan nilai.",
  },
];

export default function DaftarPage() {
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

      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-medium text-ink">
          Mulai gratis
        </h1>
        <p className="mt-1 text-sm text-muted">
          Anda ingin mendaftar sebagai apa?
        </p>
      </div>

      <div className="space-y-3">
        {options.map((o) => (
          <Link
            key={o.href}
            href={o.href}
            className="group flex items-start gap-4 rounded-2xl border border-line bg-paper p-5 shadow-[0_24px_60px_-40px_rgba(14,58,58,0.35)] transition-colors hover:border-teal-500/60"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal-700/10 text-teal-700">
              <o.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-base font-medium text-ink">
                  {o.title}
                </span>
                <ChevronRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-teal-700" />
              </div>
              <div className="text-xs font-medium text-teal-700">
                {o.subtitle}
              </div>
              <p className="mt-1.5 text-xs leading-snug text-muted">{o.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="font-semibold text-teal-700">
          Masuk di sini
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-muted">
        Seorang siswa?{" "}
        <Link href="/daftar-siswa" className="font-semibold text-teal-700">
          Daftar di ruang siswa
        </Link>
      </p>
    </div>
  );
}
