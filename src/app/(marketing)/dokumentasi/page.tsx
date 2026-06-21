import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  GraduationCap,
  Backpack,
  LogIn,
  ListChecks,
  HelpCircle,
} from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Dokumentasi & Panduan — Equora",
  description:
    "Panduan lengkap cara memakai Equora untuk Admin Sekolah, Guru, dan Siswa. Bisa dibaca siapa saja.",
};

type Role = {
  id: string;
  icon: typeof ShieldCheck;
  tone: string; // warna aksen ikon
  name: string;
  tagline: string;
  login: string;
  steps: { title: string; desc: string }[];
  features: string[];
};

const roles: Role[] = [
  {
    id: "admin",
    icon: ShieldCheck,
    tone: "text-teal-700 bg-teal-700/10",
    name: "Admin Sekolah",
    tagline:
      "Menyiapkan dan mengelola seluruh data sekolah: kelas, mata pelajaran, jadwal, hingga akun guru dan siswa.",
    login: "Masuk lewat halaman Masuk menggunakan email dan kata sandi admin.",
    steps: [
      {
        title: "Lengkapi profil & tahun ajaran",
        desc: "Buka Setelan → Pengaturan untuk mengisi identitas sekolah dan menetapkan tahun ajaran aktif. Seluruh data mengikuti tahun ajaran ini.",
      },
      {
        title: "Susun struktur akademik",
        desc: "Lewat menu Akademik, buat Kelas, Mata Pelajaran, lalu rangkai Jadwal pelajaran mingguan.",
      },
      {
        title: "Tambahkan guru & siswa",
        desc: "Di menu Manajemen, undang guru dan siswa secara satu per satu atau impor massal lewat Excel. Setiap akun yang aktif memakai kuota paket Anda.",
      },
      {
        title: "Setujui pendaftaran",
        desc: "Calon anggota yang masuk lewat kode sekolah muncul di Pendaftaran. Setujui untuk menempatkan mereka ke kelas dan mengaktifkan akun.",
      },
      {
        title: "Sebarkan pengumuman & pantau langganan",
        desc: "Gunakan Pengumuman untuk kabar ke seluruh warga sekolah, dan menu Langganan untuk memantau kuota serta tagihan.",
      },
    ],
    features: [
      "Kelas, Mata Pelajaran & Jadwal",
      "Manajemen Guru & Siswa",
      "Persetujuan pendaftaran (kode sekolah / impor)",
      "Pengumuman sekolah",
      "Pengaturan tahun ajaran & langganan",
    ],
  },
  {
    id: "guru",
    icon: GraduationCap,
    tone: "text-accent bg-accent/10",
    name: "Guru",
    tagline:
      "Mengajar, membuat materi & penilaian, lalu memantau perkembangan siswa dari satu tempat.",
    login: "Masuk lewat halaman Masuk dengan email dan kata sandi dari sekolah.",
    steps: [
      {
        title: "Cek jadwal mengajar",
        desc: "Buka Mengajar → Jadwal untuk melihat kelas dan mata pelajaran yang Anda ampu hari ini.",
      },
      {
        title: "Siapkan materi",
        desc: "Di Mengajar → Materi, unggah bahan ajar atau buat materi presentasi untuk dibagikan ke kelas.",
      },
      {
        title: "Buat Kuis & Ujian",
        desc: "Lewat Penilaian → Kuis & Ujian, susun soal untuk latihan ringan (kuis) maupun penilaian resmi (ujian).",
      },
      {
        title: "Beri & pantau nilai",
        desc: "Menu Penilaian → Nilai menampung seluruh hasil belajar beserta ringkasan perkembangan tiap siswa.",
      },
      {
        title: "Mengajar langsung lewat Meet",
        desc: "Mulai kelas daring dari menu Meet. Gunakan Obrolan untuk komunikasi dengan siswa di luar jam.",
      },
    ],
    features: [
      "Jadwal mengajar",
      "Materi & bahan ajar",
      "Kuis & Ujian",
      "Nilai + ringkasan perkembangan",
      "Meet & Obrolan kelas",
    ],
  },
  {
    id: "siswa",
    icon: Backpack,
    tone: "text-coral bg-coral/10",
    name: "Siswa",
    tagline:
      "Belajar, mengerjakan kuis & ujian, ikut kelas daring, dan mengecek nilai dengan tampilan yang ramah.",
    login:
      "Masuk lewat halaman Masuk Siswa menggunakan NIS / username dan kata sandi — tidak perlu email.",
    steps: [
      {
        title: "Mulai dari Beranda",
        desc: "Beranda siswa berbentuk kotak-kotak besar (bento). Ketuk satu kotak untuk membuka bagiannya; tombol logo selalu membawamu kembali ke Beranda.",
      },
      {
        title: "Kerjakan Kuis & Ujian",
        desc: "Buka kotak Kuis untuk mengerjakan soal latihan dan ujian yang diberikan guru.",
      },
      {
        title: "Lihat Jadwal & Materi",
        desc: "Cek kotak Jadwal untuk pelajaran hari ini, dan Materi untuk bahan belajar dari guru.",
      },
      {
        title: "Ikut kelas lewat Meet",
        desc: "Masuk ke kelas daring dari kotak Meet, dan pakai Obrolan untuk bertanya ke guru.",
      },
      {
        title: "Atur kenyamanan di Pengaturan",
        desc: "Aktifkan bantuan baca teks (suara) atau bantuan bahasa isyarat saat Meet bila dibutuhkan.",
      },
    ],
    features: [
      "Beranda bento yang ramah",
      "Kuis & Ujian",
      "Jadwal & Materi",
      "Meet & Obrolan",
      "Pengaturan aksesibilitas",
    ],
  },
];

