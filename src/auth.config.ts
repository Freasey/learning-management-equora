import type { NextAuthConfig } from "next-auth";

/**
 * Config dasar yang AMAN untuk edge (middleware): tanpa db / bcrypt.
 * Provider yang butuh node ditambahkan di src/auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/masuk",
  },
  session: { strategy: "jwt" },
  callbacks: {
    // Gerbang depan: dipakai middleware untuk menjaga route.
    authorized({ auth, request }) {
      const role = auth?.user?.role;
      const { pathname } = request.nextUrl;

      if (pathname.startsWith("/super")) {
        return role === "super_admin";
      }
      if (pathname.startsWith("/admin")) {
        return role === "school_admin" || role === "super_admin";
      }
      if (pathname.startsWith("/guru")) {
        return role === "teacher" || role === "super_admin";
      }
      if (pathname.startsWith("/siswa")) {
        return role === "student" || role === "super_admin";
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.schoolId = user.schoolId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub as string) ?? "";
        session.user.role = (token.role as string) ?? "";
        session.user.schoolId = (token.schoolId as string | null) ?? null;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
