import mammoth from "mammoth";
import type { GeminiPart } from "@/lib/ai";

/**
 * Pembaca "bahan referensi" untuk fitur AI (materi & pembuat soal).
 * Gemini membaca PDF & gambar secara native (dikirim inline base64);
 * DOCX diekstrak jadi teks via mammoth; teks polos dikirim apa adanya.
 */
export const MAX_SOURCE_BYTES = 15_000_000;

/** Ubah berkas bahan menjadi bagian konten Gemini (inline atau teks). */
export async function fileToPart(file: File): Promise<GeminiPart | { error: string }> {
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
