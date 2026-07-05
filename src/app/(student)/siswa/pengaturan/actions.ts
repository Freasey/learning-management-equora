"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { requireStudent } from "@/lib/auth-guard";
import {
  isColorVisionKey,
  isDisabilityKey,
  sanitizeDisabilities,
} from "@/lib/accessibility";

/** Nyalakan/matikan satu kebutuhan khusus (kunci dikirim lewat form). */
export async function toggleDisability(formData: FormData) {
  const { studentId } = await requireStudent();
  const key = String(formData.get("key") ?? "");
  if (!isDisabilityKey(key)) return;

  const [u] = await db
    .select({ disabilities: users.disabilities })
    .from(users)
    .where(eq(users.id, studentId))
    .limit(1);
  const current = sanitizeDisabilities(u?.disabilities);
  const next = current.includes(key)
    ? current.filter((k) => k !== key)
    : [...current, key];

  await db
    .update(users)
    .set({ disabilities: next, updatedAt: new Date() })
    .where(eq(users.id, studentId));
  revalidatePath("/siswa/pengaturan");
}

/** Pilih Mode Warna buta warna; "normal" = kembali ke warna biasa. */
export async function setColorVision(formData: FormData) {
  const { studentId } = await requireStudent();
  const mode = String(formData.get("mode") ?? "");
  if (mode !== "normal" && !isColorVisionKey(mode)) return;

  await db
    .update(users)
    .set({ colorVision: mode === "normal" ? null : mode, updatedAt: new Date() })
    .where(eq(users.id, studentId));
  // Warna dipakai di seluruh area siswa (layout), jadi segarkan semuanya.
  revalidatePath("/siswa", "layout");
}
