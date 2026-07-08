"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, withTenant, assessments, questions, gradeItems, attempts, answers, grades, enrollments, subjects } from "@/db";
import { requireTeacher } from "@/lib/auth-guard";
import { getActiveYear } from "@/lib/academic";
import { assertTeacherTeachesClass, teacherTeachesClass } from "@/lib/teaching";
import { notify, notifyMany } from "@/lib/notify";
import { uploadFile, deleteFile } from "@/lib/storage";
import {
  assertAiQuota,
  generateFromParts,
  isAiConfigured,
  recordAiUsage,
  type GeminiPart,
} from "@/lib/ai";
import { fileToPart } from "@/lib/ai-source";

async function writeGrade(
  schoolId: string,
  assessmentId: string,
  studentId: string,
  score: number,
  academicYearId: string | null,
) {
  const [gi] = await db
    .select({ id: gradeItems.id })
    .from(gradeItems)
    .where(and(eq(gradeItems.assessmentId, assessmentId), eq(gradeItems.schoolId, schoolId)))
    .limit(1);
  if (!gi) return;
  await db
    .insert(grades)
    .values({ schoolId, academicYearId, gradeItemId: gi.id, studentId, score })
    .onConflictDoUpdate({
      target: [grades.gradeItemId, grades.studentId],
      set: { score },
    });
}

/** Beri nilai jawaban esai → hitung ulang total → tulis ke gradebook. */
export async function gradeEssays(formData: FormData) {
  const { schoolId, teacherId } = await requireTeacher();
  const attemptId = z.string().uuid().parse(formData.get("attemptId"));

  await withTenant(schoolId, async () => {
    const [att] = await db
      .select()
      .from(attempts)
      .where(and(eq(attempts.id, attemptId), eq(attempts.schoolId, schoolId)))
      .limit(1);
    if (!att) throw new Error("Pengerjaan tidak ditemukan.");
    await ownAssessment(schoolId, teacherId, att.assessmentId); // A2

    const rows = await db
      .select({
        answerId: answers.id,
        type: questions.type,
        points: questions.points,
        awarded: answers.awardedPoints,
      })
      .from(answers)
      .innerJoin(questions, eq(questions.id, answers.questionId))
      .where(eq(answers.attemptId, attemptId));

    let total = 0;
    let anyPending = false;
    for (const r of rows) {
      if (r.type === "essay") {
        const raw = formData.get(`award_${r.answerId}`);
        if (raw === null || String(raw).trim() === "") {
          anyPending = true;
          continue;
        }
        const val = Math.max(0, Math.min(r.points, Math.trunc(Number(raw))));
        await db.update(answers).set({ awardedPoints: val }).where(eq(answers.id, r.answerId));
        total += val;
      } else {
        total += r.awarded ?? 0;
      }
    }

    const status = anyPending ? "submitted" : "graded";
    await db
      .update(attempts)
      .set({ status, totalScore: anyPending ? null : total })
      .where(eq(attempts.id, attemptId));

    if (!anyPending) {
      await writeGrade(schoolId, att.assessmentId, att.studentId, total, att.academicYearId);
      // B1: beri tahu siswa nilainya sudah keluar.
      await notify({
        userId: att.studentId,
        schoolId,
        type: "grade",
        title: "Nilai kuis sudah keluar",
        body: "Koreksi selesai. Ketuk untuk melihat hasilmu.",
        href: `/siswa/kuis/${att.assessmentId}`,
      });
    }
    revalidatePath(`/guru/kuis/${att.assessmentId}`);
    revalidatePath(`/guru/kuis/${att.assessmentId}/koreksi/${attemptId}`);
  });
}

type AssessmentRow = typeof assessments.$inferSelect;

