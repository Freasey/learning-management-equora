import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, GraduationCap, Backpack, Sparkles, ArrowRight } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";

export const metadata: Metadata = {
  title: "Pusat Bantuan — Equora",
  description:
    "Panduan memakai Equora untuk Admin Sekolah, Guru, dan Siswa. Bebas dibaca siapa saja.",
};

const cards = [
  {
    slug: "umum",
    name: "Umum",
    icon: Sparkles,
    tone: "text-teal-700 bg-teal-700/10",
    desc: "Mengenal Equora & cara mulai—untuk siapa saja.",
  },
  {
    slug: "admin",
    name: "Admin Sekolah",
    icon: ShieldCheck,
    tone: "text-teal-700 bg-teal-700/10",
    desc: "Menyiapkan & mengelola seluruh data sekolah.",
  },
  {
    slug: "guru",
    name: "Guru",
    icon: GraduationCap,
    tone: "text-accent bg-accent/10",
    desc: "Mengajar, membuat materi & penilaian.",
  },
  {
    slug: "siswa",
    name: "Siswa",
    icon: Backpack,
    tone: "text-coral bg-coral/10",
    desc: "Belajar, mengerjakan kuis, melihat nilai.",
  },
];

export default function PanduanIndexPage() {
  return (
    <>
      <PageHero
        eyebrow="Pusat Bantuan"
        title="Panduan memakai Equora"
        subtitle="Pilih peran untuk membaca cara pakai tiap halaman. Bebas dibaca siapa saja, termasuk calon pengguna."
      />
      <section className="mx-auto max-w-4xl px-5 py-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((c) => (
            <Link
              key={c.slug}
              href={`/panduan/${c.slug}`}
              className="group flex items-start gap-4 rounded-xl border border-line bg-paper p-5 transition-colors hover:border-teal-700"
            >
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${c.tone}`}>
                <c.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-medium text-ink">{c.name}</h2>
                <p className="mt-1 text-sm text-muted">{c.desc}</p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-teal-700" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
