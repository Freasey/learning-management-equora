"use server";

import type { Session } from "next-auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, users } from "@/db";
import { assertActiveUser } from "@/lib/auth-guard";
import { uploadFile, deleteFile } from "@/lib/storage";

/** Sekolah konteks untuk menyimpan avatar di akuntansi kuota. */
function contextSchoolId(session: Session | null): string | null {
  return session?.user?.activeSchoolId ?? session?.user?.schoolId ?? null;
}

/** Unggah / ganti foto profil pengguna yang sedang login (guru/siswa/admin). */
export async function updateAvatar(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Sesi tidak valid.");
  await assertActiveUser(userId);

  const schoolId = contextSchoolId(session);
  if (!schoolId) throw new Error("Workspace aktif tidak ditemukan.");

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Pilih berkas gambar.");
  }

  const [current] = await db
    .select({ avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const stored = await uploadFile({
    schoolId,
    ownerId: userId,
    file,
    kind: "avatar",
    prefix: "avatars",
    maxBytes: 5_000_000,
  });

  await db
    .update(users)
    .set({ avatarUrl: stored.url, updatedAt: new Date() })
    .where(eq(users.id, userId));

  if (current?.avatarUrl) await deleteFile(current.avatarUrl);

  revalidatePath("/workspace");
  revalidatePath("/siswa/pengaturan");
}

/** Hapus foto profil. */
export async function removeAvatar() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Sesi tidak valid.");
  await assertActiveUser(userId);

  const [current] = await db
    .select({ avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  await db
    .update(users)
    .set({ avatarUrl: null, updatedAt: new Date() })
    .where(eq(users.id, userId));

  if (current?.avatarUrl) await deleteFile(current.avatarUrl);

  revalidatePath("/workspace");
  revalidatePath("/siswa/pengaturan");
}
