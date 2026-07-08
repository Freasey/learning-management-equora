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
        desc: "Tulisan di layar dibacakan dengan suara, otomatis aktif saat kamu memilih kebutuhan ini.",
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
    tagline: "Suara di kelas online diubah jadi teks yang bisa kamu baca.",
    tone: "sky",
    features: [
      {
        title: "Teks berjalan saat Meet",
        desc: "Ucapan guru dan teman muncul sebagai teks (caption) di layar saat kelas online otomatis menyala saat kamu memilih kebutuhan ini.",
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
        desc: "Tulis kalimatmu di Kelas Online lewat tombol Bicara semua peserta mendengarnya dibacakan dengan suara, seperti kamu ikut berbicara.",
        status: "aktif",
      },
      {
        title: "Frasa cepat",
        desc: "Tombol kalimat siap pakai (misalnya “Bisa diulang, Bu/Pak?”) supaya kamu bisa merespons secepat teman-temanmu.",
        status: "aktif",
      },
    ],
  },
  {
    key: "buta-warna",
    label: "Sulit Membedakan Warna",
    formal: "Buta warna",
    tagline:
      "Warna aplikasi bisa diganti sesuai warna yang sulit kamu bedakan.",
    tone: "sunny",
    features: [
      {
        title: "Mode Warna",
        desc: "Pilih warna mana yang sulit kamu bedakan di Pengaturan seluruh warna aplikasi langsung menyesuaikan untukmu.",
        status: "aktif",
      },
      {
        title: "Tanda selain warna",
        desc: "Benar/salah pakai ikon ✓/✗ dan tulisan, bukan hanya hijau/merah.",
        status: "aktif",
      },
    ],
  },
];

/* ── Mode Warna (buta warna) ─────────────────────────────────────
 *
 * Mengganti token warna "Bright Campus" (globals.css) untuk seluruh area
 * siswa. Palet dipilih supaya pasangan warna yang membingungkan bagi tiap
 * jenis buta warna diganti poros warna yang tetap bisa mereka bedakan:
 *
 * - merah-hijau (deuteranopia/protanopia, jenis terbanyak): benar/salah
 *   digeser ke poros biru–oranye (palet Okabe–Ito). Ungu default terlihat
 *   biru bagi mereka, jadi digeser ke ungu-kemerahan.
 * - biru-kuning (tritanopia): biru↔hijau dan kuning↔ungu membingungkan,
 *   jadi biru & ungu digelapkan agar terpisah jauh secara terang-gelap.
 * - mono (monokromasi): rona tak membantu sama sekali semua aksen jadi
 *   skala abu gelap berkontras tinggi; makna dibawa ikon & tulisan.
 *
 * Nilai palette adalah CSS variable yang menimpa token @theme lewat inline
 * style di layout siswa (dirender dari server, tanpa kedipan warna salah).
 */

export type ColorVisionKey = "merah-hijau" | "biru-kuning" | "mono";

export type ColorVisionMode = {
  key: ColorVisionKey;
  /** Bahasa anak apa yang siswa rasakan. */
  label: string;
  /** Istilah formal (untuk konteks orang tua/guru). */
  formal: string;
  desc: string;
  /** Token warna yang ditimpa (nama CSS variable → hex). */
  palette: Record<string, string>;
  /** Empat warna contoh untuk pratinjau di Pengaturan. */
  preview: [string, string, string, string];
};

export const COLOR_VISION_MODES: ColorVisionMode[] = [
  {
    key: "merah-hijau",
    label: "Aku sulit membedakan merah & hijau",
    formal: "Deuteranopia / Protanopia",
    desc: "Benar & salah memakai biru dan oranye, bukan hijau dan merah.",
    palette: {
      "--color-mint": "#0072b2", // benar/sukses → biru kuat
      "--color-coral": "#d55e00", // salah/bahaya → oranye vermilion
      "--color-grape": "#cc79a7", // ungu → ungu-kemerahan (ungu asli tampak biru)
    },
    preview: ["#0072b2", "#d55e00", "#3da9fc", "#ffc145"],
  },
  {
    key: "biru-kuning",
    label: "Aku sulit membedakan biru & kuning",
    formal: "Tritanopia",
    desc: "Biru dibuat lebih gelap supaya tidak tertukar dengan hijau, ungu dijauhkan dari kuning.",
    palette: {
      "--color-sky": "#1d4ed8", // biru terang → biru gelap (jauh dari hijau mint)
      "--color-grape": "#4c2fbf", // ungu → ungu gelap (jauh dari kuning)
    },
    preview: ["#27ca9a", "#ff6b5e", "#1d4ed8", "#ffc145"],
  },
  {
    key: "mono",
    label: "Semua warna terlihat mirip bagiku",
    formal: "Monokromasi",
    desc: "Warna diganti gelap–terang berkontras tinggi; tanda mengandalkan ikon dan tulisan.",
    palette: {
      "--color-sky": "#0f172a",
      "--color-mint": "#1e293b",
      "--color-coral": "#334155",
      "--color-grape": "#475569",
      "--color-sunny": "#64748b",
      "--color-cream": "#ffffff",
    },
    preview: ["#0f172a", "#334155", "#64748b", "#94a3b8"],
  },
];

export const COLOR_VISION_KEYS = COLOR_VISION_MODES.map((m) => m.key);

export function isColorVisionKey(v: string): v is ColorVisionKey {
  return (COLOR_VISION_KEYS as string[]).includes(v);
}

export function getColorVisionMode(
  key: string,
): ColorVisionMode | undefined {
  return COLOR_VISION_MODES.find((m) => m.key === key);
}

/** Ambil mode warna yang valid dari data tersimpan; selain itu null (warna biasa). */
export function sanitizeColorVision(value: unknown): ColorVisionKey | null {
  return typeof value === "string" && isColorVisionKey(value) ? value : null;
}

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