/** Pastikan ada item nilai tertaut untuk assessment (idempotent). */
async function ensureGradeItem(schoolId: string, a: AssessmentRow) {
  if (!a.classId) return; // butuh kelas untuk menautkan
  const [existing] = await db
    .select({ id: gradeItems.id })
    .from(gradeItems)
    .where(eq(gradeItems.assessmentId, a.id))
    .limit(1);
  if (existing) return;

  const qrows = await db
    .select({ points: questions.points })
    .from(questions)
    .where(eq(questions.assessmentId, a.id));
  const total = qrows.reduce((s, q) => s + q.points, 0) || 100;

  await db.insert(gradeItems).values({
    schoolId,
    academicYearId: a.academicYearId,
    teacherId: a.teacherId,
    classId: a.classId,
    subjectId: a.subjectId,
    title: a.title,
    maxScore: total,
    source: "assessment",
    assessmentId: a.id,
  });
}

async function ownAssessment(schoolId: string, teacherId: string, id: string) {
  const [a] = await db
    .select()
    .from(assessments)
    .where(and(eq(assessments.id, id), eq(assessments.schoolId, schoolId)))
    .limit(1);
  if (!a) throw new Error("Kuis tidak ditemukan.");
  // A2: hanya pembuat kuis atau guru pengampu kelasnya yang boleh mengelola.
  const owner = a.teacherId === teacherId;
  if (!owner && !(a.classId && (await teacherTeachesClass(schoolId, teacherId, a.classId)))) {
    throw new Error("Anda tidak berhak mengelola kuis ini.");
  }
  return a;
}

const createSchema = z.object({
  title: z.string().min(2, "Judul minimal 2 karakter"),
  type: z.enum(["quiz", "exam"]),
  subjectId: z.string().uuid("Pilih mapel"),
  classId: z.string().uuid("Pilih kelas"),
  durationMin: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.coerce.number().int().min(1).nullable(),
  ),
});

export async function createAssessment(formData: FormData) {
  const { schoolId, teacherId } = await requireTeacher();
  const parsed = createSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    subjectId: formData.get("subjectId"),
    classId: formData.get("classId"),
    durationMin: formData.get("durationMin"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);

  await withTenant(schoolId, async () => {
    // A2: guru hanya boleh membuat kuis untuk kelas yang ia ampu.
    await assertTeacherTeachesClass(schoolId, teacherId, parsed.data.classId);

    const year = await getActiveYear(schoolId);
    const [created] = await db
      .insert(assessments)
      .values({
        schoolId,
        academicYearId: year?.id ?? null,
        teacherId,
        subjectId: parsed.data.subjectId,
        classId: parsed.data.classId,
        title: parsed.data.title,
        type: parsed.data.type,
        durationMin: parsed.data.durationMin,
        status: "draft",
      })
      .returning({ id: assessments.id });

    redirect(`/guru/kuis/${created.id}`);
  });
}

export async function deleteAssessment(formData: FormData) {
  const { schoolId, teacherId } = await requireTeacher();
  const id = z.string().uuid().parse(formData.get("id"));
  await withTenant(schoolId, async () => {
    await ownAssessment(schoolId, teacherId, id); // A2
    await db
      .delete(assessments)
      .where(and(eq(assessments.id, id), eq(assessments.schoolId, schoolId)));
  });
  revalidatePath("/guru/kuis");
}

export async function setAssessmentStatus(formData: FormData) {
  const { schoolId, teacherId } = await requireTeacher();
  const id = z.string().uuid().parse(formData.get("id"));
  const status = z.enum(["draft", "published"]).parse(formData.get("status"));
  await withTenant(schoolId, async () => {
    const a = await ownAssessment(schoolId, teacherId, id);
    await db.update(assessments).set({ status }).where(eq(assessments.id, id));
    // Saat diterbitkan & dihitung ke nilai → buat item nilai tertaut.
    if (status === "published" && a.countToGrade) await ensureGradeItem(schoolId, a);
    // B1: beri tahu siswa kelas bahwa ada kuis baru.
    if (status === "published" && a.classId) {
      const studs = await db
        .select({ id: enrollments.studentId })
        .from(enrollments)
        .where(and(eq(enrollments.classId, a.classId), eq(enrollments.schoolId, schoolId)));
      await notifyMany(
        studs.map((s) => s.id),
        {
          schoolId,
          type: "quiz",
          title: `Kuis baru: ${a.title}`,
          body: "Ada kuis baru untukmu. Ketuk untuk mengerjakan.",
          href: `/siswa/kuis/${a.id}`,
        },
      );
    }
  });
  revalidatePath(`/guru/kuis/${id}`);
}

