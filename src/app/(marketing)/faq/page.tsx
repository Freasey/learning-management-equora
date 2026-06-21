import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "FAQ — Equora",
  description: "Pertanyaan yang sering diajukan tentang Equora.",
};

const faqs = [
  {
    q: "Apakah data sekolah kami aman dan terpisah dari sekolah lain?",
    a: "Ya. Setiap sekolah memiliki ruang data terisolasi—data satu sekolah tidak akan pernah terlihat oleh sekolah lain.",
  },
  {
    q: "Bagaimana cara memindahkan data siswa yang sudah ada?",
    a: "Anda bisa mengimpor data siswa dan guru secara massal lewat berkas Excel. Tim kami juga siap membantu proses migrasi.",
  },
  {
    q: "Apakah semua fitur tersedia di setiap paket?",
    a: "Ya. Semua fitur inti tersedia di semua paket. Yang membedakan paket adalah kuota akun, penyimpanan, dan kredit AI.",
  },
  {
    q: "Bagaimana siswa masuk jika belum punya email?",
    a: "Siswa masuk menggunakan NIS/username dan kata sandi yang disiapkan sekolah—tidak wajib memiliki email.",
  },
  {
    q: "Apa saja fitur inklusif yang tersedia?",
    a: "Kami menyediakan dukungan untuk siswa tunanetra (teks-ke-suara), tunarungu (teks langsung), dan tunawicara—dirancang sebagai bagian inti platform.",
  },
  {
    q: "Apakah ada kontrak jangka panjang?",
    a: "Tidak. Anda bisa berlangganan bulanan atau tahunan, dan berhenti kapan saja. Langganan tahunan mendapat harga lebih hemat.",
  },
  {
    q: "Bisakah kami mencoba sebelum berlangganan?",
    a: "Tentu. Mulai gratis tanpa kartu kredit, atau jadwalkan demo agar kami bisa menyesuaikan dengan kebutuhan sekolah Anda.",
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title="Pertanyaan yang sering diajukan"
        subtitle="Tidak menemukan jawaban yang Anda cari? Hubungi kami kapan saja."
      />

      <section className="mx-auto max-w-3xl px-5 py-16">
        <div className="space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-line bg-paper p-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-lg font-medium text-ink">
                {f.q}
                <Plus className="h-5 w-5 shrink-0 text-teal-700 transition-transform group-open:rotate-45" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-line bg-sand/50 p-8 text-center">
          <h2 className="font-display text-xl font-medium text-ink">
            Masih ada pertanyaan?
          </h2>
          <p className="mt-2 text-sm text-muted">
            Tim kami senang membantu Anda.
          </p>
          <Button href="/kontak" variant="primary" size="md" className="mt-5">
            Hubungi Kami
          </Button>
        </div>
      </section>
    </>
  );
}
