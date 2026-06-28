"use server";

import { auth } from "@/auth";
import { db, withTenant, chatMessages, chatReads } from "@/db";
import { assertActiveUser } from "@/lib/auth-guard";
import {
  isGroupMemberInTx,
  getGroupMessagesInTx,
  type ChatMessageView,
} from "@/lib/chat";

type Caller = {
  schoolId: string;
  userId: string;
  name: string;
  role: "teacher" | "student";
};

/** Identitas + peran chat dari sesi aktif. Lempar bila bukan guru/siswa. */
async function requireChatUser(): Promise<Caller> {
  const session = await auth();
  const u = session?.user;
  const roles = u?.roles ?? [];
  const role: "teacher" | "student" | null = roles.includes("teacher")
    ? "teacher"
    : roles.includes("student")
      ? "student"
      : null;
  if (!u?.id || !u.schoolId || !role) {
    throw new Error("Tidak diizinkan: butuh akses guru atau siswa.");
  }
  await assertActiveUser(u.id);
  return { schoolId: u.schoolId, userId: u.id, name: u.name ?? "Pengguna", role };
}

/** Catat batas-baca grup = sekarang (dipakai saat membuka percakapan). */
export async function markGroupRead(groupId: string): Promise<void> {
  const { schoolId, userId, role } = await requireChatUser();
  await withTenant(schoolId, async () => {
    if (!(await isGroupMemberInTx(groupId, userId, role))) {
      throw new Error("Bukan anggota grup ini.");
    }
    await db
      .insert(chatReads)
      .values({ schoolId, classSubjectId: groupId, userId, lastReadAt: new Date() })
      .onConflictDoUpdate({
        target: [chatReads.classSubjectId, chatReads.userId],
        set: { lastReadAt: new Date() },
      });
  });
}

/** Riwayat pesan grup + tandai terbaca. Dipakai saat memilih grup di klien. */
export async function fetchGroupMessages(groupId: string): Promise<ChatMessageView[]> {
  const { schoolId, userId, role } = await requireChatUser();
  return withTenant(schoolId, async () => {
    if (!(await isGroupMemberInTx(groupId, userId, role))) {
      throw new Error("Bukan anggota grup ini.");
    }
    const msgs = await getGroupMessagesInTx(groupId, userId);
    await db
      .insert(chatReads)
      .values({ schoolId, classSubjectId: groupId, userId, lastReadAt: new Date() })
      .onConflictDoUpdate({
        target: [chatReads.classSubjectId, chatReads.userId],
        set: { lastReadAt: new Date() },
      });
    return msgs;
  });
}

/** Kirim satu pesan ke grup. Mengembalikan baris tersimpan untuk ditampilkan. */
export async function sendChatMessage(
  groupId: string,
  rawBody: string,
): Promise<ChatMessageView> {
  const { schoolId, userId, name, role } = await requireChatUser();
  const body = rawBody.trim();
  if (!body) throw new Error("Pesan kosong.");
  if (body.length > 4000) throw new Error("Pesan terlalu panjang (maks 4000 karakter).");

  return withTenant(schoolId, async () => {
    if (!(await isGroupMemberInTx(groupId, userId, role))) {
      throw new Error("Bukan anggota grup ini.");
    }
    const [row] = await db
      .insert(chatMessages)
      .values({ schoolId, classSubjectId: groupId, senderId: userId, body })
      .returning({ id: chatMessages.id, createdAt: chatMessages.createdAt });

    // Pengirim otomatis "sudah baca" sampai pesannya sendiri.
    await db
      .insert(chatReads)
      .values({ schoolId, classSubjectId: groupId, userId, lastReadAt: row.createdAt })
      .onConflictDoUpdate({
        target: [chatReads.classSubjectId, chatReads.userId],
        set: { lastReadAt: row.createdAt },
      });

    return {
      id: row.id,
      senderId: userId,
      senderName: name,
      body,
      createdAt: row.createdAt.toISOString(),
      mine: true,
    };
  });
}