export async function toggleCountToGrade(formData: FormData) {
  const { schoolId, teacherId } = await requireTeacher();
  const id = z.string().uuid().parse(formData.get("id"));
  await withTenant(schoolId, async () => {
    const a = await ownAssessment(schoolId, teacherId, id);
    const next = !a.countToGrade;
    await db.update(assessments).set({ countToGrade: next }).where(eq(assessments.id, id));

    if (next) {
      if (a.status === "published") await ensureGradeItem(schoolId, a);
    } else {
      // Tidak dihitung → lepas item nilai tertaut.
      await db.delete(gradeItems).where(eq(gradeItems.assessmentId, id));
    }
  });
  revalidatePath(`/guru/kuis/${id}`);
}

export type QuestionState = { error: string } | undefined;

const questionSchema = z.object({
  assessmentId: z.string().uuid(),
  type: z.enum(["mc", "essay"]),
  text: z.string().min(2, "Tulis pertanyaan dulu."),
  points: z.coerce.number().int().min(1).max(100),
});

export async function addQuestion(
  _prev: QuestionState,
  formData: FormData,
): Promise<QuestionState> {
  const { schoolId, teacherId } = await requireTeacher();
  const parsed = questionSchema.safeParse({
    assessmentId: formData.get("assessmentId"),
    type: formData.get("type"),
    text: formData.get("text"),
    points: formData.get("points"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  let options: string[] | null = null;
  let correctIndex: number | null = null;

  if (parsed.data.type === "mc") {
    options = [0, 1, 2, 3]
      .map((i) => String(formData.get(`option_${i}`) || "").trim())
      .filter(Boolean);
    if (options.length < 2) return { error: "Pilihan ganda butuh minimal 2 opsi." };
    correctIndex = Number(formData.get("correctIndex"));
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
      return { error: "Tandai jawaban benar yang valid." };
    }
  }

  return withTenant(schoolId, async (): Promise<QuestionState> => {
    const [owned] = await db
      .select({ id: assessments.id, teacherId: assessments.teacherId, classId: assessments.classId })
      .from(assessments)
      .where(and(eq(assessments.id, parsed.data.assessmentId), eq(assessments.schoolId, schoolId)))
      .limit(1);
    if (!owned) return { error: "Kuis tidak ditemukan." };
    // A2: hanya pembuat / pengampu kelas yang boleh menambah soal.
    const allowed =
      owned.teacherId === teacherId ||
      (owned.classId ? await teacherTeachesClass(schoolId, teacherId, owned.classId) : false);
    if (!allowed) return { error: "Anda tidak berhak mengubah kuis ini." };

    const count = await db.$count(
      questions,
      eq(questions.assessmentId, parsed.data.assessmentId),
    );

    // Lampiran gambar soal (opsional).
    let imageUrl: string | null = null;
    const image = formData.get("image");
    if (image instanceof File && image.size > 0) {
      const stored = await uploadFile({
        schoolId,
        ownerId: teacherId,
        file: image,
        kind: "image",
        prefix: "questions",
        maxBytes: 10_000_000,
      });
      imageUrl = stored.url;
    }

    await db.insert(questions).values({
      schoolId,
      assessmentId: parsed.data.assessmentId,
      type: parsed.data.type,
      text: parsed.data.text,
      imageUrl,
      options,
      correctIndex,
      points: parsed.data.points,
      sortOrder: count,
    });
    revalidatePath(`/guru/kuis/${parsed.data.assessmentId}`);
    return undefined;
  });
}

/* ============================================================
 * Pembuat soal dengan AI (Gemini)
 * Alur hemat waktu guru: isi topik (atau unggah bahan referensi)
 * → AI mengembalikan DRAF soal tanpa menyimpan → guru memeriksa &
 * menyunting → simpan massal sekali klik. Kuota AI ditegakkan dan
 * tiap generate dicatat sebagai pemakaian "quiz.generate".
 * ============================================================ */

export type DraftQuestion = {
  type: "mc" | "essay";
  text: string;
  options: string[] | null;
  correctIndex: number | null;
  points: number;
};

const MAX_AI_QUESTIONS = 20;
const MAX_SAVE_QUESTIONS = 40;

/** Rapikan satu elemen (hasil AI / kiriman form) menjadi draf soal valid, atau null. */
function sanitizeDraft(v: unknown): DraftQuestion | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const type = o.type === "mc" || o.type === "essay" ? o.type : null;
  const text = typeof o.text === "string" ? o.text.trim().slice(0, 2000) : "";
  if (!type || text.length < 2) return null;

  const rawPoints = Number(o.points);
  const points = Number.isFinite(rawPoints)
    ? Math.max(1, Math.min(100, Math.trunc(rawPoints)))
    : type === "mc"
      ? 1
      : 5;

  if (type === "essay") {
    return { type, text, options: null, correctIndex: null, points };
  }

  const options = Array.isArray(o.options)
    ? o.options
        .map((x) => String(x ?? "").trim().slice(0, 500))
        .filter(Boolean)
        .slice(0, 6)
    : [];
  if (options.length < 2) return null;
  const ci = Number(o.correctIndex);
  if (!Number.isInteger(ci) || ci < 0 || ci >= options.length) return null;
  return { type, text, options, correctIndex: ci, points };
}

/** Ambil JSON array dari balasan AI (toleran terhadap pagar markdown/teks pengantar). */
function parseAiQuestions(raw: string): DraftQuestion[] {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end <= start) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.map(sanitizeDraft).filter((q): q is DraftQuestion => q !== null);
}

