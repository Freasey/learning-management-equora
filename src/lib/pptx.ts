import PptxGenJS from "pptxgenjs";
import {
  ensureReadable,
  parseSlides,
  type DesignSpec,
  type ParsedSlide,
} from "@/lib/slides";

/**
 * Mesin PPTX parametrik: merakit berkas PowerPoint asli dari teks slide +
 * cetak biru desain (buatan AI). Semua penataan dilakukan kode ini
 * AI hanya memasok data, tidak pernah kode sehingga hasil selalu
 * konsisten, aman, dan bisa dibuka di PowerPoint/Google Slides.
 *
 * Kanvas: LAYOUT_WIDE = 13.33 × 7.5 inci (16:9).
 */

const PAGE_W = 13.33;
const PAGE_H = 7.5;
const MARGIN = 0.7;

export type PptxMeta = {
  title: string;
  subject?: string;
  teacher?: string;
  school?: string;
  dateLabel?: string;
};

type Ctx = {
  pptx: PptxGenJS;
  d: DesignSpec;
  meta: PptxMeta;
};

/** Rakit PPTX dan kembalikan sebagai base64 (untuk diunduh dari browser). */
export async function buildPptx(
  markdown: string,
  design: DesignSpec,
  meta: PptxMeta,
): Promise<{ base64: string; slideCount: number }> {
  const slides = parseSlides(markdown);
  if (slides.length === 0) throw new Error("Tidak ada slide untuk diekspor.");

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = meta.title;
  if (meta.teacher) pptx.author = meta.teacher;
  if (meta.school) pptx.company = meta.school;

  const ctx: Ctx = { pptx, d: design, meta };
  let chapter = 0;
  slides.forEach((s, i) => {
    if (s.type === "bab") chapter += 1;
    addSlide(ctx, s, i, slides.length, chapter);
  });

  const base64 = (await pptx.write({ outputType: "base64" })) as string;
  return { base64, slideCount: slides.length };
}

/* ============================ util gaya ============================ */

/** Penanda butir sesuai gaya desain (kode karakter unicode hex). */
function bulletOf(d: DesignSpec): object {
  switch (d.bulletStyle) {
    case "strip":
      return { bullet: { code: "2013" }, indentLevel: 0 };
    case "panah":
      return { bullet: { code: "25B8" } };
    case "angka":
      return { bullet: { type: "number" } };
    default:
      return { bullet: { code: "2022" } };
  }
}

function titleText(d: DesignSpec, t: string): string {
  return d.titleUpper ? t.toUpperCase() : t;
}

/** Warna teks yang pasti terbaca di atas warna `bg`. */
function on(bg: string, preferred: string, min = 4.5): string {
  return ensureReadable(preferred, bg, min);
}

/* ============================ dekorasi ============================= */

/**
 * Hiasan latar per slide. Posisi memakai tabel tetap yang digilir menurut
 * indeks slide deterministik (hasil sama setiap ekspor) tapi tiap slide
 * terasa berbeda.
 */
