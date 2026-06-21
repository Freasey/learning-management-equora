import { auth } from "@/auth";

/**
 * Pastikan pemanggil adalah super admin. Dipakai di awal setiap server
 * action sensitif (defense in depth — jangan hanya andalkan middleware).
 */
export async function requireSuperAdmin() {
  const session = await auth();
  if (session?.user?.role !== "super_admin") {
    throw new Error("Tidak diizinkan: butuh akses super admin.");
  }
  return session;
}

/**
 * Pastikan pemanggil adalah admin sekolah & punya schoolId. Mengembalikan
 * schoolId untuk memfilter data (multi-tenancy).
 */
export async function requireSchoolAdmin() {
  const session = await auth();
  const role = session?.user?.role;
  const schoolId = session?.user?.schoolId ?? null;
  if (role !== "school_admin" || !schoolId) {
    throw new Error("Tidak diizinkan: butuh akses admin sekolah.");
  }
  return { session, schoolId };
}

/** Pastikan pemanggil adalah guru. Kembalikan schoolId & teacherId. */
export async function requireTeacher() {
  const session = await auth();
  const role = session?.user?.role;
  const schoolId = session?.user?.schoolId ?? null;
  if (role !== "teacher" || !schoolId || !session?.user?.id) {
    throw new Error("Tidak diizinkan: butuh akses guru.");
  }
  return { session, schoolId, teacherId: session.user.id };
}

/** Pastikan pemanggil adalah siswa. Kembalikan schoolId & studentId. */
export async function requireStudent() {
  const session = await auth();
  const role = session?.user?.role;
  const schoolId = session?.user?.schoolId ?? null;
  if (role !== "student" || !schoolId || !session?.user?.id) {
    throw new Error("Tidak diizinkan: butuh akses siswa.");
  }
  return { session, schoolId, studentId: session.user.id };
}
