import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Users,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Ear,
  Eye,
  MessageSquare,
  ClipboardList,
  CalendarDays,
  BarChart3,
  CheckCircle2,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Equora — Sistem Manajemen Sekolah yang Tenang & Inklusif",
  description:
    "Kelola siswa, guru, kurikulum, kelas, dan penilaian dalam satu platform. Dilengkapi fitur inklusif untuk siswa disabilitas.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <Features />
      <Inclusive />
      <HowItWorks />
      <Testimonials />
      <PricingTeaser />
      <CtaBand />
    </>
  );
}

/* ── Hero ─────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:py-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal-700">
            <Sparkles className="h-3.5 w-3.5" /> Manajemen Sekolah K-12
          </span>
          <h1 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink md:text-6xl">
            Belajar <em className="text-teal-700 italic">tenang</em>,
            mengelola sekolah dengan kepala dingin.
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted">
            Satu platform untuk siswa, guru, dan admin sekolah — dari manajemen
            kelas hingga penilaian, lengkap dengan fitur inklusif untuk semua
            siswa.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/daftar" variant="accent" size="lg">
              Mulai Gratis <ArrowRight className="h-4 w-4" />
            </Button>
            <Button href="/demo" variant="ghost" size="lg">
              Request Demo
            </Button>
          </div>
          <p className="mt-5 font-mono text-xs text-muted">
            Tanpa kartu kredit · Setup dalam hitungan menit
          </p>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative">
      <div className="rounded-2xl border border-line bg-paper p-5 shadow-[0_24px_60px_-30px_rgba(14,58,58,0.45)]">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-teal-900 text-paper">
              <GraduationCap className="h-4 w-4" />
            </span>
            <span className="font-display text-sm font-medium text-teal-900">
              Dashboard Sekolah
            </span>
          </div>
          <span className="rounded-full bg-teal-700/10 px-2.5 py-1 font-mono text-[10px] text-teal-700">
            Semester Genap
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 py-4">
          {[
            { n: "486", c: "Siswa aktif" },
            { n: "32", c: "Guru" },
            { n: "128", c: "Modul" },
          ].map((s) => (
            <div key={s.c} className="border-l-2 border-accent pl-3">
              <div className="font-display text-2xl font-medium text-ink">
                {s.n}
              </div>
              <div className="text-[11px] uppercase tracking-wide text-muted">
                {s.c}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-line bg-sand/50 p-4">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm text-ink">
              Laporan Keuangan Dasar
            </span>
            <span className="font-mono text-[10px] text-muted">XII IPA</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sand-deep">
            <span className="block h-full w-[64%] rounded-full bg-accent" />
          </div>
          <div className="mt-1.5 font-mono text-[10px] text-muted">
            64% selesai · 8/12 modul
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Trust strip ──────────────────────────────────────── */
function TrustStrip() {
  return (
    <section className="border-y border-line bg-sand/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-5 py-8 text-center md:flex-row md:justify-between md:text-left">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          Dipercaya sekolah di seluruh Indonesia
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {["SMA Nusantara", "SMP Harapan", "SD Cendekia", "SMK Bina Karya"].map(
            (s) => (
              <span
                key={s}
                className="font-display text-lg text-teal-900/60"
              >
                {s}
              </span>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

/* ── Features per role ────────────────────────────────── */
const featureGroups = [
  {
    icon: ShieldCheck,
    role: "Admin Sekolah",
    desc: "Kendali penuh atas data sekolah dalam satu dashboard.",
    items: [
      "Manajemen siswa, guru & kelas",
      "Kurikulum, mata pelajaran & jadwal",
      "Persetujuan pendaftaran via kode sekolah",
      "Kuota & langganan transparan",
    ],
  },
  {
    icon: Users,
    role: "Guru",
    desc: "Mengajar lebih ringan, menilai lebih cepat.",
    items: [
      "Generate materi PPT dari kurikulum terbaru",
      "Quiz & ujian dengan penilaian otomatis",
      "Rekap nilai per siswa per mata pelajaran",
      "Sorotan siswa yang perlu perhatian",
    ],
  },
  {
    icon: GraduationCap,
    role: "Siswa",
    desc: "Belajar yang nyaman dan dapat diakses semua.",
    items: [
      "Absensi kelas yang praktis",
      "Mengerjakan quiz & ujian online",
      "Akses materi kapan saja",
      "Fitur inklusif bawaan",
    ],
  },
];

function Features() {
  return (
    <section id="fitur" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
      <SectionHeading
        eyebrow="Fitur"
        title="Satu platform, tiga peran"
        subtitle="Dirancang untuk kebutuhan nyata setiap orang di sekolah."
      />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {featureGroups.map((g) => (
          <div
            key={g.role}
            className="flex flex-col rounded-xl border border-line bg-paper p-6"
          >
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-teal-700/10 text-teal-700">
              <g.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display text-xl font-medium text-ink">
              {g.role}
            </h3>
            <p className="mt-1 text-sm text-muted">{g.desc}</p>
            <ul className="mt-5 space-y-2.5">
              {g.items.map((it) => (
                <li key={it} className="flex gap-2.5 text-sm text-ink">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Inclusive (differentiator) ───────────────────────── */
const inclusive = [
  {
    icon: Eye,
    title: "Tunanetra",
    desc: "Teks-ke-suara untuk seluruh konten, dapat dinyalakan kapan saja dari pengaturan.",
  },
  {
    icon: Ear,
    title: "Tunarungu",
    desc: "Teks langsung (live caption) di kelas online agar tak ada yang tertinggal.",
  },
  {
    icon: MessageSquare,
    title: "Tunawicara",
    desc: "Dukungan komunikasi berbasis teks & isyarat dalam ruang belajar.",
  },
];

function Inclusive() {
  return (
    <section id="inklusif" className="scroll-mt-20 bg-teal-900 text-paper">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <span className="inline-flex items-center gap-2 rounded-full bg-paper/10 px-3 py-1 font-mono text-xs uppercase tracking-widest text-paper/80">
          <Sparkles className="h-3.5 w-3.5" /> Pendidikan untuk semua
        </span>
        <h2 className="mt-5 max-w-2xl font-display text-3xl font-medium leading-tight md:text-4xl">
          Sekolah inklusif bukan tambahan—{" "}
          <span className="text-accent">tapi bawaan.</span>
        </h2>
        <p className="mt-4 max-w-xl text-paper/70">
          Equora dibangun agar setiap siswa, dengan kemampuan apa pun, dapat
          belajar dengan setara.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {inclusive.map((i) => (
            <div
              key={i.title}
              className="rounded-xl border border-paper/15 bg-paper/5 p-6"
            >
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-paper">
                <i.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-xl font-medium">
                {i.title}
              </h3>
              <p className="mt-2 text-sm text-paper/70">{i.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── How it works ─────────────────────────────────────── */
const steps = [
  {
    icon: ShieldCheck,
    title: "Daftarkan sekolah",
    desc: "Isi data sekolah, pilih paket yang sesuai dengan jumlah siswa.",
  },
  {
    icon: Users,
    title: "Undang guru & siswa",
    desc: "Bagikan kode sekolah, lalu setujui pendaftaran yang masuk.",
  },
  {
    icon: ClipboardList,
    title: "Mulai mengajar",
    desc: "Susun kelas, jadwal, materi, dan penilaian dalam satu tempat.",
  },
];

function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <SectionHeading
        eyebrow="Cara Kerja"
        title="Siap dalam tiga langkah"
        subtitle="Dari pendaftaran hingga kelas pertama, tanpa ribet."
      />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="relative rounded-xl border border-line bg-paper p-6">
            <span className="absolute right-5 top-5 font-display text-4xl font-medium text-sand-deep">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-teal-700/10 text-teal-700">
              <s.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display text-xl font-medium text-ink">
              {s.title}
            </h3>
            <p className="mt-2 text-sm text-muted">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Testimonials ─────────────────────────────────────── */
const testimonials = [
  {
    quote:
      "Administrasi yang dulu makan waktu berhari-hari kini selesai dalam hitungan jam. Guru bisa fokus mengajar lagi.",
    name: "Bu Eka Septariana",
    role: "Kepala Sekolah, SMA Nusantara",
  },
  {
    quote:
      "Fitur inklusifnya yang membuat kami pindah. Siswa tunarungu kami akhirnya bisa mengikuti kelas dengan nyaman.",
    name: "Pak Dary Aghny",
    role: "Wakasek Kurikulum, SMP Harapan",
  },
  {
    quote:
      "Penilaian quiz otomatis menghemat waktu koreksi saya tiap minggu. Rekap nilainya rapi dan mudah dibaca.",
    name: "Bu Rani Wijaya",
    role: "Guru Matematika, SMK Bina Karya",
  },
];

function Testimonials() {
  return (
    <section id="testimoni" className="scroll-mt-20 bg-sand/40">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <SectionHeading
          eyebrow="Testimoni"
          title="Dipercaya para pendidik"
          subtitle="Kata mereka yang menggunakan Equora setiap hari."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col rounded-xl border border-line bg-paper p-6"
            >
              <Quote className="h-7 w-7 text-accent" />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5 border-t border-line pt-4">
                <div className="font-display text-base font-medium text-ink">
                  {t.name}
                </div>
                <div className="font-mono text-xs text-muted">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Pricing teaser ───────────────────────────────────── */
const tiers = [
  { name: "Starting", note: "Sekolah kecil", icon: CalendarDays },
  { name: "Basic", note: "Sekolah menengah", icon: ClipboardList },
  { name: "Pro", note: "Sekolah besar", icon: BarChart3 },
  { name: "Custom", note: "Yayasan / multi-cabang", icon: ShieldCheck },
];

function PricingTeaser() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <SectionHeading
        eyebrow="Harga"
        title="Bayar sesuai skala sekolah"
        subtitle="Semua fitur tersedia di setiap paket—yang membedakan kuota akun, penyimpanan, dan AI."
      />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((t) => (
          <div
            key={t.name}
            className="rounded-xl border border-line bg-paper p-6 text-center"
          >
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-lg bg-teal-700/10 text-teal-700">
              <t.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display text-xl font-medium text-ink">
              {t.name}
            </h3>
            <p className="mt-1 text-sm text-muted">{t.note}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 text-center">
        <Button href="/harga" variant="primary" size="lg">
          Lihat detail harga <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

/* ── CTA band ─────────────────────────────────────────── */
function CtaBand() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-24">
      <div className="overflow-hidden rounded-2xl bg-teal-900 px-8 py-14 text-center text-paper md:px-16">
        <h2 className="mx-auto max-w-2xl font-display text-3xl font-medium leading-tight md:text-4xl">
          Siap menenangkan administrasi sekolah Anda?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-paper/70">
          Coba Equora gratis hari ini. Tanpa kartu kredit, tanpa komitmen.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/daftar" variant="accent" size="lg">
            Mulai Gratis <ArrowRight className="h-4 w-4" />
          </Button>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center rounded-md border border-paper/30 px-6 py-3 text-base font-semibold text-paper transition-colors hover:bg-paper/10"
          >
            Request Demo
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Shared ───────────────────────────────────────────── */
function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="max-w-2xl">
      <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted">
        <span className="h-px w-5 bg-accent" />
        {eyebrow}
      </span>
      <h2 className="mt-4 font-display text-3xl font-medium leading-tight text-ink md:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-muted">{subtitle}</p>
    </div>
  );
}
