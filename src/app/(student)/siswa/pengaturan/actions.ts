"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { requireStudent } from "@/lib/auth-guard";
import { isDisabilityKey, sanitizeDisabilities } from "@/lib/accessibility";

export async function toggleTts() {
  const { studentId } = await requireStudent();
  const [u] = await db
    .select({ tts: users.ttsEnabled })
    .from(users)
    .where(eq(users.id, studentId))
    .limit(1);
  await db
    .update(users)
    .set({ ttsEnabled: !u?.tts, updatedAt: new Date() })
    .where(eq(users.id, studentId));
  revalidatePath("/siswa/pengaturan");
}

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
