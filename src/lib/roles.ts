export type Role = "super_admin" | "school_admin" | "teacher" | "student";

/** Halaman tujuan default tiap peran setelah login. */
export function roleHome(role?: string | null): string {
  switch (role) {
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
