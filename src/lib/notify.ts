import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db, notifications } from "@/db";

type NotifInput = {
  userId: string;
  schoolId?: string | null;
  type?: string;
  title: string;
  body?: string;
  href?: string | null;
};

/** Kirim satu notifikasi. Tak pernah melempar (jangan gagalkan aksi utama). */
export async function notify(n: NotifInput) {
  try {
    await db.insert(notifications).values({
      userId: n.userId,
      schoolId: n.schoolId ?? null,
      type: n.type ?? "info",
      title: n.title,
      body: n.body ?? "",
      href: n.href ?? null,
    });
  } catch (err) {
    console.error("notify gagal:", err);
  }
}

/** Kirim notifikasi sama ke banyak penerima sekaligus. */
export async function notifyMany(userIds: string[], n: Omit<NotifInput, "userId">) {
  if (userIds.length === 0) return;
  try {
    await db.insert(notifications).values(
      userIds.map((userId) => ({
        userId,
        schoolId: n.schoolId ?? null,
        type: n.type ?? "info",
        title: n.title,
        body: n.body ?? "",
        href: n.href ?? null,
      })),
    );
  } catch (err) {
    console.error("notifyMany gagal:", err);
  }
}

/** Jumlah notifikasi belum dibaca milik user (untuk badge lonceng). */
export async function unreadCount(userId: string | undefined): Promise<number> {
  if (!userId) return 0;
  const [row] = await db
    .select({ n: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return row?.n ?? 0;
}

/** Daftar notifikasi terbaru milik user. */
export function listNotifications(userId: string, limit = 50) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}
