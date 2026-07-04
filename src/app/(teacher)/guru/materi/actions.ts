"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, withTenant, materials, subjects } from "@/db";
import { requireTeacher } from "@/lib/auth-guard";
import { assertAiQuota, generateText, isAiConfigured, recordAiUsage } from "@/lib/ai";
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
 * Hasilkan draf materi via AI tanpa menyimpan — teks dikembalikan agar guru bisa
 * menyunting dulu sebelum menekan Simpan. Kuota AI ditegakkan & pemakaian dicatat.
 */
const draftSchema = z.object({
  subjectId: z.string().uuid(),
  topic: z.string().trim().min(2),
});

export async function generateAiDraft(
  subjectId: string,
  topic: string,
): Promise<{ text?: string; error?: string }> {
  const { schoolId, teacherId } = await requireTeacher();
  const parsed = draftSchema.safeParse({ subjectId, topic });
  if (!parsed.success) return { error: "Pilih mapel dan isi topik dulu." };

  try {
    return await withTenant(schoolId, async () => {
      await assertAiQuota(schoolId);
      const [subj] = await db
        .select({ name: subjects.name })
        .from(subjects)
        .where(and(eq(subjects.id, parsed.data.subjectId), eq(subjects.schoolId, schoolId)))
        .limit(1);

      if (!isAiConfigured()) {
        return {
          text: `Draf materi "${parsed.data.topic}" (mode demo — kunci AI belum diatur).\n\nTujuan pembelajaran:\n- …\n\nPoin utama:\n- …\n\nContoh:\n- …\n\nRingkasan:\n- …`,
        };
      }
      const prompt = `Buat ringkasan materi ajar untuk mata pelajaran "${
        subj?.name ?? "umum"
      }" dengan topik "${parsed.data.topic}". Tulis dalam Bahasa Indonesia, terstruktur: tujuan pembelajaran, poin-poin utama, contoh sederhana, dan ringkasan. Format ringkas dengan poin.`;
      const out = await generateText(prompt);
      if (!out) return { error: "AI tidak mengembalikan hasil. Coba lagi." };
      await recordAiUsage(schoolId, teacherId, "material.generate");
      return { text: out };
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Gagal membuat draf AI." };
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
