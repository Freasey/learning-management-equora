import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, RotateCw } from "lucide-react";
import {
  DEMO_SCHOOL,
  DEMO_PASSWORD,
  DEMO_RESET_INTERVAL_MS,
  ensureDemoFresh,
} from "@/lib/demo";
import { DemoCountdown } from "@/components/site/demo-countdown";
import { DemoLoginButtons } from "./login-buttons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Coba Demo — Equora",
  description:
    "Masuk ke sekolah demo Equora sekali klik. Tanpa daftar, tanpa kartu kredit.",
};

export default async function DemoPage() {
  // "Reset malas": segarkan sekolah demo bila usianya sudah lewat 6 jam.
  const lastReset = await ensureDemoFresh();
  const nextResetIso = new Date(
    lastReset.getTime() + DEMO_RESET_INTERVAL_MS,
  ).toISOString();

  return (
    <section className="mx-auto max-w-3xl px-5 py-16 md:py-24">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-teal-700">
          <Sparkles className="h-4 w-4" />
          Coba Langsung
        </span>
        <h1 className="mt-3 font-display text-4xl font-medium leading-tight text-ink md:text-5xl">
          Coba Equora sekali klik
        </h1>
        <p className="mt-4 text-lg text-muted">
          Pilih peran di bawah untuk langsung masuk ke{" "}
          <strong className="text-ink">{DEMO_SCHOOL.name}</strong> — sekolah demo
          yang sudah berisi guru, siswa, kelas, dan mata pelajaran. Tanpa daftar,
          tanpa kartu kredit.
        </p>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-line bg-sand/40 px-4 py-3 text-sm text-muted">
        <RotateCw className="h-4 w-4 shrink-0 text-teal-700" />
        <span>
          Sekolah demo dipakai bersama & disegarkan tiap 6 jam —{" "}
          <DemoCountdown targetIso={nextResetIso} />. Semua perubahan Anda akan
          direset.
        </span>
      </div>

      <div className="mt-8">
        <DemoLoginButtons />
      </div>

      <p className="mt-8 text-center text-sm text-muted">
        Ingin data & tim sekolah Anda sendiri?{" "}
        <Link
          href="/kontak"
          className="font-semibold text-teal-700 hover:underline"
        >
          Jadwalkan demo privat
        </Link>{" "}
        atau{" "}
        <Link href="/harga" className="font-semibold text-teal-700 hover:underline">
          lihat harga
        </Link>
        .
      </p>

      <p className="mt-2 text-center text-xs text-muted/70">
        Semua akun demo memakai kata sandi{" "}
        <code className="rounded bg-line/40 px-1">{DEMO_PASSWORD}</code> bila ingin
        masuk manual.
      </p>
    </section>
  );
}
