"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { requireStudent } from "@/lib/auth-guard";

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