export default function DokumentasiPage() {
  return (
    <>
      <PageHero
        eyebrow="Dokumentasi"
        title="Panduan memakai Equora"
        subtitle="Cara pakai untuk setiap peran—Admin Sekolah, Guru, dan Siswa. Bebas dibaca siapa saja, termasuk calon pengguna."
      />

      {/* Navigasi cepat antar peran */}
      <section className="mx-auto max-w-4xl px-5 pt-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {roles.map((r) => (
            <a
              key={r.id}
              href={`#${r.id}`}
              className="group rounded-xl border border-line bg-paper p-5 transition-colors hover:border-teal-700"
            >
              <span
                className={`grid h-11 w-11 place-items-center rounded-lg ${r.tone}`}
              >
                <r.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-display text-lg font-medium text-ink">
                {r.name}
              </h2>
              <p className="mt-1 text-sm text-muted">{r.tagline}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Bagian per peran */}
      {roles.map((r) => (
        <section
          key={r.id}
          id={r.id}
          className="mx-auto max-w-4xl scroll-mt-24 px-5 py-14"
        >
          <div className="flex items-center gap-3">
            <span
              className={`grid h-12 w-12 place-items-center rounded-xl ${r.tone}`}
            >
              <r.icon className="h-6 w-6" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-medium text-ink md:text-3xl">
                {r.name}
              </h2>
              <p className="text-sm text-muted">{r.tagline}</p>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-line bg-sand/40 p-4">
            <LogIn className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
            <p className="text-sm text-ink">
              <span className="font-medium">Cara masuk: </span>
              {r.login}
            </p>
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-[1.6fr_1fr]">
            {/* Langkah */}
            <ol className="space-y-5">
              {r.steps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal-700 font-mono text-sm font-semibold text-paper">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-base font-medium text-ink">
                      {s.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      {s.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            {/* Daftar fitur */}
            <aside className="rounded-xl border border-line bg-paper p-5">
              <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted">
                <ListChecks className="h-4 w-4" /> Yang bisa diakses
              </h3>
              <ul className="mt-4 space-y-2.5">
                {r.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {f}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="border-t border-line bg-sand/40">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-teal-700/10 text-teal-700 mx-auto">
            <HelpCircle className="h-6 w-6" />
          </span>
          <h2 className="mt-4 font-display text-2xl font-medium text-ink">
            Masih bingung?
          </h2>
          <p className="mt-2 text-muted">
            Lihat pertanyaan umum atau hubungi tim kami—kami senang membantu.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/faq" variant="primary" size="md">
              Baca FAQ
            </Button>
            <Button href="/kontak" variant="ghost" size="md">
              Hubungi Kami
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted">
            <Link href="/" className="underline hover:text-ink">
              Kembali ke beranda
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