/** Draf soal contoh untuk mode demo (kunci AI belum dipasang). */
function demoQuestions(topic: string, mcCount: number, essayCount: number): DraftQuestion[] {
  const items: DraftQuestion[] = [];
  for (let i = 0; i < mcCount; i++) {
    items.push({
      type: "mc",
      text: `(Contoh demo ${i + 1}) Pertanyaan pilihan ganda tentang "${topic}". Pasang kunci AI (GEMINI_API_KEY) untuk soal sungguhan.`,
      options: ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
      correctIndex: i % 4,
      points: 1,
    });
  }
  for (let i = 0; i < essayCount; i++) {
    items.push({
      type: "essay",
      text: `(Contoh demo) Jelaskan secara singkat apa yang kamu ketahui tentang "${topic}".`,
      options: null,
      correctIndex: null,
      points: 5,
    });
  }
  return items;
}

/**
 * Minta Gemini menyusun draf soal. TIDAK menyimpan apa pun hasil dikembalikan
 * ke form agar guru memeriksa & menyunting dulu. Bahan referensi opsional:
 * teks tempel dan/atau berkas (PDF/DOCX/gambar/teks, dibaca via fileToPart).
 */
export async function generateQuestionsAi(formData: FormData): Promise<{
  items?: DraftQuestion[];
  fromKnowledge?: boolean;
  error?: string;
}> {
  const { schoolId, teacherId } = await requireTeacher();
  const assessmentId = String(formData.get("assessmentId") ?? "");
  if (!z.string().uuid().safeParse(assessmentId).success) return { error: "Kuis tidak valid." };

  const topic = String(formData.get("topic") ?? "").trim();
  const sourceText = String(formData.get("sourceText") ?? "").trim();
  const file = formData.get("sourceFile");
  const hasFile = file instanceof File && file.size > 0;
  // Tanpa bahan referensi, AI mengarang dari pengetahuannya butuh topik sebagai pijakan.
  const fromKnowledge = !sourceText && !hasFile;
  if (fromKnowledge && !topic) {
    return { error: "Isi Topik dulu atau unggah bahan referensi." };
  }

  const count = Math.min(MAX_AI_QUESTIONS, Math.max(1, Math.trunc(Number(formData.get("count")) || 5)));
  const kindRaw = String(formData.get("kind") ?? "mc");
  const kind = ["mc", "essay", "mix"].includes(kindRaw) ? kindRaw : "mc";
  const diffRaw = String(formData.get("difficulty") ?? "sedang");
  const difficulty = ["mudah", "sedang", "sulit", "campuran"].includes(diffRaw) ? diffRaw : "sedang";
  const level = String(formData.get("level") ?? "SMP").trim() || "SMP";

  // Campuran ≈ sepertiga esai (esai menambah beban koreksi manual guru).
  const essayCount = kind === "essay" ? count : kind === "mix" ? Math.max(1, Math.floor(count / 3)) : 0;
  const mcCount = count - essayCount;

  try {
    return await withTenant(schoolId, async () => {
      const a = await ownAssessment(schoolId, teacherId, assessmentId); // A2
      await assertAiQuota(schoolId);

      const [subj] = a.subjectId
        ? await db
            .select({ name: subjects.name })
            .from(subjects)
            .where(and(eq(subjects.id, a.subjectId), eq(subjects.schoolId, schoolId)))
            .limit(1)
        : [];

      if (!isAiConfigured()) {
        return { items: demoQuestions(topic || subj?.name || a.title, mcCount, essayCount), fromKnowledge };
      }

      const composition = [
        mcCount > 0 && `${mcCount} soal pilihan ganda`,
        essayCount > 0 && `${essayCount} soal esai`,
      ]
        .filter(Boolean)
        .join(" dan ");

      const instruction = [
        fromKnowledge
          ? "Kamu asisten guru. TIDAK ada bahan referensi susun soal dari pengetahuanmu sendiri. Berpegang pada materi standar kurikulum sekolah di Indonesia untuk jenjang yang diminta, dan JANGAN memakai fakta, angka, atau nama yang tidak kamu yakini kebenarannya."
          : "Kamu asisten guru. Susun soal BERDASARKAN BAHAN REFERENSI yang diberikan jangan keluar dari cakupan bahan itu.",
        `Mata pelajaran: ${subj?.name ?? "umum"}${topic ? `. Topik: ${topic}` : ""}.`,
        `Sasaran jenjang: ${level}. Sesuaikan kedalaman & bahasa untuk jenjang itu.`,
        `Tingkat kesulitan: ${difficulty}.`,
        `Buat TEPAT ${composition}${mcCount > 0 && essayCount > 0 ? " (pilihan ganda dulu, esai di akhir)" : ""}.`,
        "",
        "FORMAT WAJIB: balas HANYA dengan JSON array valid tanpa penjelasan, tanpa markdown, tanpa pagar kode.",
        `Elemen pilihan ganda: {"type":"mc","text":"...","options":["...","...","...","..."],"correctIndex":0,"points":1}`,
        `Elemen esai: {"type":"essay","text":"...","points":5}`,
        "Aturan:",
        "- Pilihan ganda: TEPAT 4 opsi, hanya satu jawaban benar (correctIndex 0-3), pengecoh masuk akal, dan posisi jawaban benar bervariasi antar soal.",
        "- Poin: pilihan ganda 1-2, esai 5-10, sebanding bobot kesulitannya.",
        "- Tiap soal harus mandiri: jangan merujuk 'bahan di atas', nomor halaman, atau soal lain.",
        "- Semua dalam Bahasa Indonesia yang baik dan ramah siswa.",
      ]
        .filter(Boolean)
        .join("\n");

      const parts: GeminiPart[] = [{ text: instruction }];
      if (sourceText) parts.push({ text: `BAHAN REFERENSI (teks):\n${sourceText}` });
      if (hasFile) {
        const part = await fileToPart(file);
        if ("error" in part) return { error: part.error };
        parts.push(part);
      }

      const out = await generateFromParts(parts);
      if (!out) return { error: "AI tidak mengembalikan hasil. Coba lagi." };
      const items = parseAiQuestions(out).slice(0, MAX_AI_QUESTIONS);
      if (items.length === 0) {
        return { error: "Hasil AI tidak bisa dibaca. Coba lagi atau perjelas topiknya." };
      }
      await recordAiUsage(schoolId, teacherId, "quiz.generate");
      return { items, fromKnowledge };
    });
  } catch (e) {
    console.error("[quiz-ai] EXCEPTION:", e);
    return { error: e instanceof Error ? e.message : "Gagal membuat soal." };
  }
}

