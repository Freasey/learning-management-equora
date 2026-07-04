import { and, count, eq, gte } from "drizzle-orm";
import { db, aiUsage } from "@/db";
import { getSchoolPlan } from "@/lib/quota";

const MODEL = process.env.AI_MODEL || "gemini-2.0-flash";

/** True bila kunci Gemini/Google tersedia. */
export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
}

/** Bagian konten untuk Gemini: teks biasa atau berkas inline (base64). */
export type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

/** Ringkas bagian konten untuk log (tanpa membocorkan isi/base64 penuh). */
function summarizeParts(parts: GeminiPart[]) {
  return parts.map((p, i) =>
    "text" in p
      ? { i, kind: "text", chars: p.text.length, preview: p.text.slice(0, 80) }
      : {
          i,
          kind: "inlineData",
          mimeType: p.inlineData.mimeType,
          base64Len: p.inlineData.data.length,
          approxBytes: Math.round((p.inlineData.data.length * 3) / 4),
        },
  );
}

/**
 * Panggil Gemini dengan gabungan bagian teks + berkas inline (PDF/gambar).
 * Gemini membaca PDF & gambar secara native — tak perlu ekstraksi teks lokal.
 * Mengembalikan teks hasil, atau null bila belum dikonfigurasi / gagal.
 * Logging tebal (prefix [AI]) untuk membantu trace masalah kuota/format/safety.
 */
export async function generateFromParts(parts: GeminiPart[]): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const keySource = process.env.GEMINI_API_KEY
    ? "GEMINI_API_KEY"
    : process.env.GOOGLE_API_KEY
      ? "GOOGLE_API_KEY"
      : "(none)";
  console.log("[AI] generateFromParts →", {
    model: MODEL,
    keySource,
    keyPresent: Boolean(key),
    keyLen: key?.length ?? 0,
    keyTail: key ? `…${key.slice(-4)}` : null,
    partCount: parts.length,
    parts: summarizeParts(parts),
  });

  if (!key) {
    console.warn("[AI] Kunci tidak ada — kembalikan null (mode demo di pemanggil).");
    return null;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const body = JSON.stringify({ contents: [{ parts }] });
  console.log("[AI] request", { url, bodyBytes: body.length });

  const t0 = Date.now();
  let res: Response;
  try {
    res = await fetch(`${url}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch (err) {
    console.error("[AI] fetch gagal (jaringan):", err);
    return null;
  }
  const ms = Date.now() - t0;
  console.log("[AI] response", { status: res.status, statusText: res.statusText, ok: res.ok, ms });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "(gagal baca body)");
    console.error("[AI] error body:", errBody);
    return null;
  }

  const data = (await res.json()) as {
    candidates?: {
      content?: { parts?: { text?: string }[] };
      finishReason?: string;
      safetyRatings?: unknown[];
    }[];
    promptFeedback?: { blockReason?: string; safetyRatings?: unknown[] };
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  };

  const cand = data.candidates?.[0];
  console.log("[AI] result meta", {
    candidateCount: data.candidates?.length ?? 0,
    finishReason: cand?.finishReason,
    blockReason: data.promptFeedback?.blockReason,
    usage: data.usageMetadata,
  });
  if (data.promptFeedback?.blockReason) {
    console.warn("[AI] prompt DIBLOKIR:", data.promptFeedback);
  }

  const outParts = cand?.content?.parts ?? [];
  const text = outParts.map((p) => p.text ?? "").join("").trim();
  console.log("[AI] output", { chars: text.length, preview: text.slice(0, 120) });
  if (!text) {
    console.warn("[AI] Output kosong — data penuh:", JSON.stringify(data).slice(0, 2000));
  }
  return text || null;
}

/**
 * Panggil Gemini dengan satu prompt teks. Mengembalikan teks, atau null bila
 * belum dikonfigurasi / gagal (pemanggil menyiapkan fallback).
 */
export function generateText(prompt: string): Promise<string | null> {
  return generateFromParts([{ text: prompt }]);
}

/** Catat satu pemakaian AI (untuk akuntansi kuota). */
export async function recordAiUsage(
  schoolId: string,
  userId: string | null,
  kind: string,
  tokens = 0,
) {
  try {
    await db.insert(aiUsage).values({ schoolId, userId, kind, tokens });
  } catch (err) {
    console.error("recordAiUsage gagal:", err);
  }
}

/** Jumlah pemakaian AI pada bulan berjalan. */
export async function aiUsedThisMonth(schoolId: string): Promise<number> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const [row] = await db
    .select({ n: count() })
    .from(aiUsage)
    .where(and(eq(aiUsage.schoolId, schoolId), gte(aiUsage.createdAt, start)));
  return row?.n ?? 0;
}

/** Lempar bila kuota AI bulan ini sudah habis (aiCredits null = tak terbatas). */
export async function assertAiQuota(schoolId: string) {
  const plan = await getSchoolPlan(schoolId);
  const credits = plan?.aiCredits;
  if (credits === null || credits === undefined) return;
  const used = await aiUsedThisMonth(schoolId);
  if (used >= credits) {
    throw new Error(
      `Kuota AI bulan ini habis (${used}/${credits}). Tunggu bulan depan atau upgrade paket.`,
    );
  }
}
