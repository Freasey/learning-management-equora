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
  Palette,
  FileCode2,
  Gamepad2,
  Accessibility,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoVideo } from "@/components/site/demo-video";

export const metadata: Metadata = {
  title: "Equora Manajemen Sekolah dengan AI & Aksesibilitas Bawaan",
  description:
    "Kelola siswa, guru, kurikulum, kelas, dan penilaian. AI bantu buat soal ujian, dan setiap siswa punya cara belajar yang sesuai untuknya.",
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
            <Sparkles className="h-3.5 w-3.5" /> E-Learning Sekolah K-12
          </span>
          <h1 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink md:text-6xl">
            Mengajar lebih cepat, belajar lebih{" "}
            <em className="text-teal-700 italic">seru</em>.
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted">
            Kelola kelas dan nilai, AI bantu buat soal ujian, dan setiap siswa 
            termasuk yang berkebutuhan khusus punya cara belajar yang sesuai
            untuknya.
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
            Coba dulu di sekolah demo yang selalu aktif, tanpa perlu daftar
          </p>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-paper p-2 shadow-[0_24px_60px_-30px_rgba(14,58,58,0.45)]">
      <DemoVideo
        src="/videos/hero-demo.mp4"
        poster="/videos/hero-demo-poster.jpg"
        alt="Guru meng-generate soal AI dari materi PDF yang diunggah"
        eager
        className="aspect-4/3 w-full rounded-xl object-cover"
      />
    </div>
  );
}

/* ── Trust strip ──────────────────────────────────────── */
function TrustStrip() {
  return (
    <section className="border-y border-line bg-sand/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-8 text-center md:flex-row md:justify-between md:text-left">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          Coba sendiri sekolah demo yang selalu aktif, bukan sekadar tangkapan
          layar
        </p>
        <Button href="/demo" variant="ghost" size="md">
          Coba Demo Sekarang <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

/* ── Features per role ────────────────────────────────── */
const featureGroups = [
  {
    icon: ShieldCheck,
    role: "Admin Sekolah",
    desc: "Data siswa, guru, dan kelas tersinkron otomatis tidak perlu spreadsheet terpisah-pisah lagi.",
    items: [
      "Manajemen siswa, guru & kelas",
      "Kurikulum, mata pelajaran & jadwal",
      "Persetujuan pendaftaran via kode sekolah",
      "Kuota & langganan transparan",
    ],
    video: {
      src: "/videos/feature-admin-demo.mp4",
      poster: "/videos/feature-admin-demo-poster.jpg",
      alt: "Admin menyetujui pendaftaran siswa via kode sekolah",
    },
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
    video: {
      src: "/videos/feature-guru-demo.mp4",
      poster: "/videos/feature-guru-demo-poster.jpg",
      alt: "Guru meng-generate soal dari materi PDF yang diunggah",
    },
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
    video: {
      src: "/videos/feature-siswa-demo.mp4",
      poster: "/videos/feature-siswa-demo-poster.jpg",
      alt: "Siswa mengerjakan kuis dalam bentuk game Ular",
    },
  },
];

function Features() {
  return (
    <section id="fitur" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
      <SectionHeading
        eyebrow="Fitur"
        title="Tiga peran, satu alur kerja yang sama"
        subtitle="Admin, guru, dan siswa mengakses data yang sama secara langsung bukan tiga sistem terpisah."
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
            <DemoVideo
              src={g.video.src}
              poster={g.video.poster}
              alt={g.video.alt}
              className="mt-5 aspect-video w-full rounded-lg border border-line object-cover"
            />
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
    video: {
      src: "/videos/inclusive-netra-demo.mp4",
      poster: "/videos/inclusive-netra-demo-poster.jpg",
      alt: "Teks-ke-suara membacakan konten halaman",
    },
  },
  {
    icon: Ear,
    title: "Tunarungu",
    desc: "Teks langsung (live caption) di kelas online agar tak ada yang tertinggal.",
    video: {
      src: "/videos/inclusive-rungu-demo.mp4",
      poster: "/videos/inclusive-rungu-demo-poster.jpg",
      alt: "Live caption berjalan saat kelas online berlangsung",
    },
  },
  {
    icon: MessageSquare,
    title: "Tunawicara",
    desc: "Dukungan komunikasi berbasis teks & isyarat dalam ruang belajar.",
    video: {
      src: "/videos/inclusive-wicara-demo.mp4",
      poster: "/videos/inclusive-wicara-demo-poster.jpg",
      alt: "Teks diucapkan otomatis mewakili siswa dalam ruang belajar",
    },
  },
  {
    icon: Palette,
    title: "Buta Warna",
    desc: "Palet warna otomatis menyesuaikan untuk deuteranopia, protanopia, tritanopia, dan monokromasi.",
    video: {
      src: "/videos/inclusive-warna-demo.mp4",
      poster: "/videos/inclusive-warna-demo-poster.jpg",
      alt: "Tampilan berganti palet warna ramah buta warna",
    },
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
          Sekolah inklusif bukan tambahan {" "}
          <span className="text-accent">tapi bawaan.</span>
        </h2>
        <p className="mt-4 max-w-xl text-paper/70">
          Equora dibangun agar setiap siswa, dengan kemampuan apa pun, dapat
          belajar dengan setara.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
              <DemoVideo
                src={i.video.src}
                poster={i.video.poster}
                alt={i.video.alt}
                className="mt-4 aspect-video w-full rounded-lg border border-paper/15 object-cover"
              />
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

/* ── Bukti Produk ──────────────────────────────────────── */
const proofPoints = [
  {
    icon: Sparkles,
    title: "Soal AI dari PDF, hitungan detik",
    desc: "Unggah materi (PDF, DOCX, gambar), AI langsung susun soal pilihan ganda & esai sesuai tingkat kesulitan.",
  },
  {
    icon: FileCode2,
    title: "8 layout desain PPTX otomatis",
    desc: "Materi ajar diekspor jadi file .pptx asli, siap dibuka di PowerPoint atau Google Slides.",
  },
  {
    icon: Accessibility,
    title: "4 mode aksesibilitas aktif",
    desc: "4 mode aksesibilitas aktif: netra, tunarungu, tunawicara, buta warna.",
  },
  {
    icon: Gamepad2,
    title: "Kuis jadi game Ular & Pacman",
    desc: "Kuis pilihan ganda yang sama bisa dimainkan sebagai game Ular atau Pacman.",
  },
];

function Testimonials() {
  return (
    <section id="bukti-produk" className="scroll-mt-20 bg-sand/40">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <SectionHeading
          eyebrow="Bukti Produk"
          title="Empat hal yang benar-benar berjalan hari ini"
          subtitle="Coba sendiri di sekolah demo yang selalu aktif tidak perlu daftar dulu."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {proofPoints.map((p) => (
            <div
              key={p.title}
              className="flex flex-col rounded-xl border border-line bg-paper p-6"
            >
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-teal-700/10 text-teal-700">
                <p.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-medium text-ink">
                {p.title}
              </h3>
              <p className="mt-2 text-sm text-muted">{p.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button href="/demo" variant="primary" size="lg">
            Coba Demo Sekarang <ArrowRight className="h-4 w-4" />
          </Button>
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
        subtitle="Semua fitur tersedia di setiap paket yang membedakan kuota akun, penyimpanan, dan AI."
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
          Mulai kelola sekolah Anda dengan Equora hari ini.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-paper/70">
          Coba Equora gratis hari ini, atau jelajahi dulu di sekolah demo yang
          selalu aktif.
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
