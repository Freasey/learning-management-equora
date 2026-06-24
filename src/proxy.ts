import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Next 16: konvensi "proxy" (pengganti "middleware").
// Pakai config edge-safe (tanpa db/bcrypt).
export default NextAuth(authConfig).auth;

export const config = {
  // Jaga area terproteksi (tambah /guru, /siswa di sini nanti).
  matcher: [
    "/super/:path*",
    "/admin/:path*",
    "/guru/:path*",
    "/siswa/:path*",
    "/ortu/:path*",
  ],
};
