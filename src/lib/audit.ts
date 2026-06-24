import { eq } from "drizzle-orm";
import { db, auditLogs, loginAttempts } from "@/db";

/** Catat satu peristiwa audit. Tidak pernah melempar (audit tak boleh menggagalkan aksi utama). */
export async function logAudit(entry: {
  schoolId?: string | null;
  actorId?: string | null;
  actorLabel?: string | null;
  action: string;
  target?: string | null;
  meta?: Record<string, unknown> | null;
}) {
  try {
    await db.insert(auditLogs).values({
      schoolId: entry.schoolId ?? null,
      actorId: entry.actorId ?? null,
      actorLabel: entry.actorLabel ?? null,
      action: entry.action,
      target: entry.target ?? null,
      meta: entry.meta ?? null,
    });
  } catch (err) {
    console.error("logAudit gagal:", err);
  }
}

// ── Rate-limit login ────────────────────────────────────────────────────────
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 menit
const BLOCK_MS = 15 * 60 * 1000;

/** True bila identifier sedang diblokir karena terlalu banyak gagal. */
export async function isLoginBlocked(identifier: string): Promise<boolean> {
  const [row] = await db
    .select()
    .from(loginAttempts)
    .where(eq(loginAttempts.identifier, identifier))
    .limit(1);
  if (!row?.blockedUntil) return false;
  return row.blockedUntil.getTime() > Date.now();
}

/** Catat satu kegagalan login; set blokir bila melewati ambang. */
export async function recordLoginFailure(identifier: string): Promise<void> {
  const now = Date.now();
  const [row] = await db
    .select()
    .from(loginAttempts)
    .where(eq(loginAttempts.identifier, identifier))
    .limit(1);

  if (!row) {
    await db.insert(loginAttempts).values({ identifier, count: 1, windowStart: new Date() });
    return;
  }

  // Jendela kedaluwarsa → reset hitungan.
  const windowFresh = now - row.windowStart.getTime() < WINDOW_MS;
  const count = windowFresh ? row.count + 1 : 1;
  const windowStart = windowFresh ? row.windowStart : new Date();
  const blockedUntil =
    count >= MAX_ATTEMPTS ? new Date(now + BLOCK_MS) : row.blockedUntil;

  await db
    .update(loginAttempts)
    .set({ count, windowStart, blockedUntil })
    .where(eq(loginAttempts.identifier, identifier));
}

/** Login sukses → bersihkan catatan kegagalan. */
export async function clearLoginAttempts(identifier: string): Promise<void> {
  await db.delete(loginAttempts).where(eq(loginAttempts.identifier, identifier));
}
