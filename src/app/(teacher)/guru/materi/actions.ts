"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, withTenant, materials, subjects, schools, users } from "@/db";
import { requireTeacher } from "@/lib/auth-guard";
import mammoth from "mammoth";
import {
  assertAiQuota,
  generateFromParts,
  isAiConfigured,
  recordAiUsage,
  type GeminiPart,
} from "@/lib/ai";
import {
  BULLET_STYLES,
  COVER_STYLES,
  DECOR_STYLES,
  FALLBACK_DESIGNS,
  SAFE_FONTS,
  SLIDE_TYPES,
  sanitizeDesign,
  type DesignSpec,
} from "@/lib/slides";
import { buildPptx } from "@/lib/pptx";
import { uploadFile, deleteFile, isStorageConfigured } from "@/lib/storage";

export type MaterialState = { error?: string; ok?: boolean } | undefined;

/**
 * Simpan materi (buat baru atau ubah) lewat satu alur terpadu.
 * `source` menentukan asal isi materi:
 *   - "tulis"  → catatan diketik guru (tipe `manual`, atau `ai` bila dibantu AI)
 *   - "berkas" → unggah berkas ke penyimpanan (tipe `file`)
 *   - "tautan" → tautan eksternal (tipe `link`)
 */
const saveSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  source: z.enum(["tulis", "berkas", "tautan"]),
  title: z.string().trim().min(2, "Judul minimal 2 karakter"),
  subjectId: z.string().uuid("Pilih mapel"),
  classId: z.string().uuid().optional().or(z.literal("")),
  topic: z.string().optional().or(z.literal("")),
  content: z.string().optional().or(z.literal("")),
  url: z.string().optional().or(z.literal("")),
  aiAssisted: z.string().optional(),
});

/**
 * Kolom yang tidak dirender form (mis. `id` saat tambah baru, `url` di mode
 * tulis) tiba sebagai null — samakan jadi "" agar tidak ditolak validasi.
 */
function fieldStr(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v : "";
}

