import { and, count, eq, gte } from "drizzle-orm";
import { db, aiUsage } from "@/db";
import { getSchoolPlan } from "@/lib/quota";

const MODEL = process.env.AI_MODEL || "gemini-2.0-flash";

/** True bila kunci Gemini/Google tersedia. */
export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
}

/**
 * Panggil Gemini (Google Generative Language REST API). Mengembalikan teks,
 * atau null bila belum dikonfigurasi / gagal (pemanggil menyiapkan fallback).
 */
export async function generateText(prompt: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    );
    if (!res.ok) {
      console.error("Gemini error", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((p) => p.text ?? "").join("").trim();
    return text || null;
  } catch (err) {
    console.error("Gemini gagal:", err);
    return null;
  }
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
