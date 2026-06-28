import {
  and,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  ne,
  or,
  sql,
} from "drizzle-orm";
import {
  db,
  withTenant,
  chatMessages,
  chatReads,
  classSubjects,
  classes,
  subjects,
  enrollments,
  users,
} from "@/db";

export type ChatGroup = {
  id: string; // = classSubjects.id
  className: string;
  subjectName: string;
  label: string; // "VII-A — Fisika"
  unread: number;
};

export type ChatMessageView = {
  id: string;
  senderId: string | null;
  senderName: string;
  body: string;
  createdAt: string; // ISO
  mine: boolean;
};

/**
 * Apakah `userId` anggota grup (= satu baris class_subjects) sesuai perannya?
 * Guru = pengampu baris itu; siswa = terdaftar (enrollments) di kelasnya.
 * Asumsi dipanggil DI DALAM withTenant (konteks sekolah aktif).
 */
export async function isGroupMemberInTx(
  groupId: string,
  userId: string,
  role: "teacher" | "student",
): Promise<boolean> {
  if (role === "teacher") {
    const [row] = await db
      .select({ id: classSubjects.id })
      .from(classSubjects)
      .where(and(eq(classSubjects.id, groupId), eq(classSubjects.teacherId, userId)))
      .limit(1);
    return !!row;
  }
  const [row] = await db
    .select({ id: classSubjects.id })
    .from(classSubjects)
    .innerJoin(enrollments, eq(enrollments.classId, classSubjects.classId))
    .where(and(eq(classSubjects.id, groupId), eq(enrollments.studentId, userId)))
    .limit(1);
  return !!row;
}

/** Daftar grup + jumlah belum-terbaca untuk seorang user. Membungkus withTenant. */
export async function getUserGroups(
  schoolId: string,
  userId: string,
  role: "teacher" | "student",
): Promise<ChatGroup[]> {
  return withTenant(schoolId, async () => {
    const base = db
      .select({
        id: classSubjects.id,
        className: classes.name,
        subjectName: subjects.name,
      })
      .from(classSubjects)
      .innerJoin(
        classes,
        and(eq(classes.id, classSubjects.classId), isNull(classes.deletedAt)),
      )
      .innerJoin(
        subjects,
        and(eq(subjects.id, classSubjects.subjectId), isNull(subjects.deletedAt)),
      );

    const rows =
      role === "teacher"
        ? await base.where(
            and(
              eq(classSubjects.schoolId, schoolId),
              eq(classSubjects.teacherId, userId),
            ),
          )
        : await base
            .innerJoin(
              enrollments,
              and(
                eq(enrollments.classId, classSubjects.classId),
                eq(enrollments.studentId, userId),
              ),
            )
            .where(eq(classSubjects.schoolId, schoolId));

    const groups = rows.map((r) => ({
      id: r.id,
      className: r.className,
      subjectName: r.subjectName,
      label: `${r.className} — ${r.subjectName}`,
      unread: 0,
    }));

    if (groups.length === 0) return groups;

    const ids = groups.map((g) => g.id);
    const counts = await db
      .select({
        groupId: chatMessages.classSubjectId,
        cnt: sql<number>`count(*)::int`,
      })
      .from(chatMessages)
      .leftJoin(
        chatReads,
        and(
          eq(chatReads.classSubjectId, chatMessages.classSubjectId),
          eq(chatReads.userId, userId),
        ),
      )
      .where(
        and(
          inArray(chatMessages.classSubjectId, ids),
          ne(chatMessages.senderId, userId),
          or(
            isNull(chatReads.lastReadAt),
            gt(chatMessages.createdAt, chatReads.lastReadAt),
          ),
        ),
      )
      .groupBy(chatMessages.classSubjectId);

    const unreadMap = new Map(counts.map((c) => [c.groupId, c.cnt]));
    for (const g of groups) g.unread = unreadMap.get(g.id) ?? 0;

    // Urutkan: yang ada pesan belum dibaca dulu, lalu alfabet.
    groups.sort((a, b) => b.unread - a.unread || a.label.localeCompare(b.label));
    return groups;
  });
}

/** Ambil ~100 pesan terakhir sebuah grup (urut lama→baru). Asumsi dalam withTenant. */
export async function getGroupMessagesInTx(
  groupId: string,
  userId: string,
): Promise<ChatMessageView[]> {
  const rows = await db
    .select({
      id: chatMessages.id,
      senderId: chatMessages.senderId,
      senderName: users.name,
      body: chatMessages.body,
      createdAt: chatMessages.createdAt,
    })
    .from(chatMessages)
    .leftJoin(users, eq(users.id, chatMessages.senderId))
    .where(eq(chatMessages.classSubjectId, groupId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(100);

  return rows
    .reverse()
    .map((r) => ({
      id: r.id,
      senderId: r.senderId,
      senderName: r.senderName ?? "Pengguna",
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      mine: r.senderId === userId,
    }));
}