function addDecor(ctx: Ctx, slide: PptxGenJS.Slide, i: number) {
  const { pptx, d } = ctx;
  const a = d.colors.accent;
  const b = d.colors.accent2;
  // Dekorasi harus samar: transparansi tinggi supaya tak mengganggu teks.
  const soft = (color: string, extra = 0) => ({
    fill: { color, transparency: 82 + extra },
    line: { type: "none" as const },
  });

  if (d.decor === "polos") return;

  if (d.decor === "lingkaran") {
    const spots = [
      [{ x: -1.6, y: -1.8, s: 4.2, c: a }, { x: 11.6, y: 5.2, s: 3.6, c: b }],
      [{ x: 11.2, y: -2.0, s: 4.0, c: b }, { x: -1.2, y: 5.4, s: 3.2, c: a }],
      [{ x: 10.8, y: 4.6, s: 4.4, c: a }, { x: -1.8, y: -1.2, s: 3.0, c: b }],
    ][i % 3];
    for (const s of spots) {
      slide.addShape(pptx.ShapeType.ellipse, { x: s.x, y: s.y, w: s.s, h: s.s, ...soft(s.c) });
    }
  } else if (d.decor === "gelembung") {
    const sets = [
      [{ x: 11.9, y: 0.5, s: 0.9 }, { x: 12.5, y: 1.7, s: 0.5 }, { x: 11.3, y: 6.3, s: 0.7 }, { x: 0.4, y: 6.6, s: 0.45 }],
      [{ x: 0.4, y: 0.5, s: 0.8 }, { x: 1.3, y: 1.3, s: 0.4 }, { x: 12.2, y: 5.9, s: 0.9 }, { x: 11.5, y: 6.9, s: 0.4 }],
      [{ x: 12.3, y: 3.4, s: 0.6 }, { x: 0.5, y: 2.9, s: 0.5 }, { x: 1.0, y: 6.4, s: 0.8 }, { x: 12.0, y: 0.6, s: 0.5 }],
    ][i % 3];
    sets.forEach((s, j) => {
      slide.addShape(pptx.ShapeType.ellipse, {
        x: s.x, y: s.y, w: s.s, h: s.s, ...soft(j % 2 ? b : a, -12),
      });
    });
  } else if (d.decor === "garis") {
    const ys = [[0.55, 7.1], [0.4, 6.9], [0.7, 7.2]][i % 3];
    for (const [j, y] of ys.entries()) {
      slide.addShape(pptx.ShapeType.rect, {
        x: j ? 6.8 : 0.7, y, w: j ? 5.8 : 4.2, h: 0.045,
        fill: { color: j % 2 ? b : a, transparency: 45 }, line: { type: "none" },
      });
    }
  } else if (d.decor === "kotak") {
    const sets = [
      [{ x: 12.1, y: -0.7, s: 1.9, r: 18, c: a }, { x: -0.8, y: 6.3, s: 1.7, r: 32, c: b }],
      [{ x: -0.9, y: -0.8, s: 2.0, r: 24, c: b }, { x: 12.3, y: 6.1, s: 1.6, r: 12, c: a }],
      [{ x: 12.0, y: 5.7, s: 2.1, r: 40, c: b }, { x: -0.6, y: -0.5, s: 1.5, r: 20, c: a }],
    ][i % 3];
    for (const s of sets) {
      slide.addShape(pptx.ShapeType.rect, {
        x: s.x, y: s.y, w: s.s, h: s.s, rotate: s.r, ...soft(s.c, -6),
      });
    }
  } else if (d.decor === "titik") {
    const origin = [{ x: 11.4, y: 0.5 }, { x: 0.5, y: 5.6 }, { x: 11.4, y: 5.6 }][i % 3];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 5; c++) {
        slide.addShape(pptx.ShapeType.ellipse, {
          x: origin.x + c * 0.32, y: origin.y + r * 0.32, w: 0.09, h: 0.09,
          fill: { color: (r + c) % 2 ? b : a, transparency: 55 }, line: { type: "none" },
        });
      }
    }
  }
}

/** Footer kecil: sekolah • guru (kiri) dan nomor halaman (kanan). */
function addFooter(ctx: Ctx, slide: PptxGenJS.Slide, i: number, total: number, bg: string) {
  const { d, meta } = ctx;
  const color = on(bg, d.colors.text, 2.4);
  const left = [meta.school, meta.teacher].filter(Boolean).join("  •  ");
  if (left) {
    slide.addText(left, {
      x: MARGIN, y: PAGE_H - 0.42, w: 8, h: 0.3,
      fontFace: d.bodyFont, fontSize: 8.5, color, align: "left", valign: "middle",
    });
  }
  slide.addText(`${i + 1} / ${total}`, {
    x: PAGE_W - 1.6, y: PAGE_H - 0.42, w: 0.9, h: 0.3,
    fontFace: d.bodyFont, fontSize: 8.5, color, align: "right", valign: "middle",
  });
}

/* ============================ tiap layout =========================== */

