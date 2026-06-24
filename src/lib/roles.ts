export type Role = "super_admin" | "school_admin" | "teacher" | "student";

/** Ringkasan satu workspace (sekolah/personal) yang dimiliki user. */
export type WorkspaceMembership = {
  schoolId: string;
  schoolName: string;
  type: string; // school | personal
  roles: string[];
  isOwner: boolean;
};

/**
 * Peran "utama" dari sekumpulan peran, untuk menentukan dashboard tujuan.
 * Urutan: super_admin > teacher > school_admin > student.
 * Catatan: teacher diprioritaskan di atas school_admin agar pemilik workspace
 * personal (school_admin + teacher) mendarat di area Mengajar (/guru); ia tetap
 * bisa membuka /admin untuk mengelola kelasnya.
 */
export function primaryRole(roles: string[]): string {
  if (roles.includes("super_admin")) return "super_admin";
  if (roles.includes("teacher")) return "teacher";
  if (roles.includes("school_admin")) return "school_admin";
  if (roles.includes("student")) return "student";
  return roles[0] ?? "";
}

/** Halaman tujuan default setelah login, berdasarkan kumpulan peran aktif. */
export function roleHome(roles?: string[] | string | null): string {
  const list = Array.isArray(roles) ? roles : roles ? [roles] : [];
  switch (primaryRole(list)) {
    case "super_admin":
      return "/super";
    case "school_admin":
      return "/admin";
    case "teacher":
      return "/guru";
    case "student":
      return "/siswa";
    default:
      return "/";
  }
}
