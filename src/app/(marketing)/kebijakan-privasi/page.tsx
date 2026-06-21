import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";

export const metadata: Metadata = {
  title: "Kebijakan Privasi — Equora",
  description: "Bagaimana Equora mengumpulkan, menggunakan, dan melindungi data.",
};

const sections = [
  {
    h: "1. Data yang kami kumpulkan",
    p: [
      "Kami mengumpulkan data yang diperlukan untuk menjalankan layanan: identitas sekolah, akun pengguna (nama, email/NIS), data akademik (kelas, jadwal, nilai, kehadiran), serta berkas yang diunggah sekolah.",
    ],
  },
  {
    h: "2. Data biometrik (fitur absensi wajah)",
    p: [
      "Bila sekolah mengaktifkan absensi dengan pengenalan wajah, data biometrik diproses semata-mata untuk keperluan absensi.",
      "Karena sebagian besar siswa adalah anak di bawah umur, sekolah wajib memperoleh persetujuan orang tua/wali sebelum mengaktifkan fitur ini, sesuai ketentuan perlindungan data pribadi yang berlaku di Indonesia.",
    ],
  },
  {
    h: "3. Bagaimana kami menggunakan data",
    p: [
      "Data digunakan untuk menyediakan dan meningkatkan layanan, mengamankan akun, serta memenuhi kewajiban hukum. Kami tidak menjual data pribadi Anda kepada pihak ketiga.",
    ],
  },
  {
    h: "4. Penyimpanan & keamanan",
    p: [
      "Data setiap sekolah disimpan secara terisolasi dan hanya dapat diakses oleh pengguna yang berwenang di sekolah tersebut. Kami menerapkan langkah teknis dan organisasi yang wajar untuk melindungi data.",
    ],
  },
  {
    h: "5. Hak Anda",
    p: [
      "Anda berhak mengakses, memperbaiki, atau meminta penghapusan data pribadi sesuai ketentuan yang berlaku. Permohonan dapat diajukan melalui kontak resmi kami.",
    ],
  },
  {
    h: "6. Perubahan kebijakan",
    p: [
      "Kebijakan ini dapat diperbarui dari waktu ke waktu. Perubahan penting akan kami informasikan melalui platform.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero title="Kebijakan Privasi" subtitle="Terakhir diperbarui: Juni 2026" />
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
          Pertanyaan tentang privasi? Hubungi kami di{" "}
          <a href="/kontak" className="font-semibold text-teal-700">
            halaman kontak
          </a>
          .
        </p>
      </section>
    </>
  );
}
