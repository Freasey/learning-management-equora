import type { Session } from "next-auth";
import { auth } from "@/auth";

/** Kumpulan peran pada workspace aktif (kosong bila belum login). */
function rolesOf(session: Session | null): string[] {
  return session?.user?.roles ?? [];
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
  return { session, schoolId };
}

/** Pastikan pemanggil adalah guru pada workspace aktif. Kembalikan schoolId & teacherId. */
export async function requireTeacher() {
  const session = await auth();
  const schoolId = session?.user?.schoolId ?? null;
  if (!rolesOf(session).includes("teacher") || !schoolId || !session?.user?.id) {
    throw new Error("Tidak diizinkan: butuh akses guru.");
  }
  return { session, schoolId, teacherId: session.user.id };
}

/** Pastikan pemanggil adalah siswa pada workspace aktif. Kembalikan schoolId & studentId. */
export async function requireStudent() {
  const session = await auth();
  const schoolId = session?.user?.schoolId ?? null;
  if (!rolesOf(session).includes("student") || !schoolId || !session?.user?.id) {
    throw new Error("Tidak diizinkan: butuh akses siswa.");
  }
  return { session, schoolId, studentId: session.user.id };
}
