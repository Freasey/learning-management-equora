"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, withTenant, materials, subjects } from "@/db";
import { requireTeacher } from "@/lib/auth-guard";
import { assertAiQuota, generateText, isAiConfigured, recordAiUsage } from "@/lib/ai";
import { uploadFile, deleteFile } from "@/lib/storage";

const addSchema = z.object({
  title: z.string().min(2, "Judul minimal 2 karakter"),
  subjectId: z.string().uuid("Pilih mapel"),
  classId: z.string().optional().or(z.literal("")),
  topic: z.string().optional().or(z.literal("")),
  type: z.enum(["manual", "link"]),
  url: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export async function addMaterial(formData: FormData) {
  const { schoolId, teacherId } = await requireTeacher();
  const parsed = addSchema.safeParse({
    title: formData.get("title"),
    subjectId: formData.get("subjectId"),
    classId: formData.get("classId"),
    topic: formData.get("topic"),
    type: formData.get("type"),
    url: formData.get("url"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);

  await withTenant(schoolId, async () => {
    await db.insert(materials).values({
      schoolId,
      teacherId,
      subjectId: parsed.data.subjectId,
      classId: parsed.data.classId || null,
      title: parsed.data.title,
      topic: parsed.data.topic || null,
      type: parsed.data.type,
      url: parsed.data.url || null,
      notes: parsed.data.notes || "",
    });
  });
  revalidatePath("/guru/materi");
}

const fileSchema = z.object({
  title: z.string().min(2, "Judul minimal 2 karakter"),
  subjectId: z.string().uuid("Pilih mapel"),
  classId: z.string().optional().or(z.literal("")),
  topic: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

/** Unggah berkas materi (PDF/PPT/DOCX/gambar) ke Vercel Blob. */
export async function uploadMaterialFile(formData: FormData) {
  const { schoolId, teacherId } = await requireTeacher();
  const parsed = fileSchema.safeParse({
    title: formData.get("title"),
    subjectId: formData.get("subjectId"),
    classId: formData.get("classId"),
    topic: formData.get("topic"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Pilih berkas untuk diunggah.");
  }

  const stored = await uploadFile({
    schoolId,
    ownerId: teacherId,
    file,
    kind: "material",
    prefix: "materials",
    maxBytes: 25_000_000,
  });

  await withTenant(schoolId, async () => {
    await db.insert(materials).values({
      schoolId,
      teacherId,
      subjectId: parsed.data.subjectId,
      classId: parsed.data.classId || null,
      title: parsed.data.title,
      topic: parsed.data.topic || null,
      type: "file",
      url: stored.url,
      notes: parsed.data.notes || "",
    });
  });
  revalidatePath("/guru/materi");
}

/**
 * Generate materi via AI (Gemini). Bila kunci AI belum diatur, jatuh ke mode
 * demo (entri penanda). Kuota AI ditegakkan (assertAiQuota) & pemakaian dicatat.
 */
const aiSchema = z.object({
  subjectId: z.string().uuid("Pilih mapel"),
  classId: z.string().optional().or(z.literal("")),
  topic: z.string().min(2, "Isi topik materi"),
});

export async function generateAiMaterial(formData: FormData) {
  const { schoolId, teacherId } = await requireTeacher();
  const parsed = aiSchema.safeParse({
    subjectId: formData.get("subjectId"),
    classId: formData.get("classId"),
    topic: formData.get("topic"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);

  await withTenant(schoolId, async () => {
    await assertAiQuota(schoolId);

    const [subj] = await db
      .select({ name: subjects.name })
      .from(subjects)
      .where(and(eq(subjects.id, parsed.data.subjectId), eq(subjects.schoolId, schoolId)))
      .limit(1);

    let notes =
      "Dihasilkan AI (mode demo — kunci AI belum diatur). Isi materi nyata muncul setelah GEMINI_API_KEY diisi.";
    if (isAiConfigured()) {
      const prompt = `Buat ringkasan materi ajar untuk mata pelajaran "${
        subj?.name ?? "umum"
      }" dengan topik "${parsed.data.topic}". Tulis dalam Bahasa Indonesia, terstruktur: tujuan pembelajaran, poin-poin utama, contoh sederhana, dan ringkasan. Format ringkas dengan poin.`;
      const out = await generateText(prompt);
      if (out) {
        notes = out;
        await recordAiUsage(schoolId, teacherId, "material.generate");
      }
    }

    await db.insert(materials).values({
      schoolId,
      teacherId,
      subjectId: parsed.data.subjectId,
      classId: parsed.data.classId || null,
      title: `Materi: ${parsed.data.topic}`,
      topic: parsed.data.topic,
      type: "ai",
      notes,
      status: "ready",
    });
  });
  revalidatePath("/guru/materi");
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
  // Materi berbasis berkas → hapus juga objek di Blob & lepaskan kuota.
  if (removed?.type === "file") await deleteFile(removed.url);
  revalidatePath("/guru/materi");
}
