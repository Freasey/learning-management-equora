import type { Session } from "next-auth";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { auth } from "@/auth";

/** Kumpulan peran pada workspace aktif (kosong bila belum login). */
function rolesOf(session: Session | null): string[] {
  return session?.user?.roles ?? [];
}

/**
 * A3: pastikan akun masih AKTIF di DB (bukan hanya token JWT lama).
 * Membuat suspend/hapus berlaku langsung tanpa menunggu re-login.
 * Lempar error bila status bukan "active".
 */
export async function assertActiveUser(userId: string | undefined) {
  if (!userId) throw new Error("Tidak diizinkan: sesi tidak valid.");
  const [u] = await db
    .select({ status: users.status })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u || u.status !== "active") {
    throw new Error("Akun Anda tidak aktif. Hubungi admin sekolah.");
  }
}

/** Versi non-throw untuk dipakai di layout (blokir baca). */
export async function isUserActive(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;
  const [u] = await db
    .select({ status: users.status })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return u?.status === "active";
}

/**
 * Pastikan pemanggil adalah super admin. Dipakai di awal setiap server
 * action sensitif (defense in depth — jangan hanya andalkan middleware).
 */
export async function requireSuperAdmin() {
  const session = await auth();
  if (!rolesOf(session).includes("super_admin")) {
    throw new Error("Tidak diizinkan: butuh akses super admin.");
  }
  await assertActiveUser(session?.user?.id);
  return session;
}

/**
 * Pastikan pemanggil punya peran admin sekolah pada workspace AKTIF.
 * Mengembalikan schoolId aktif untuk memfilter data (multi-tenancy).
 */
export async function requireSchoolAdmin() {
  const session = await auth();
  const schoolId = session?.user?.schoolId ?? null;
  if (!rolesOf(session).includes("school_admin") || !schoolId) {
    throw new Error("Tidak diizinkan: butuh akses admin sekolah.");
  }
  await assertActiveUser(session?.user?.id);
  return { session, schoolId };
}

/** Pastikan pemanggil adalah guru pada workspace aktif. Kembalikan schoolId & teacherId. */
export async function requireTeacher() {
  const session = await auth();
  const schoolId = session?.user?.schoolId ?? null;
  if (!rolesOf(session).includes("teacher") || !schoolId || !session?.user?.id) {
    throw new Error("Tidak diizinkan: butuh akses guru.");
  }
  await assertActiveUser(session.user.id);
  return { session, schoolId, teacherId: session.user.id };
}

/** Pastikan pemanggil adalah siswa pada workspace aktif. Kembalikan schoolId & studentId. */
export async function requireStudent() {
  const session = await auth();
  const schoolId = session?.user?.schoolId ?? null;
  if (!rolesOf(session).includes("student") || !schoolId || !session?.user?.id) {
    throw new Error("Tidak diizinkan: butuh akses siswa.");
  }
  await assertActiveUser(session.user.id);
  return { session, schoolId, studentId: session.user.id };
}

/** Pastikan pemanggil adalah orang tua (B8). Kembalikan parentId. */
export async function requireParent() {
  const session = await auth();
  if (!rolesOf(session).includes("parent") || !session?.user?.id) {
    throw new Error("Tidak diizinkan: butuh akses orang tua.");
  }
  await assertActiveUser(session.user.id);
  return { session, parentId: session.user.id };
}