function addSlide(ctx: Ctx, s: ParsedSlide, i: number, total: number, chapter: number) {
  const { pptx } = ctx;
  const slide = pptx.addSlide();
  // Hanya layout poin & contoh yang punya tempat panel kode/rumus tipe lain
  // yang membawa blok kode dialihkan ke layout poin agar isinya tidak hilang.
  const type =
    s.code.length > 0 && !["poin", "contoh", "pembuka", "bab", "penutup"].includes(s.type)
      ? "poin"
      : s.type;
  switch (type) {
    case "pembuka":
      layoutCover(ctx, slide, s, i);
      break;
    case "bab":
      layoutChapter(ctx, slide, s, i, chapter);
      break;
    case "dua-kolom":
      layoutTwoColumns(ctx, slide, s, i, total);
      break;
    case "kutipan":
      layoutQuote(ctx, slide, s, i, total);
      break;
    case "angka":
      layoutBigNumber(ctx, slide, s, i, total);
      break;
    case "contoh":
      layoutExample(ctx, slide, s, i, total);
      break;
    case "diskusi":
      layoutDiscussion(ctx, slide, s, i, total);
      break;
    case "penutup":
      layoutClosing(ctx, slide, s, i);
      break;
    default:
      layoutPoints(ctx, slide, s, i, total);
  }
}

/** Slide pembuka tiga gaya sampul sesuai cetak biru. */
function layoutCover(ctx: Ctx, slide: PptxGenJS.Slide, s: ParsedSlide, i: number) {
  const { pptx, d, meta } = ctx;
  const subtitle = [...s.body, ...s.bullets].join("  •  ");
  const metaLine = [meta.subject, meta.teacher, meta.school, meta.dateLabel]
    .filter(Boolean)
    .join("   |   ");

  if (d.coverStyle === "penuh") {
    // Sampul latar penuh warna aksen.
    slide.background = { color: d.colors.accent };
    addDecor(ctx, slide, i);
    const fg = on(d.colors.accent, d.colors.title, 3);
    slide.addText(titleText(d, s.title), {
      x: MARGIN, y: 2.2, w: PAGE_W - MARGIN * 2, h: 1.9,
      fontFace: d.headingFont, fontSize: 44, bold: true, color: fg,
      align: "center", valign: "middle", fit: "shrink",
    });
    if (subtitle) {
      slide.addText(subtitle, {
        x: 1.8, y: 4.15, w: PAGE_W - 3.6, h: 0.8,
        fontFace: d.bodyFont, fontSize: 16, color: on(d.colors.accent, d.colors.text),
        align: "center", valign: "top", fit: "shrink",
      });
    }
    if (metaLine) {
      slide.addText(metaLine, {
        x: 1.2, y: 6.4, w: PAGE_W - 2.4, h: 0.4,
        fontFace: d.bodyFont, fontSize: 11, color: on(d.colors.accent, d.colors.text, 3),
        align: "center",
      });
    }
    return;
  }

  slide.background = { color: d.colors.background };
  addDecor(ctx, slide, i);

  if (d.coverStyle === "belah") {
    // Sampul belah: blok aksen di kiri, judul di kanan.
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 4.6, h: PAGE_H, fill: { color: d.colors.accent }, line: { type: "none" },
    });
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 3.6, y: 2.55, w: 2.0, h: 2.0, fill: { color: d.colors.accent2 }, line: { type: "none" },
    });
    slide.addText(titleText(d, s.title), {
      x: 5.4, y: 2.0, w: PAGE_W - 5.4 - MARGIN, h: 2.1,
      fontFace: d.headingFont, fontSize: 38, bold: true, color: d.colors.title,
      align: "left", valign: "middle", fit: "shrink",
    });
    if (subtitle) {
      slide.addText(subtitle, {
        x: 5.4, y: 4.2, w: PAGE_W - 5.4 - MARGIN, h: 0.9,
        fontFace: d.bodyFont, fontSize: 15, color: d.colors.text, fit: "shrink",
      });
    }
    if (metaLine) {
      slide.addText(metaLine, {
        x: 5.4, y: 6.5, w: PAGE_W - 5.4 - MARGIN, h: 0.4,
        fontFace: d.bodyFont, fontSize: 11, color: d.colors.text,
      });
    }
    return;
  }

  // "panel": kartu besar di tengah dengan garis aksen.
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 1.5, y: 1.55, w: PAGE_W - 3, h: 4.4, rectRadius: 0.12,
    fill: { color: d.colors.surface }, line: { color: d.colors.accent2, width: 1 },
    shadow: { type: "outer", blur: 8, offset: 2, angle: 90, color: "000000", opacity: 0.18 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: (PAGE_W - 1.6) / 2, y: 2.25, w: 1.6, h: 0.09,
    fill: { color: d.colors.accent }, line: { type: "none" },
  });
  slide.addText(titleText(d, s.title), {
    x: 2.1, y: 2.6, w: PAGE_W - 4.2, h: 1.7,
    fontFace: d.headingFont, fontSize: 38, bold: true,
    color: on(d.colors.surface, d.colors.title, 3),
    align: "center", valign: "middle", fit: "shrink",
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 2.4, y: 4.35, w: PAGE_W - 4.8, h: 0.9,
      fontFace: d.bodyFont, fontSize: 15, color: on(d.colors.surface, d.colors.text),
      align: "center", fit: "shrink",
    });
  }
  if (metaLine) {
    slide.addText(metaLine, {
      x: 1.2, y: 6.45, w: PAGE_W - 2.4, h: 0.4,
      fontFace: d.bodyFont, fontSize: 11, color: d.colors.text, align: "center",
    });
  }
}

