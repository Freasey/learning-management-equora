/**
 * Fondasi bersama fitur slide materi ajar (dipakai client & server):
 *  - Format teks slide (markdown ringan) + parser-nya.
 *  - Spesifikasi desain ("cetak biru") yang diisi AI, berikut pembersih/validasinya:
 *    font dibatasi daftar aman & warna dikoreksi otomatis agar teks selalu terbaca.
 *
 * Format teks slide (satu slide per blok, dipisah baris `---`):
 *   # Judul slide
 *   [tipe: poin]          ← opsional; salah satu SLIDE_TYPES (default: poin)
 *   Paragraf bebas.
 *   - butir isi (hanya bila memang daftar)
 *   ```
 *   kode program / rumus matematis tampil sebagai panel terpisah di slide
 *   ```
 *   (Baris berawalan '>' dari format lama tetap dikenali tapi diabaikan.)
 */

export const SLIDE_TYPES = [
  "pembuka",
  "bab",
  "poin",
  "dua-kolom",
  "kutipan",
  "angka",
  "contoh",
  "diskusi",
  "penutup",
] as const;

export type SlideType = (typeof SLIDE_TYPES)[number];

export type ParsedSlide = {
  type: SlideType;
  title: string;
  bullets: string[];
  body: string[];
  /** Baris kode program / rumus matematis (dari blok ```), dirender sebagai panel terpisah. */
  code: string[];
};

/** Label tipe slide untuk ditampilkan di pratinjau. */
export const slideTypeLabel: Record<SlideType, string> = {
  pembuka: "Pembuka",
  bab: "Pemisah Bab",
  poin: "Poin",
  "dua-kolom": "Dua Kolom",
  kutipan: "Kutipan",
  angka: "Angka Besar",
  contoh: "Contoh Soal",
  diskusi: "Diskusi",
  penutup: "Penutup",
};

/** Pisah teks slide menjadi struktur per slide. Toleran terhadap variasi kecil. */
export function parseSlides(markdown: string): ParsedSlide[] {
  return markdown
    .split(/^\s*---\s*$/m)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk, i, all) => {
      let title = "";
      let type: SlideType | null = null;
      let inCode = false;
      const bullets: string[] = [];
      const body: string[] = [];
      const code: string[] = [];
      for (const raw of chunk.split("\n")) {
        const line = raw.trim();
        // Blok kode/rumus: diapit baris ``` indentasi asli dipertahankan.
        if (line.startsWith("```")) {
          inCode = !inCode;
          continue;
        }
        if (inCode) {
          const kept = raw.replace(/\s+$/, "");
          if (kept) code.push(kept);
          continue;
        }
        if (!line) continue;
        const typeMatch = line.match(/^\[\s*tipe\s*:\s*([a-z-]+)\s*\]$/i);
        if (typeMatch) {
          const t = typeMatch[1].toLowerCase();
          if ((SLIDE_TYPES as readonly string[]).includes(t)) type = t as SlideType;
          continue;
        }
        if (line.startsWith(">")) {
          // Format lama ("> Catatan: …") diabaikan agar tak bocor jadi isi slide.
          continue;
        } else if (!title && line.startsWith("#")) {
          title = line.replace(/^#+\s*/, "");
        } else if (line.startsWith("- ") || line.startsWith("* ")) {
          bullets.push(line.slice(2).trim());
        } else if (!title) {
          title = line;
        } else {
          body.push(line);
        }
      }
      // Tebak tipe bila AI/guru tidak menuliskannya.
      const fallback: SlideType =
        i === 0 ? "pembuka" : i === all.length - 1 && all.length > 2 ? "penutup" : "poin";
      return {
        type: type ?? fallback,
        title: title || "(tanpa judul)",
        bullets,
        body,
        code,
      };
    });
}

/* ============================== DESAIN ============================== */

/**
 * Font yang hampir pasti terpasang di Windows/Office PPTX tidak bisa
 * menyematkan font, jadi AI hanya boleh memilih dari daftar ini.
 */
export const SAFE_FONTS = [
  "Calibri",
  "Cambria",
  "Candara",
  "Corbel",
  "Constantia",
  "Segoe UI",
  "Arial",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Georgia",
  "Garamond",
  "Book Antiqua",
  "Palatino Linotype",
  "Century Gothic",
  "Franklin Gothic Medium",
  "Times New Roman",
  "Comic Sans MS",
] as const;

export const DECOR_STYLES = ["lingkaran", "gelembung", "garis", "kotak", "titik", "polos"] as const;
export const BULLET_STYLES = ["bulat", "strip", "panah", "angka"] as const;
export const COVER_STYLES = ["penuh", "panel", "belah"] as const;

export type DesignSpec = {
  /** Nama desain yang ditampilkan ke guru, cth. "Samudra Ceria". */
  name: string;
  /** Deskripsi singkat suasana desain. */
  vibe: string;
  colors: {
    background: string; // latar slide
    surface: string; // panel/kartu di atas latar
    title: string; // warna judul
    text: string; // warna teks isi
    accent: string; // aksen utama (bar judul, angka besar)
    accent2: string; // aksen kedua (dekorasi)
  };
  headingFont: string;
  bodyFont: string;
  decor: (typeof DECOR_STYLES)[number];
  bulletStyle: (typeof BULLET_STYLES)[number];
  titleUpper: boolean;
  coverStyle: (typeof COVER_STYLES)[number];
};