export type SaveGeneratedState = { error?: string; ok?: boolean; saved?: number } | undefined;

/** Simpan massal draf soal hasil AI (setelah diperiksa/disunting guru). */
export async function saveGeneratedQuestions(
  _prev: SaveGeneratedState,
  formData: FormData,
): Promise<SaveGeneratedState> {
  const { schoolId, teacherId } = await requireTeacher();
  const assessmentId = String(formData.get("assessmentId") ?? "");
  if (!z.string().uuid().safeParse(assessmentId).success) return { error: "Kuis tidak valid." };

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Data soal tidak valid." };
  }
  if (!Array.isArray(raw) || raw.length === 0) return { error: "Tidak ada soal untuk disimpan." };
  if (raw.length > MAX_SAVE_QUESTIONS) return { error: `Maksimal ${MAX_SAVE_QUESTIONS} soal sekali simpan.` };

  const items: DraftQuestion[] = [];
  for (let i = 0; i < raw.length; i++) {
    const q = sanitizeDraft(raw[i]);
    if (!q) {
      return {
        error: `Soal #${i + 1} belum lengkap teks minimal 2 karakter; pilihan ganda butuh ≥2 opsi terisi dan jawaban benar yang ditandai.`,
      };
    }
    items.push(q);
  }

  return withTenant(schoolId, async (): Promise<SaveGeneratedState> => {
    await ownAssessment(schoolId, teacherId, assessmentId); // A2
    const existing = await db.$count(questions, eq(questions.assessmentId, assessmentId));
    await db.insert(questions).values(
      items.map((q, i) => ({
        schoolId,
        assessmentId,
        type: q.type,
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        points: q.points,
        sortOrder: existing + i,
      })),
    );
    revalidatePath(`/guru/kuis/${assessmentId}`);
    return { ok: true, saved: items.length };
  });
}

export async function deleteQuestion(formData: FormData) {
  const { schoolId, teacherId } = await requireTeacher();
  const id = z.string().uuid().parse(formData.get("id"));
  const assessmentId = z.string().uuid().parse(formData.get("assessmentId"));
  const removed = await withTenant(schoolId, async () => {
    await ownAssessment(schoolId, teacherId, assessmentId); // A2
    const [row] = await db
      .select({ imageUrl: questions.imageUrl })
      .from(questions)
      .where(and(eq(questions.id, id), eq(questions.schoolId, schoolId)))
      .limit(1);
    await db
      .delete(questions)
      .where(and(eq(questions.id, id), eq(questions.schoolId, schoolId)));
    return row;
  });
  if (removed?.imageUrl) await deleteFile(removed.imageUrl);
  revalidatePath(`/guru/kuis/${assessmentId}`);
}