/** Pemisah bab: nomor raksasa + judul bab. */
function layoutChapter(ctx: Ctx, slide: PptxGenJS.Slide, s: ParsedSlide, i: number, chapter: number) {
  const { pptx, d } = ctx;
  slide.background = { color: d.colors.background };
  addDecor(ctx, slide, i);
  slide.addText(String(chapter).padStart(2, "0"), {
    x: MARGIN, y: 1.7, w: 4.2, h: 3.4,
    fontFace: d.headingFont, fontSize: 150, bold: true,
    color: d.colors.accent, align: "left", valign: "middle",
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 5.2, y: 2.4, w: 0.09, h: 2.1, fill: { color: d.colors.accent2 }, line: { type: "none" },
  });
  slide.addText(titleText(d, s.title), {
    x: 5.7, y: 2.3, w: PAGE_W - 5.7 - MARGIN, h: 2.3,
    fontFace: d.headingFont, fontSize: 34, bold: true, color: d.colors.title,
    valign: "middle", fit: "shrink",
  });
  const sub = [...s.body, ...s.bullets].join("  •  ");
  if (sub) {
    slide.addText(sub, {
      x: 5.7, y: 4.7, w: PAGE_W - 5.7 - MARGIN, h: 0.9,
      fontFace: d.bodyFont, fontSize: 14, color: d.colors.text, fit: "shrink",
    });
  }
}

/** Judul standar di kiri-atas dengan bar aksen dipakai beberapa layout. */
function addHeader(ctx: Ctx, slide: PptxGenJS.Slide, title: string) {
  const { pptx, d } = ctx;
  slide.addShape(pptx.ShapeType.rect, {
    x: MARGIN, y: 0.78, w: 0.14, h: 0.72, fill: { color: d.colors.accent }, line: { type: "none" },
  });
  slide.addText(titleText(d, title), {
    x: MARGIN + 0.34, y: 0.62, w: PAGE_W - MARGIN * 2 - 0.34, h: 1.05,
    fontFace: d.headingFont, fontSize: 27, bold: true, color: d.colors.title,
    valign: "middle", fit: "shrink",
  });
}

/**
 * Panel khusus kode program / rumus matematis: kartu tersendiri berhuruf
 * monospace, terpisah dari teks penjelasan.
 */
