import type { NextAuthConfig } from "next-auth";
import { primaryRole, type WorkspaceMembership } from "@/lib/roles";

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
    // Gerbang depan: dipakai middleware untuk menjaga route. Berbasis kumpulan
    // peran pada workspace AKTIF (bukan satu peran), agar pemilik workspace
    // personal (school_admin + teacher) bisa masuk /admin maupun /guru.
    authorized({ auth, request }) {
      const roles = (auth?.user?.roles as string[] | undefined) ?? [];
      const { pathname } = request.nextUrl;

      if (pathname.startsWith("/super")) return roles.includes("super_admin");
      if (pathname.startsWith("/admin"))
        return roles.includes("school_admin") || roles.includes("super_admin");
      if (pathname.startsWith("/guru"))
        return roles.includes("teacher") || roles.includes("super_admin");
      if (pathname.startsWith("/siswa"))
        return roles.includes("student") || roles.includes("super_admin");
      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.roles = user.roles;
        token.schoolId = user.schoolId;
        token.activeSchoolId = user.activeSchoolId;
        token.memberships = user.memberships;
      }

      // Pindah/buat workspace aktif (dipicu switchWorkspace/createWorkspace via
      // unstable_update). Payload berbasis DB; bisa membawa workspace yang belum
      // ada di token (baru dibuat / baru di-join).
      if (trigger === "update" && session && typeof session === "object") {
        const data = session as {
          activeSchoolId?: string;
          activeRoles?: string[];
          activeMembership?: WorkspaceMembership;
        };
        if (data.activeSchoolId) {
          token.activeSchoolId = data.activeSchoolId;
          token.schoolId = data.activeSchoolId;
          if (data.activeRoles) {
            token.roles = data.activeRoles;
            token.role = primaryRole(data.activeRoles);
          }
          if (data.activeMembership) {
            const list =
              (token.memberships as WorkspaceMembership[] | undefined) ?? [];
            token.memberships = list.some(
              (m) => m.schoolId === data.activeSchoolId,
            )
              ? list
              : [...list, data.activeMembership];
          }
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub as string) ?? "";
        session.user.role = (token.role as string) ?? "";
        session.user.roles = (token.roles as string[]) ?? [];
        session.user.schoolId = (token.schoolId as string | null) ?? null;
        session.user.activeSchoolId = (token.activeSchoolId as string | null) ?? null;
        session.user.memberships =
          (token.memberships as WorkspaceMembership[]) ?? [];
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
