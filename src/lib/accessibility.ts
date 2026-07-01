/**
 * Sumber tunggal data aksesibilitas / kebutuhan khusus siswa.
 *
 * Dipakai oleh:
 * - Pengaturan siswa (memilih kebutuhan khusus).
 * - Halaman panduan `/siswa/aksesibilitas` & `/siswa/aksesibilitas/[jenis]`
 *   (menampilkan fitur apa saja yang didapat siswa).
 *
 * `status` tiap fitur:
 * - "aktif"  = sudah bisa dinyalakan/dipakai sekarang.
 * - "segera" = sedang disiapkan (tombol/preferensi mungkin sudah ada, fungsinya menyusul).
 */

export type FeatureStatus = "aktif" | "segera";

export type AccessibilityFeature = {
  title: string;
  desc: string;
  status: FeatureStatus;
};

export type DisabilityKey = "netra" | "rungu" | "wicara" | "buta-warna";

export type DisabilityGuide = {
  key: DisabilityKey;
  /** Nama yang dikenal siswa. */
  label: string;
  /** Istilah formal (untuk konteks). */
  formal: string;
  /** Satu kalimat ramah anak. */
  tagline: string;
  /** Warna aksen kartu (token kid di globals.css). */
  tone: string;
  features: AccessibilityFeature[];
};

export const DISABILITY_GUIDES: DisabilityGuide[] = [
  {
    key: "netra",
    label: "Sulit Melihat",
    formal: "Tunanetra",
    tagline: "Aplikasi bisa dibacakan dengan suara dan dijalankan tanpa mouse.",
    tone: "grape",
    features: [
      {
        title: "Teks dibacakan (Teks-ke-Suara)",
        desc: "Tulisan di layar dibacakan dengan suara. Nyalakan lewat Pengaturan.",
        status: "aktif",
      },
      {
        title: "Cocok dengan pembaca layar",
        desc: "Bisa dipakai bersama TalkBack (HP) atau NVDA/VoiceOver di komputer.",
        status: "aktif",
      },
      {
        title: "Jalan tanpa mouse",
        desc: "Semua tombol bisa dijangkau memakai keyboard saja (tombol Tab & Enter).",
        status: "aktif",
      },
      {
        title: "Pengumuman bersuara saat Meet",
        desc: "Saat kelas online, kejadian penting (guru masuk, materi ganti) diberitahu lewat suara.",
        status: "segera",
      },
      {
        title: "Absen tanpa kamera",
        desc: "Alternatif absen Face ID: cukup lewat tombol atau otomatis saat masuk kelas.",
        status: "segera",
      },
    ],
  },
  {
    key: "rungu",
    label: "Sulit Mendengar",
    formal: "Tunarungu",
    tagline: "Suara di kelas diubah jadi teks dan tanda yang bisa dilihat.",
    tone: "sky",
    features: [
      {
        title: "Teks berjalan saat Meet",
        desc: "Ucapan guru muncul sebagai teks (caption) di layar saat kelas online.",
        status: "segera",
      },
      {
        title: "Penerjemah bahasa isyarat (BISINDO)",
        desc: "Bahasa isyarat diterjemahkan menjadi teks. Nyalakan lewat Pengaturan.",
        status: "segera",
      },
      {
        title: "Catatan kelas tersimpan",
        desc: "Teks lengkap dari kelas bisa dibaca lagi setelah pelajaran selesai.",
        status: "segera",
      },
      {
        title: "Notifikasi yang terlihat",
        desc: "Pemberitahuan tampil sebagai tanda visual, bukan hanya bunyi.",
        status: "aktif",
      },
      {
        title: "Obrolan teks di kelas",
        desc: "Selalu bisa bertanya dan menjawab lewat chat tulisan.",
        status: "aktif",
      },
    ],
  },
  {
    key: "wicara",
    label: "Sulit Bicara",
    formal: "Tunawicara",
    tagline: "Kamu bisa ikut berbicara lewat tulisan yang disuarakan.",
    tone: "mint",
    features: [
      {
        title: "Ketik lalu disuarakan",
        desc: "Tulis kalimatmu, aplikasi yang membacakannya ke kelas.",
        status: "segera",
      },
      {
        title: "Chat teks setara bicara",
        desc: "Pesan tulisanmu ditandai untuk guru supaya tidak terlewat.",
        status: "aktif",
      },
      {
        title: "Angkat tangan & reaksi cepat",
        desc: "Ikut aktif di kelas tanpa perlu bersuara.",
        status: "aktif",
      },
      {
        title: "Ujian lisan lewat teks",
        desc: "Bagian yang biasanya diucapkan bisa dijawab dengan tulisan.",
        status: "segera",
      },
    ],
  },
  {
    key: "buta-warna",
    label: "Sulit Membedakan Warna",
    formal: "Buta warna",
    tagline: "Setiap tanda tidak hanya memakai warna, jadi tetap jelas.",
    tone: "sunny",
    features: [
      {
        title: "Tanda selain warna",
        desc: "Benar/salah pakai ikon ✓/✗ dan tulisan, bukan hanya hijau/merah.",
        status: "aktif",
      },
      {
        title: "Warna kontras tinggi",
        desc: "Teks dan latar dibuat cukup kontras supaya mudah dibaca.",
        status: "aktif",
      },
      {
        title: "Grafik pakai pola & label",
        desc: "Diagram nilai dibedakan dengan pola dan tulisan, bukan hanya warna.",
        status: "segera",
      },
      {
        title: "Mode aman buta warna",
        desc: "Mengganti kombinasi warna yang sulit dibedakan.",
        status: "segera",
      },
    ],
  },
];

export const DISABILITY_KEYS = DISABILITY_GUIDES.map((g) => g.key);

export function isDisabilityKey(v: string): v is DisabilityKey {
  return (DISABILITY_KEYS as string[]).includes(v);
}

export function getGuide(key: string): DisabilityGuide | undefined {
  return DISABILITY_GUIDES.find((g) => g.key === key);
}

/** Ambil hanya kunci yang valid dari data tersimpan (buang yang tak dikenal). */
export function sanitizeDisabilities(value: unknown): DisabilityKey[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is DisabilityKey => typeof v === "string" && isDisabilityKey(v));
}