function addCodePanel(
  ctx: Ctx,
  slide: PptxGenJS.Slide,
  code: string[],
  box: { x: number; y: number; w: number; h: number },
  fill?: string,
) {
  const { pptx, d } = ctx;
  const panelFill = fill ?? d.colors.surface;
  slide.addShape(pptx.ShapeType.roundRect, {
    ...box, rectRadius: 0.08,
    fill: { color: panelFill }, line: { color: d.colors.accent2, width: 1 },
  });
  slide.addText("KODE / RUMUS", {
    x: box.x + 0.25, y: box.y + 0.12, w: box.w - 0.5, h: 0.3,
    fontFace: d.bodyFont, fontSize: 9, bold: true, charSpacing: 2,
    color: on(panelFill, d.colors.accent, 3), align: "left", valign: "middle",
  });
  slide.addText(
    code.map((line) => ({
      text: line,
      options: { breakLine: true } as PptxGenJS.TextPropsOptions,
    })),
    {
      x: box.x + 0.25, y: box.y + 0.5, w: box.w - 0.5, h: box.h - 0.65,
      fontFace: "Consolas", fontSize: 13, color: on(panelFill, d.colors.text),
      align: "left", valign: "top", fit: "shrink", lineSpacingMultiple: 1.15,
    },
  );
}

/** Slide poin biasa: judul + paragraf + butir; blok kode/rumus dapat kolom sendiri. */
function layoutPoints(ctx: Ctx, slide: PptxGenJS.Slide, s: ParsedSlide, i: number, total: number) {
  const { d } = ctx;
  slide.background = { color: d.colors.background };
  addDecor(ctx, slide, i);
  addHeader(ctx, slide, s.title);

  const rows: PptxGenJS.TextProps[] = [];
  for (const p of s.body) {
    rows.push({ text: p, options: { fontSize: 15, breakLine: true, paraSpaceAfter: 8 } });
  }
  for (const b of s.bullets) {
    rows.push({
      text: b,
      options: { fontSize: 16, breakLine: true, paraSpaceAfter: 10, ...bulletOf(d) },
    });
  }

  const hasCode = s.code.length > 0;
  if (rows.length && hasCode) {
    // Dua kolom: penjelasan kiri, panel kode/rumus kanan tidak bercampur.
    slide.addText(rows, {
      x: MARGIN + 0.1, y: 2.0, w: 5.9, h: 4.7,
      fontFace: d.bodyFont, color: d.colors.text, valign: "top", fit: "shrink",
      lineSpacingMultiple: 1.12,
    });
    addCodePanel(ctx, slide, s.code, { x: 7.0, y: 2.05, w: PAGE_W - 7.0 - MARGIN, h: 4.4 });
  } else if (hasCode) {
    addCodePanel(ctx, slide, s.code, {
      x: MARGIN + 1.2, y: 2.15, w: PAGE_W - MARGIN * 2 - 2.4, h: 4.2,
    });
  } else if (rows.length) {
    slide.addText(rows, {
      x: MARGIN + 0.1, y: 2.0, w: PAGE_W - MARGIN * 2 - 0.2, h: 4.7,
      fontFace: d.bodyFont, color: d.colors.text, valign: "top", fit: "shrink",
      lineSpacingMultiple: 1.12,
    });
  }
  addFooter(ctx, slide, i, total, d.colors.background);
}

/** Dua kolom: butir dibagi rata ke dua kartu. */
function layoutTwoColumns(ctx: Ctx, slide: PptxGenJS.Slide, s: ParsedSlide, i: number, total: number) {
  const { pptx, d } = ctx;
  slide.background = { color: d.colors.background };
  addDecor(ctx, slide, i);
  addHeader(ctx, slide, s.title);

  const items = [...s.body, ...s.bullets];
  const half = Math.ceil(items.length / 2);
  const cols = [items.slice(0, half), items.slice(half)];
  const colW = (PAGE_W - MARGIN * 2 - 0.5) / 2;
  const textOn = on(d.colors.surface, d.colors.text);

  cols.forEach((col, c) => {
    if (col.length === 0) return;
    const x = MARGIN + c * (colW + 0.5);
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y: 2.0, w: colW, h: 4.55, rectRadius: 0.1,
      fill: { color: d.colors.surface }, line: { color: c ? d.colors.accent2 : d.colors.accent, width: 1.25 },
    });
    slide.addText(
      col.map((t) => ({
        text: t,
        options: { fontSize: 14.5, breakLine: true, paraSpaceAfter: 9, ...bulletOf(d) },
      })),
      {
        x: x + 0.3, y: 2.3, w: colW - 0.6, h: 3.95,
        fontFace: d.bodyFont, color: textOn, valign: "top", fit: "shrink",
        lineSpacingMultiple: 1.1,
      },
    );
  });
  addFooter(ctx, slide, i, total, d.colors.background);
}

