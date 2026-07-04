"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, withTenant, materials, subjects } from "@/db";
import { requireTeacher } from "@/lib/auth-guard";
import mammoth from "mammoth";
import {
  assertAiQuota,
  generateFromParts,
  isAiConfigured,
  recordAiUsage,
  type GeminiPart,
} from "@/lib/ai";
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

export async function saveMaterial(
  _state: MaterialState,
  formData: FormData,
): Promise<MaterialState> {
  const { schoolId, teacherId } = await requireTeacher();
  const parsed = saveSchema.safeParse({
    id: formData.get("id"),
    source: formData.get("source"),
    title: formData.get("title"),
    subjectId: formData.get("subjectId"),
    classId: formData.get("classId"),
    topic: formData.get("topic"),
    content: formData.get("content"),
    url: formData.get("url"),
    aiAssisted: formData.get("aiAssisted"),
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
): Promise<{ text?: string; error?: string }> {
  const { schoolId, teacherId } = await requireTeacher();
  const subjectId = String(formData.get("subjectId") ?? "");
  if (!z.string().uuid().safeParse(subjectId).success) return { error: "Pilih mapel dulu." };

  const topic = String(formData.get("topic") ?? "").trim();
  const sourceText = String(formData.get("sourceText") ?? "").trim();
  const file = formData.get("sourceFile");
  const hasFile = file instanceof File && file.size > 0;
  if (!sourceText && !hasFile) {
    return { error: "Tempel isi modul atau unggah berkas modul dulu." };
  }

  const slideCount = Math.min(30, Math.max(3, Number(formData.get("slideCount")) || 10));
  const level = String(formData.get("level") ?? "SMP").trim() || "SMP";
  const style = styleLabel[String(formData.get("style") ?? "ringkas")] ?? styleLabel.ringkas;
  const withExamples = formData.get("includeExamples") === "1";
  const withDiscussion = formData.get("includeDiscussion") === "1";

  try {
    return await withTenant(schoolId, async () => {
      await assertAiQuota(schoolId);
      const [subj] = await db
        .select({ name: subjects.name })
        .from(subjects)
        .where(and(eq(subjects.id, subjectId), eq(subjects.schoolId, schoolId)))
        .limit(1);

      if (!isAiConfigured()) {
        return { text: demoSlides(topic || subj?.name || "Materi", slideCount) };
      }

      const instruction = [
        `Kamu asisten guru. Dari BAHAN SUMBER di bawah, susun materi presentasi (slide) yang menarik dalam Bahasa Indonesia.`,
        `Mata pelajaran: ${subj?.name ?? "umum"}${topic ? `. Fokus topik: ${topic}` : ""}.`,
        `Sasaran jenjang: ${level}. Sesuaikan kedalaman & bahasa untuk jenjang itu.`,
        `Buat sekitar ${slideCount} slide, gaya ${style}.`,
        withExamples ? "Sertakan 1–2 slide contoh soal beserta pembahasan singkat." : "",
        withDiscussion ? "Sertakan 1 slide poin diskusi/pertanyaan pemantik." : "",
        "",
        "FORMAT WAJIB (jangan menyimpang):",
        "- Pisahkan tiap slide dengan baris berisi tepat: ---",
        "- Baris pertama tiap slide adalah judul, diawali '# '.",
        "- Butir isi memakai '- ' (maks 6 butir per slide, tiap butir ringkas).",
        "- Slide pertama adalah judul presentasi + subjudul singkat.",
        "- Jangan menulis apa pun di luar slide (tanpa pengantar/penutup).",
      ]
        .filter(Boolean)
        .join("\n");

      const parts: GeminiPart[] = [{ text: instruction }];
      if (sourceText) parts.push({ text: `BAHAN SUMBER (teks):\n${sourceText}` });
      if (hasFile) {
        const part = await fileToPart(file);
        if ("error" in part) return { error: part.error };
        parts.push(part);
      }

      const out = await generateFromParts(parts);
      if (!out) return { error: "AI tidak mengembalikan hasil. Coba lagi." };
      await recordAiUsage(schoolId, teacherId, "material.slides");
      return { text: out };
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal membuat slide." };
  }
}

/** Kerangka slide untuk mode demo (tanpa kunci AI). */
function demoSlides(title: string, count: number): string {
  const slides = [`# ${title}\n- Materi presentasi (mode demo — kunci AI belum diatur)`];
  for (let i = 1; i < Math.min(count, 5); i++) {
    slides.push(`# Bagian ${i}\n- Poin utama …\n- Penjelasan singkat …\n- Contoh …`);
  }
  return slides.join("\n\n---\n\n");
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
