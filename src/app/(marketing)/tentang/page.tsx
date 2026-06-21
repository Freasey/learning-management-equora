import type { Metadata } from "next";
import { Heart, Target, Users, Accessibility } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Tentang Kami — Equora",
  description:
    "Equora membangun sistem manajemen sekolah yang tenang, kredibel, dan inklusif untuk pendidikan Indonesia.",
};

const values = [
  {
    icon: Accessibility,
    title: "Inklusif sejak awal",
    desc: "Setiap siswa, dengan kemampuan apa pun, berhak belajar dengan setara.",
  },
  {
    icon: Heart,
    title: "Tenang & manusiawi",
    desc: "Teknologi yang meredakan beban administrasi, bukan menambahnya.",
  },
  {
    icon: Target,
    title: "Fokus pada hasil",
    desc: "Membantu guru kembali fokus mengajar dan sekolah tumbuh.",
  },
  {
    icon: Users,
    title: "Untuk Indonesia",
    desc: "Dibangun memahami konteks sekolah dan kurikulum Indonesia.",
  },
];

const stats = [
  { n: "3", c: "Peran terpadu" },
  { n: "100%", c: "Fitur di tiap paket" },
  { n: "K-12", c: "Jenjang didukung" },
];

export default function TentangPage() {
  return (
    <>
      <PageHero
        eyebrow="Tentang Kami"
        title="Pendidikan yang tenang untuk semua"
        subtitle="Kami percaya administrasi sekolah seharusnya tidak rumit—dan setiap siswa berhak atas akses yang setara."
      />

      <section className="mx-auto max-w-3xl px-5 py-16">
        <div className="space-y-5 text-lg leading-relaxed text-ink">
          <p>
            Equora lahir dari satu pengamatan sederhana: guru menghabiskan
            terlalu banyak waktu untuk administrasi, dan terlalu sedikit untuk
            mengajar. Sementara itu, siswa dengan kebutuhan khusus sering
            tertinggal karena alat belajar tidak dirancang untuk mereka.
          </p>
          <p>
            Kami membangun satu platform yang menyatukan siswa, guru, dan admin
            sekolah—dari manajemen kelas, kurikulum, hingga penilaian—dengan
            fitur inklusif sebagai bagian inti, bukan tambahan.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-6 border-y border-line py-8">
          {stats.map((s) => (
            <div key={s.c} className="text-center">
              <div className="font-display text-3xl font-medium text-teal-700">
                {s.n}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wide text-muted">
                {s.c}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-sand/40">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-display text-3xl font-medium text-ink">
            Nilai yang kami pegang
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-xl border border-line bg-paper p-6"
              >
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-teal-700/10 text-teal-700">
                  <v.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-medium text-ink">
                  {v.title}
                </h3>
                <p className="mt-2 text-sm text-muted">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-16 text-center">
        <h2 className="font-display text-2xl font-medium text-ink md:text-3xl">
          Ingin tahu lebih banyak?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-muted">
          Jadwalkan demo dan lihat sendiri bagaimana Equora bekerja untuk
          sekolah Anda.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button href="/daftar" variant="accent" size="lg">
            Mulai Gratis
          </Button>
          <Button href="/demo" variant="ghost" size="lg">
            Request Demo
          </Button>
        </div>
      </section>
    </>
  );
}