/** Kutipan/definisi besar di tengah. */
function layoutQuote(ctx: Ctx, slide: PptxGenJS.Slide, s: ParsedSlide, i: number, total: number) {
  const { d } = ctx;
  slide.background = { color: d.colors.background };
  addDecor(ctx, slide, i);

  const items = [...s.body, ...s.bullets];
  const quote = items[0] ?? s.title;
  // Bila isi ada, judul slide + sisa butir jadi keterangan di bawah kutipan.
  const attribution = items[0] ? [s.title, ...items.slice(1)].filter(Boolean).join(" · ") : "";
  slide.addText("“", {
    x: MARGIN + 0.2, y: 0.65, w: 2, h: 1.8,
    fontFace: d.headingFont, fontSize: 120, bold: true, color: d.colors.accent,
  });
  slide.addText(quote, {
    x: 1.7, y: 2.15, w: PAGE_W - 3.4, h: 2.6,
    fontFace: d.headingFont, fontSize: 26, italic: true, color: d.colors.title,
    align: "center", valign: "middle", fit: "shrink", lineSpacingMultiple: 1.2,
  });
  if (attribution) {
    slide.addText(`${attribution}`, {
      x: 2.6, y: 5.0, w: PAGE_W - 5.2, h: 0.6,
      fontFace: d.bodyFont, fontSize: 13, color: d.colors.text, align: "center", fit: "shrink",
    });
  }
  addFooter(ctx, slide, i, total, d.colors.background);
}

/** Angka/fakta besar: butir pertama jadi statistik raksasa. */
function layoutBigNumber(ctx: Ctx, slide: PptxGenJS.Slide, s: ParsedSlide, i: number, total: number) {
  const { d } = ctx;
  slide.background = { color: d.colors.background };
  addDecor(ctx, slide, i);
  addHeader(ctx, slide, s.title);

  const [stat, ...rest] = [...s.bullets, ...s.body];
  slide.addText(stat ?? "", {
    x: MARGIN, y: 2.1, w: 6.4, h: 3.4,
    fontFace: d.headingFont, fontSize: 88, bold: true, color: d.colors.accent,
    align: "left", valign: "middle", fit: "shrink",
  });
  if (rest.length) {
    slide.addText(
      rest.map((t) => ({ text: t, options: { fontSize: 15, breakLine: true, paraSpaceAfter: 9 } })),
      {
        x: 7.3, y: 2.3, w: PAGE_W - 7.3 - MARGIN, h: 3.4,
        fontFace: d.bodyFont, color: d.colors.text, valign: "middle", fit: "shrink",
        lineSpacingMultiple: 1.15,
      },
    );
  }
  addFooter(ctx, slide, i, total, d.colors.background);
}