/* ----- utilitas warna & kontras (WCAG) ----- */

/** Normalisasi ke "RRGGBB" (tanpa '#', huruf besar); null bila bukan hex valid. */
export function normalizeHex(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const m = input.trim().replace(/^#/, "").toUpperCase();
  if (/^[0-9A-F]{6}$/.test(m)) return m;
  if (/^[0-9A-F]{3}$/.test(m)) return m.split("").map((c) => c + c).join("");
  return null;
}

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** Luminansi relatif 0..1 dari hex "RRGGBB". */
export function luminance(hex: string): number {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Rasio kontras WCAG (1..21) antara dua warna hex "RRGGBB". */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Penjaga keterbacaan: bila kontras `fg` terhadap `bg` di bawah ambang,
 * ganti dengan gelap/terang netral yang paling kontras. AI boleh kreatif,
 * tapi teks tidak boleh hilang.
 */
export function ensureReadable(fg: string, bg: string, min = 4.5): string {
  if (contrastRatio(fg, bg) >= min) return fg;
  return contrastRatio("1F2933", bg) >= contrastRatio("FFFFFF", bg) ? "1F2933" : "FFFFFF";
}

function pick<T extends readonly string[]>(list: T, value: unknown, fallback: T[number]): T[number] {
  return typeof value === "string" && (list as readonly string[]).includes(value)
    ? (value as T[number])
    : fallback;
}

function pickFont(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const found = SAFE_FONTS.find((f) => f.toLowerCase() === value.trim().toLowerCase());
  return found ?? fallback;
}

/**
 * Bersihkan & amankan satu cetak biru desain hasil AI:
 * warna wajib hex valid, font wajib dari daftar aman, dan kontras
 * teks/judul terhadap latarnya dikoreksi otomatis.
 */
export function sanitizeDesign(raw: unknown): DesignSpec | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const c = (r.colors ?? {}) as Record<string, unknown>;

  const background = normalizeHex(c.background) ?? "FFFFFF";
  const surface = normalizeHex(c.surface) ?? background;
  const accent = normalizeHex(c.accent) ?? "0F766E";
  const accent2 = normalizeHex(c.accent2) ?? accent;
  let title = normalizeHex(c.title) ?? "1F2933";
  let text = normalizeHex(c.text) ?? "1F2933";

  // Judul boleh sedikit lebih longgar (ukurannya besar), isi harus 4.5:1.
  title = ensureReadable(title, background, 3);
  text = ensureReadable(text, background, 4.5);
  // Teks juga harus terbaca di atas panel (dipakai layout contoh/dua-kolom).
  if (contrastRatio(text, surface) < 4.5) text = ensureReadable(text, surface, 4.5);

  const name = typeof r.name === "string" && r.name.trim() ? r.name.trim().slice(0, 60) : "Desain AI";
  const vibe = typeof r.vibe === "string" ? r.vibe.trim().slice(0, 120) : "";

  return {
    name,
    vibe,
    colors: { background, surface, title, text, accent, accent2 },
    headingFont: pickFont(r.headingFont, "Georgia"),
    bodyFont: pickFont(r.bodyFont, "Calibri"),
    decor: pick(DECOR_STYLES, r.decor, "lingkaran"),
    bulletStyle: pick(BULLET_STYLES, r.bulletStyle, "bulat"),
    titleUpper: r.titleUpper === true,
    coverStyle: pick(COVER_STYLES, r.coverStyle, "panel"),
  };
}

/** Desain bawaan dipakai saat mode demo (tanpa kunci AI) atau AI gagal. */
export const FALLBACK_DESIGNS: DesignSpec[] = [
  {
    name: "Scholarly Calm",
    vibe: "Tenang dan rapi, khas EduTenang",
    colors: {
      background: "FAF6EF",
      surface: "FFFFFF",
      title: "134E4A",
      text: "1F2933",
      accent: "0F766E",
      accent2: "E8A44C",
    },
    headingFont: "Georgia",
    bodyFont: "Calibri",
    decor: "lingkaran",
    bulletStyle: "bulat",
    titleUpper: false,
    coverStyle: "panel",
  },
  {
    name: "Papan Kapur",
    vibe: "Gelap klasik seperti papan tulis",
    colors: {
      background: "1E2A28",
      surface: "273633",
      title: "F5E9CF",
      text: "E8E3D6",
      accent: "F2B33D",
      accent2: "7FC8B9",
    },
    headingFont: "Book Antiqua",
    bodyFont: "Segoe UI",
    decor: "garis",
    bulletStyle: "strip",
    titleUpper: true,
    coverStyle: "penuh",
  },
  {
    name: "Ceria Pagi",
    vibe: "Cerah dan ramah untuk kelas muda",
    colors: {
      background: "FFF8F0",
      surface: "FFFFFF",
      title: "B4451F",
      text: "3D3A34",
      accent: "E86A33",
      accent2: "41B3A3",
    },
    headingFont: "Century Gothic",
    bodyFont: "Corbel",
    decor: "gelembung",
    bulletStyle: "panah",
    titleUpper: false,
    coverStyle: "belah",
  },
];
