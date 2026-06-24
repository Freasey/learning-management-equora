"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, subjects, curriculumSubjects } from "@/db";
import { requireSchoolAdmin } from "@/lib/auth-guard";
import { subjectCode } from "@/lib/ids";

function parseKkm(raw: FormDataEntryValue | null): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? Math.trunc(n) : 75;
}

export async function adoptCatalogSubjects(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const ids = formData.getAll("catalogIds").map(String).filter(Boolean);
  if (ids.length === 0) throw new Error("Pilih minimal satu mata pelajaran.");

  const existing = await db
    .select({ catalogId: subjects.catalogId })
    .from(subjects)
    .where(and(eq(subjects.schoolId, schoolId), isNull(subjects.deletedAt)));
  const taken = new Set(existing.map((e) => e.catalogId).filter(Boolean));

  const cats = await db
    .select()
    .from(curriculumSubjects)
    .where(inArray(curriculumSubjects.id, ids));

  const toInsert = cats
    .filter((c) => !taken.has(c.id))
    .map((c) => {
      const code = String(formData.get(`code_${c.id}`) || "").trim();
      return {
        schoolId,
        name: c.name,
        code: code || subjectCode(c.name),
        kkm: parseKkm(formData.get(`kkm_${c.id}`)),
        source: "catalog" as const,
        catalogId: c.id,
      };
    });

  if (toInsert.length) await db.insert(subjects).values(toInsert);
  revalidatePath("/admin/mapel");
}

const customSchema = z.object({
  name: z.string().min(2, "Nama mapel minimal 2 karakter"),
  code: z.string().optional().or(z.literal("")),
  kkm: z.coerce.number().int().min(0).max(100),
});

export async function addCustomSubject(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const parsed = customSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    kkm: formData.get("kkm"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);

  await db.insert(subjects).values({
    schoolId,
    name: parsed.data.name,
    code: parsed.data.code?.trim() || subjectCode(parsed.data.name),
    kkm: parsed.data.kkm,
    source: "custom",
  });
  revalidatePath("/admin/mapel");
}

export async function deleteSubject(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  await db
    .update(subjects)
    .set({ deletedAt: new Date() })
    .where(and(eq(subjects.id, id), eq(subjects.schoolId, schoolId)));
  revalidatePath("/admin/mapel");
}