/** Contoh soal: kartu besar berlabel. */
function layoutExample(ctx: Ctx, slide: PptxGenJS.Slide, s: ParsedSlide, i: number, total: number) {
  const { pptx, d } = ctx;
  slide.background = { color: d.colors.background };
  addDecor(ctx, slide, i);
  addHeader(ctx, slide, s.title);

  slide.addShape(pptx.ShapeType.roundRect, {
    x: MARGIN, y: 2.0, w: PAGE_W - MARGIN * 2, h: 4.55, rectRadius: 0.1,
    fill: { color: d.colors.surface }, line: { color: d.colors.accent, width: 1.25 },
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: MARGIN + 0.3, y: 1.78, w: 1.85, h: 0.44, rectRadius: 0.22,
    fill: { color: d.colors.accent }, line: { type: "none" },
  });
  slide.addText("CONTOH SOAL", {
    x: MARGIN + 0.3, y: 1.78, w: 1.85, h: 0.44,
    fontFace: d.bodyFont, fontSize: 10.5, bold: true, charSpacing: 2,
    color: on(d.colors.accent, "FFFFFF", 3), align: "center", valign: "middle",
  });
  const rows: PptxGenJS.TextProps[] = [
    ...s.body.map((t) => ({
      text: t,
      options: { fontSize: 15, breakLine: true, paraSpaceAfter: 9 } as PptxGenJS.TextPropsOptions,
    })),
    ...s.bullets.map((t) => ({
      text: t,
      options: { fontSize: 15, breakLine: true, paraSpaceAfter: 9, ...bulletOf(d) } as PptxGenJS.TextPropsOptions,
    })),
  ];
  const hasCode = s.code.length > 0;
  // Ada kode/rumus → soal di kiri, panel kode di kanan (warna latar slide agar
  // kontras dengan kartu); tanpa kode → teks memakai seluruh lebar kartu.
  const textW = hasCode ? 5.6 : PAGE_W - MARGIN * 2 - 0.8;
  if (rows.length) {
    slide.addText(rows, {
      x: MARGIN + 0.4, y: 2.5, w: textW, h: 3.8,
      fontFace: d.bodyFont, color: on(d.colors.surface, d.colors.text),
      valign: "top", fit: "shrink", lineSpacingMultiple: 1.12,
    });
  }
  if (hasCode) {
    addCodePanel(
      ctx,
      slide,
      s.code,
      { x: MARGIN + textW + 0.7, y: 2.45, w: PAGE_W - MARGIN * 2 - textW - 1.1, h: 3.85 },
      d.colors.background,
    );
  }
  addFooter(ctx, slide, i, total, d.colors.background);
}

/** Diskusi: tanda tanya besar + pertanyaan pemantik. */
function layoutDiscussion(ctx: Ctx, slide: PptxGenJS.Slide, s: ParsedSlide, i: number, total: number) {
  const { d } = ctx;
  slide.background = { color: d.colors.background };
  addDecor(ctx, slide, i);
  addHeader(ctx, slide, s.title);

  slide.addText("?", {
    x: 9.3, y: 1.9, w: 3.4, h: 4.6,
    fontFace: d.headingFont, fontSize: 220, bold: true, color: d.colors.accent2,
    align: "center", valign: "middle", transparency: 55,
  });
  const items = [...s.body, ...s.bullets];
  slide.addText(
    items.map((t) => ({
      text: t,
      options: { fontSize: 17, breakLine: true, paraSpaceAfter: 14, ...bulletOf(d) },
    })),
    {
      x: MARGIN + 0.1, y: 2.1, w: 8.3, h: 4.4,
      fontFace: d.bodyFont, color: d.colors.text, valign: "top", fit: "shrink",
      lineSpacingMultiple: 1.2,
    },
  );
  addFooter(ctx, slide, i, total, d.colors.background);
}

/** Penutup: pesan tengah + ringkasan kecil. */
function layoutClosing(ctx: Ctx, slide: PptxGenJS.Slide, s: ParsedSlide, i: number) {
  const { pptx, d, meta } = ctx;
  slide.background = { color: d.colors.background };
  addDecor(ctx, slide, i);

  slide.addShape(pptx.ShapeType.rect, {
    x: (PAGE_W - 1.6) / 2, y: 2.15, w: 1.6, h: 0.09,
    fill: { color: d.colors.accent }, line: { type: "none" },
  });
  slide.addText(titleText(d, s.title), {
    x: 1.5, y: 2.5, w: PAGE_W - 3, h: 1.5,
    fontFace: d.headingFont, fontSize: 36, bold: true, color: d.colors.title,
    align: "center", valign: "middle", fit: "shrink",
  });
  const items = [...s.body, ...s.bullets];
  if (items.length) {
    slide.addText(items.join("   •   "), {
      x: 1.8, y: 4.15, w: PAGE_W - 3.6, h: 1.2,
      fontFace: d.bodyFont, fontSize: 14, color: d.colors.text,
      align: "center", fit: "shrink", lineSpacingMultiple: 1.25,
    });
  }
  const metaLine = [meta.teacher, meta.school].filter(Boolean).join("  •  ");
  if (metaLine) {
    slide.addText(metaLine, {
      x: 1.8, y: 6.4, w: PAGE_W - 3.6, h: 0.4,
      fontFace: d.bodyFont, fontSize: 11, color: d.colors.text, align: "center",
    });
  }
}
