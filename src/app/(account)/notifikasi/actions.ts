"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, notifications } from "@/db";
import { auth } from "@/auth";

async function currentUserId() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("Tidak diizinkan.");
  return id;
}

export async function markAllRead() {
  const userId = await currentUserId();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  revalidatePath("/notifikasi");
}

export async function markRead(formData: FormData) {
  const userId = await currentUserId();
  const id = z.string().uuid().parse(formData.get("id"));
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  revalidatePath("/notifikasi");
}