export async function saveMaterial(
  _state: MaterialState,
  formData: FormData,
): Promise<MaterialState> {
  const { schoolId, teacherId } = await requireTeacher();
  const parsed = saveSchema.safeParse({
    id: fieldStr(formData.get("id")),
    source: fieldStr(formData.get("source")),
    title: fieldStr(formData.get("title")),
    subjectId: fieldStr(formData.get("subjectId")),
    classId: fieldStr(formData.get("classId")),
    topic: fieldStr(formData.get("topic")),
    content: fieldStr(formData.get("content")),
    url: fieldStr(formData.get("url")),
    aiAssisted: fieldStr(formData.get("aiAssisted")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const d = parsed.data;
  const id = d.id || null;

  // Materi lama (untuk ubah) — dipakai memvalidasi kepemilikan & mengelola berkas.
  const existing = id
    ? await withTenant(schoolId, async () => {
        const [row] = await db
          .select({ type: materials.type, url: materials.url })
          .from(materials)
          .where(and(eq(materials.id, id), eq(materials.schoolId, schoolId)))
          .limit(1);
        return row;
      })
    : null;
  if (id && !existing) return { error: "Materi tidak ditemukan." };

  // Tentukan tipe + isi menurut sumber.
  let type: "manual" | "ai" | "link" | "file";
  let url: string | null = null;
  let fileToRemove: string | null = null;

  if (d.source === "tautan") {
    const link = (d.url ?? "").trim();
    if (!link) return { error: "Isi URL tautan materi." };
    type = "link";
    url = link;
    if (existing?.type === "file") fileToRemove = existing.url;
  } else if (d.source === "berkas") {
    const file = formData.get("file");
    const hasNewFile = file instanceof File && file.size > 0;
    if (hasNewFile) {
      if (!isStorageConfigured()) {
        return { error: "Unggah berkas nonaktif — penyimpanan belum dikonfigurasi." };
      }
      try {
        const stored = await uploadFile({
          schoolId,
          ownerId: teacherId,
          file,
          kind: "material",
          prefix: "materials",
          maxBytes: 25_000_000,
        });
        url = stored.url;
        if (existing?.type === "file") fileToRemove = existing.url; // ganti berkas
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Gagal mengunggah berkas." };
      }
    } else if (existing?.type === "file") {
      url = existing.url; // pertahankan berkas lama
    } else {
      return { error: "Pilih berkas untuk diunggah." };
    }
    type = "file";
  } else {
    // tulis
    type = d.aiAssisted === "1" ? "ai" : "manual";
    if (existing?.type === "file") fileToRemove = existing.url;
  }

  const values = {
    subjectId: d.subjectId,
    classId: d.classId || null,
    title: d.title,
    topic: d.topic || null,
    type,
    url,
    notes: d.content || "",
  };

  await withTenant(schoolId, async () => {
    if (id) {
      await db
        .update(materials)
        .set({ ...values, status: "ready" })
        .where(and(eq(materials.id, id), eq(materials.schoolId, schoolId)));
    } else {
      await db.insert(materials).values({ schoolId, teacherId, status: "ready", ...values });
    }
  });

  if (fileToRemove) await deleteFile(fileToRemove);
  revalidatePath("/guru/materi");
  return { ok: true };
}

/**
 * Rangkum bahan modul guru (teks tempel dan/atau berkas) menjadi materi
 * presentasi berformat slide-markdown, TANPA menyimpan — hasil dikembalikan agar
 * guru bisa menyunting per slide sebelum menekan Simpan. Kuota AI ditegakkan &
 * pemakaian dicatat. Gemini membaca PDF/gambar native; DOCX diekstrak via mammoth.
 */
const MAX_SOURCE_BYTES = 15_000_000;

const styleLabel: Record<string, string> = {
  ringkas: "ringkas dan padat",
  naratif: "naratif dan mengalir",
  interaktif: "interaktif dengan pertanyaan pemantik",
};

/** Ubah berkas modul menjadi bagian konten Gemini (inline atau teks). */
async function fileToPart(file: File): Promise<GeminiPart | { error: string }> {
  if (file.size > MAX_SOURCE_BYTES) {
    return { error: "Berkas terlalu besar (maks 15 MB)." };
  }
  const name = file.name.toLowerCase();
  const mime = file.type || "";
  const buf = Buffer.from(await file.arrayBuffer());

  if (mime === "application/pdf" || name.endsWith(".pdf")) {
    return { inlineData: { mimeType: "application/pdf", data: buf.toString("base64") } };
  }
  if (mime.startsWith("image/")) {
    return { inlineData: { mimeType: mime, data: buf.toString("base64") } };
  }
  if (name.endsWith(".docx")) {
    try {
      const { value } = await mammoth.extractRawText({ buffer: buf });
      const text = value.trim();
      if (!text) return { error: "Berkas DOCX kosong / tak terbaca." };
      return { text: `BAHAN SUMBER (dari berkas ${file.name}):\n${text}` };
    } catch {
      return { error: "Gagal membaca berkas DOCX." };
    }
  }
  if (mime.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
    const text = buf.toString("utf8").trim();
    if (!text) return { error: "Berkas teks kosong." };
    return { text: `BAHAN SUMBER (dari berkas ${file.name}):\n${text}` };
  }
  return { error: "Format tak didukung. Pakai PDF, DOCX, gambar, atau teks." };
}

export async function generateSlides(
  formData: FormData,
): Promise<{ text?: string; fromKnowledge?: boolean; error?: string }> {
  const { schoolId, teacherId } = await requireTeacher();
  console.log("[slides] mulai", { schoolId, teacherId });
  const subjectId = String(formData.get("subjectId") ?? "");
  if (!z.string().uuid().safeParse(subjectId).success) {
    console.warn("[slides] subjectId invalid:", subjectId);
    return { error: "Pilih mapel dulu." };
  }

  const topic = String(formData.get("topic") ?? "").trim();
  const sourceText = String(formData.get("sourceText") ?? "").trim();
  const file = formData.get("sourceFile");
  const hasFile = file instanceof File && file.size > 0;
  console.log("[slides] input", {
    subjectId,
    topic,
    sourceTextChars: sourceText.length,
    hasFile,
    file: hasFile ? { name: file.name, type: file.type, size: file.size } : null,
  });
  // Bahan modul kini OPSIONAL: tanpa bahan, AI menyusun materi dari
  // pengetahuannya sendiri — asalkan ada topik sebagai pijakan.
  const fromKnowledge = !sourceText && !hasFile;
  if (fromKnowledge && !topic) {
    console.warn("[slides] tanpa sumber & tanpa topik");
    return { error: "Isi Topik dulu — atau beri bahan modul (teks/berkas)." };
  }

  const slideCount = Math.min(30, Math.max(3, Number(formData.get("slideCount")) || 10));
  const level = String(formData.get("level") ?? "SMP").trim() || "SMP";
  const style = styleLabel[String(formData.get("style") ?? "ringkas")] ?? styleLabel.ringkas;
  const withExamples = formData.get("includeExamples") === "1";
  const withDiscussion = formData.get("includeDiscussion") === "1";
  console.log("[slides] knobs", { slideCount, level, style, withExamples, withDiscussion });

  try {
    return await withTenant(schoolId, async () => {
      await assertAiQuota(schoolId);
      console.log("[slides] kuota AI OK");
      const [subj] = await db
        .select({ name: subjects.name })
        .from(subjects)
        .where(and(eq(subjects.id, subjectId), eq(subjects.schoolId, schoolId)))
        .limit(1);
      console.log("[slides] mapel:", subj?.name ?? "(tak ditemukan)");

      if (!isAiConfigured()) {
        console.log("[slides] AI tak dikonfigurasi → slide demo");
        return { text: demoSlides(topic || subj?.name || "Materi", slideCount), fromKnowledge };
      }

      const instruction = [
        fromKnowledge
          ? `Kamu asisten guru. TIDAK ada bahan sumber — susun materi presentasi (slide) yang menarik dalam Bahasa Indonesia dari pengetahuanmu sendiri tentang topik ini. Berpegang pada materi standar kurikulum sekolah di Indonesia untuk jenjang yang diminta, dan JANGAN menyertakan fakta, angka, atau nama yang tidak kamu yakini kebenarannya.`
          : `Kamu asisten guru. Dari BAHAN SUMBER di bawah, susun materi presentasi (slide) yang menarik dalam Bahasa Indonesia.`,
        `Mata pelajaran: ${subj?.name ?? "umum"}${topic ? `. Fokus topik: ${topic}` : ""}.`,
        `Sasaran jenjang: ${level}. Sesuaikan kedalaman & bahasa untuk jenjang itu.`,
        `Buat sekitar ${slideCount} slide, gaya ${style}.`,
        withExamples ? "Sertakan 1–2 slide contoh soal beserta pembahasan singkat." : "",
        withDiscussion ? "Sertakan 1 slide poin diskusi/pertanyaan pemantik." : "",
        "",
        "FORMAT WAJIB (jangan menyimpang):",
        "- Pisahkan tiap slide dengan baris berisi tepat: ---",
        "- Baris pertama tiap slide adalah judul, diawali '# '.",
        `- Baris kedua adalah tipe slide: [tipe: X] dengan X salah satu dari: ${SLIDE_TYPES.join(", ")}.`,
        "- Isi slide adalah CAMPURAN: paragraf singkat (1–2 kalimat, ditulis sebagai baris biasa) dan butir '- '. Pakai butir HANYA bila isinya memang daftar (maks 5 butir); jangan jadikan semua isi butir-butir.",
        "- Kode program, rumus, atau langkah perhitungan matematis WAJIB ditulis dalam blok tersendiri yang dibuka dan ditutup baris berisi tepat: ``` (tiga backtick). Jangan campur kode/rumus ke paragraf atau butir — blok ini tampil sebagai panel khusus terpisah di slide. Maksimal satu blok per slide, isi blok maksimal 8 baris.",
        "- Slide pertama [tipe: pembuka] = judul presentasi + 1 subjudul singkat. Slide terakhir [tipe: penutup] = pesan penutup + rangkuman 2–3 butir.",
        "- Variasikan tipe agar presentasi berirama: pakai [tipe: bab] untuk pergantian bagian besar, [tipe: dua-kolom] untuk perbandingan, [tipe: kutipan] untuk definisi/kutipan penting, [tipe: angka] untuk fakta berangka (butir pertama HANYA angka/fakta super singkat, butir berikutnya keterangan), [tipe: contoh] untuk contoh soal, [tipe: diskusi] untuk pertanyaan pemantik, dan [tipe: poin] untuk isi biasa.",
        "- Jangan menulis apa pun di luar slide (tanpa pengantar/penutup).",
      ]
        .filter(Boolean)
        .join("\n");

      const parts: GeminiPart[] = [{ text: instruction }];
      if (sourceText) parts.push({ text: `BAHAN SUMBER (teks):\n${sourceText}` });
      if (hasFile) {
        const part = await fileToPart(file);
        if ("error" in part) {
          console.warn("[slides] fileToPart gagal:", part.error);
          return { error: part.error };
        }
        console.log(
          "[slides] file part:",
          "text" in part
            ? { kind: "text", chars: part.text.length }
            : { kind: "inlineData", mimeType: part.inlineData.mimeType },
        );
        parts.push(part);
      }

      console.log("[slides] panggil Gemini dengan", parts.length, "bagian");
      const out = await generateFromParts(parts);
      if (!out) {
        console.warn("[slides] Gemini kembalikan kosong/null");
        return { error: "AI tidak mengembalikan hasil. Coba lagi." };
      }
      await recordAiUsage(schoolId, teacherId, "material.slides");
      console.log("[slides] SUKSES — panjang hasil:", out.length, "char");
      return { text: out, fromKnowledge };
    });
  } catch (e) {
    console.error("[slides] EXCEPTION:", e);
    return { error: e instanceof Error ? e.message : "Gagal membuat slide." };
  }
}

/** Kerangka slide untuk mode demo (tanpa kunci AI). */
function demoSlides(title: string, count: number): string {
  const slides = [
    `# ${title}\n[tipe: pembuka]\n- Materi presentasi (mode demo — kunci AI belum diatur)`,
  ];
  for (let i = 1; i < Math.min(count, 5); i++) {
    slides.push(
      `# Bagian ${i}\n[tipe: poin]\nParagraf pengantar singkat tentang bagian ini.\n- Poin utama …\n- Contoh …`,
    );
  }
  slides.push(`# Terima Kasih\n[tipe: penutup]\n- Rangkuman singkat …`);
  return slides.join("\n\n---\n\n");
}

/**
 * Jalur kilat "Buatkan semuanya": slide + 3 cetak biru desain digarap
 * BERSAMAAN di server (satu kali tunggu, bukan dua). Slide gagal = gagal
 * total; desain gagal = tetap kembalikan slide + desain bawaan agar guru
 * tidak kehilangan hasil.
 */
export async function generateAll(formData: FormData): Promise<{
  text?: string;
  fromKnowledge?: boolean;
  designs?: DesignSpec[];
  designNote?: string;
  error?: string;
}> {
  const [slides, designs] = await Promise.all([
    generateSlides(formData),
    generateDesigns(formData),
  ]);
  if (slides.error || !slides.text) {
    return { error: slides.error ?? "Gagal membuat slide. Coba lagi." };
  }
  if (designs.error || !designs.designs?.length) {
    return {
      text: slides.text,
      fromKnowledge: slides.fromKnowledge,
      designs: FALLBACK_DESIGNS,
      designNote: designs.error
        ? `Desain AI gagal (${designs.error}) — dipakai desain bawaan; coba "Rancang ulang".`
        : undefined,
    };
  }
  return { text: slides.text, fromKnowledge: slides.fromKnowledge, designs: designs.designs };
}

/* ===================== Desain PPT (cetak biru AI) ===================== */

/**
 * Minta AI menyusun 3 "cetak biru desain" dari deskripsi bebas guru.
 * AI TIDAK menulis kode — ia hanya mengisi spesifikasi (warna, font,
 * gaya dekorasi) yang lalu dibersihkan `sanitizeDesign` (font dibatasi
 * daftar aman, kontras teks dikoreksi otomatis). Mesin pptxgenjs kitalah
 * yang merakit berkasnya.
 */
export async function generateDesigns(
  formData: FormData,
): Promise<{ designs?: DesignSpec[]; error?: string }> {
  const { schoolId, teacherId } = await requireTeacher();
  const description = String(formData.get("description") ?? "").trim().slice(0, 500);
  const topic = String(formData.get("topic") ?? "").trim();
  const level = String(formData.get("level") ?? "").trim();
  const subjectId = String(formData.get("subjectId") ?? "");

  try {
    return await withTenant(schoolId, async () => {
      if (!isAiConfigured()) {
        // Mode demo: tawarkan desain bawaan agar alur tetap bisa dicoba.
        return { designs: FALLBACK_DESIGNS };
      }
      await assertAiQuota(schoolId);

      let subjectName = "";
      if (z.string().uuid().safeParse(subjectId).success) {
        const [subj] = await db
          .select({ name: subjects.name })
          .from(subjects)
          .where(and(eq(subjects.id, subjectId), eq(subjects.schoolId, schoolId)))
          .limit(1);
        subjectName = subj?.name ?? "";
      }

      const prompt = [
        "Kamu desainer presentasi profesional. Susun 3 alternatif desain slide yang menarik, modern, dan SANGAT berbeda satu sama lain.",
        description
          ? `Keinginan guru: "${description}". Patuhi keinginan ini sebagai arah utama.`
          : "Guru tidak memberi arahan — karang sendiri desain yang paling cocok dengan konteks materi.",
        [
          subjectName && `Mata pelajaran: ${subjectName}`,
          topic && `Topik: ${topic}`,
          level && `Jenjang: ${level}`,
        ]
          .filter(Boolean)
          .join(". "),
        "",
        "Balas HANYA JSON array valid (tanpa markdown, tanpa penjelasan) berisi tepat 3 objek dengan bentuk:",
        `{"name":"nama desain singkat","vibe":"deskripsi suasana 1 kalimat","colors":{"background":"#RRGGBB latar slide","surface":"#RRGGBB panel/kartu","title":"#RRGGBB judul","text":"#RRGGBB teks isi","accent":"#RRGGBB aksen utama","accent2":"#RRGGBB aksen kedua"},"headingFont":"…","bodyFont":"…","decor":"…","bulletStyle":"…","titleUpper":false,"coverStyle":"…"}`,
        "Aturan:",
        `- headingFont & bodyFont HARUS dari daftar: ${SAFE_FONTS.join(", ")}.`,
        `- decor salah satu dari: ${DECOR_STYLES.join(", ")}. bulletStyle: ${BULLET_STYLES.join(", ")}. coverStyle: ${COVER_STYLES.join(", ")}.`,
        "- Pastikan title & text kontras kuat terhadap background (terbaca jelas), dan text juga terbaca di atas surface.",
        "- Warna harus harmonis dan sesuai suasana yang diminta guru/topik.",
      ]
        .filter(Boolean)
        .join("\n");

      const out = await generateFromParts([{ text: prompt }]);
      if (!out) return { error: "AI tidak mengembalikan hasil. Coba lagi." };

      // Bersihkan pagar kode bila AI tetap menambahkannya.
      const jsonText = out.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        console.warn("[design] JSON tak valid:", jsonText.slice(0, 300));
        return { error: "Hasil AI tidak bisa dibaca. Coba lagi." };
      }
      const rawList = Array.isArray(parsed)
        ? parsed
        : (parsed as { designs?: unknown[] })?.designs ?? [];
      const designs = (rawList as unknown[])
        .map(sanitizeDesign)
        .filter((d): d is DesignSpec => d !== null)
        .slice(0, 3);
      if (designs.length === 0) return { error: "AI tidak menghasilkan desain valid. Coba lagi." };
      // Genapkan ke 3 pilihan dengan desain bawaan bila AI kurang.
      for (const fb of FALLBACK_DESIGNS) {
        if (designs.length >= 3) break;
        designs.push(fb);
      }

      await recordAiUsage(schoolId, teacherId, "material.design");
      return { designs };
    });
  } catch (e) {
    console.error("[design] EXCEPTION:", e);
    return { error: e instanceof Error ? e.message : "Gagal membuat desain." };
  }
}

/* ======================= Ekspor PowerPoint (.pptx) ======================= */

const exportSchema = z.object({
  title: z.string().trim().min(1, "Isi judul materi dulu."),
  subjectId: z.string().uuid().optional().or(z.literal("")),
  content: z.string().trim().min(1, "Belum ada isi slide untuk diekspor."),
  design: z.string().min(2, "Pilih desain dulu."),
});

/**
 * Rakit berkas PowerPoint dari teks slide + cetak biru desain terpilih,
 * lalu kembalikan sebagai base64 untuk diunduh browser. Tanpa AI — murni
 * mesin pptxgenjs, jadi tidak memakan kuota AI.
 */
export async function exportPptx(
  formData: FormData,
): Promise<{ base64?: string; filename?: string; error?: string }> {
  const { schoolId, teacherId } = await requireTeacher();
  const parsed = exportSchema.safeParse({
    title: formData.get("title"),
    subjectId: formData.get("subjectId"),
    content: formData.get("content"),
    design: formData.get("design"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const d = parsed.data;

  // Jangan percaya JSON dari browser mentah-mentah — bersihkan ulang.
  let design: DesignSpec | null = null;
  try {
    design = sanitizeDesign(JSON.parse(d.design));
  } catch {
    design = null;
  }
  if (!design) return { error: "Desain tidak valid. Buat ulang desainnya." };

  try {
    const meta = await withTenant(schoolId, async () => {
      const [teacher] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, teacherId))
        .limit(1);
      const [school] = await db
        .select({ name: schools.name })
        .from(schools)
        .where(eq(schools.id, schoolId))
        .limit(1);
      let subjectName: string | undefined;
      if (d.subjectId) {
        const [subj] = await db
          .select({ name: subjects.name })
          .from(subjects)
          .where(and(eq(subjects.id, d.subjectId), eq(subjects.schoolId, schoolId)))
          .limit(1);
        subjectName = subj?.name ?? undefined;
      }
      return {
        title: d.title,
        subject: subjectName,
        teacher: teacher?.name,
        school: school?.name,
        dateLabel: new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      };
    });

    const { base64, slideCount } = await buildPptx(d.content, design, meta);
    console.log("[pptx] ekspor OK:", { slideCount, bytes: Math.round((base64.length * 3) / 4) });
    const safeName = d.title.replace(/[^\p{L}\p{N} _-]/gu, "").trim().replace(/\s+/g, "-") || "materi";
    return { base64, filename: `${safeName}.pptx` };
  } catch (e) {
    console.error("[pptx] EXCEPTION:", e);
    return { error: e instanceof Error ? e.message : "Gagal membuat berkas PowerPoint." };
  }
}

export async function deleteMaterial(formData: FormData) {
  const { schoolId } = await requireTeacher();
  const id = z.string().uuid().parse(formData.get("id"));
  const removed = await withTenant(schoolId, async () => {
    const [row] = await db
      .select({ type: materials.type, url: materials.url })
      .from(materials)
      .where(and(eq(materials.id, id), eq(materials.schoolId, schoolId)))
      .limit(1);
    await db
      .delete(materials)
      .where(and(eq(materials.id, id), eq(materials.schoolId, schoolId)));
    return row;
  });
  // Materi berbasis berkas → hapus juga objek di penyimpanan & lepaskan kuota.
  if (removed?.type === "file") await deleteFile(removed.url);
  revalidatePath("/guru/materi");
}
