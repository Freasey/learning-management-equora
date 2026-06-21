import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan — Equora",
  description: "Syarat dan ketentuan penggunaan layanan Equora.",
};

const sections = [
  {
    h: "1. Penerimaan ketentuan",
    p: [
      "Dengan menggunakan Equora, sekolah dan penggunanya menyetujui syarat dan ketentuan ini. Bila tidak setuju, mohon untuk tidak menggunakan layanan.",
    ],
  },
  {
    h: "2. Akun & tanggung jawab",
    p: [
      "Admin sekolah bertanggung jawab atas kebenaran data yang dimasukkan serta atas aktivitas akun di bawah sekolahnya, termasuk menjaga kerahasiaan kredensial.",
    ],
  },
  {
    h: "3. Langganan & pembayaran",
    p: [
      "Layanan disediakan berdasarkan paket berlangganan (bulanan atau tahunan). Kuota akun, penyimpanan, dan kredit AI mengikuti paket yang dipilih. Harga dapat berubah dengan pemberitahuan sebelumnya.",
    ],
  },
  {
    h: "4. Penggunaan yang dapat diterima",
    p: [
      "Pengguna dilarang menyalahgunakan layanan, termasuk upaya mengakses data sekolah lain, mengunggah konten melanggar hukum, atau mengganggu kerja sistem.",
    ],
  },
  {
    h: "5. Ketersediaan layanan",
    p: [
      "Kami berupaya menjaga layanan tetap tersedia, namun dapat melakukan pemeliharaan terjadwal. Pemberitahuan akan diberikan untuk pemeliharaan yang berdampak.",
    ],
  },
  {
    h: "6. Penghentian",
    p: [
      "Sekolah dapat berhenti berlangganan kapan saja. Kami berhak menangguhkan akun yang melanggar ketentuan ini.",
    ],
  },
  {
    h: "7. Batasan tanggung jawab",
    p: [
      "Layanan disediakan sebagaimana adanya. Sejauh diizinkan hukum, kami tidak bertanggung jawab atas kerugian tidak langsung yang timbul dari penggunaan layanan.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHero title="Syarat & Ketentuan" subtitle="Terakhir diperbarui: Juni 2026" />
      <section className="mx-auto max-w-3xl px-5 py-16">
        <div className="space-y-8">
          {sections.map((s) => (
            <div key={s.h}>
              <h2 className="font-display text-xl font-medium text-ink">{s.h}</h2>
              {s.p.map((para, i) => (
                <p key={i} className="mt-3 leading-relaxed text-muted">
                  {para}
                </p>
              ))}
            </div>
          ))}
        </div>
        <p className="mt-12 border-t border-line pt-6 text-sm text-muted">
          Ada pertanyaan? Hubungi kami di{" "}
          <a href="/kontak" className="font-semibold text-teal-700">
            halaman kontak
          </a>
          .
        </p>
      </section>
    </>
  );
}
