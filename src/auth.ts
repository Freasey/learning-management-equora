import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { and, eq, or } from "drizzle-orm";
import { db, schools, users } from "@/db";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Email / Username" },
        password: { label: "Kata sandi", type: "password" },
        schoolCode: { label: "Kode sekolah" },
      },
      async authorize(credentials) {
        const identifier = credentials?.identifier as string | undefined;
        const password = credentials?.password as string | undefined;
        const schoolCode = (credentials?.schoolCode as string | undefined)
          ?.trim()
          .toUpperCase();
        if (!identifier || !password) return null;

        let user;
        if (schoolCode) {
          // Jalur siswa: NIS unik PER sekolah, jadi wajib disempitkan lewat
          // kode sekolah agar tidak ambigu saat NIS sama di sekolah berbeda.
          const [school] = await db
            .select({ id: schools.id })
            .from(schools)
            .where(eq(schools.code, schoolCode))
            .limit(1);
          if (!school) return null;

          [user] = await db
            .select()
            .from(users)
            .where(
              and(
                eq(users.schoolId, school.id),
                or(eq(users.username, identifier), eq(users.email, identifier)),
              ),
            )
            .limit(1);
        } else {
          // Jalur guru/admin: login pakai email (unik global).
          [user] = await db
            .select()
            .from(users)
            .where(or(eq(users.email, identifier), eq(users.username, identifier)))
            .limit(1);
        }

        if (!user || user.status !== "active") return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email ?? undefined,
          role: user.role,
          schoolId: user.schoolId,
        };
      },
    }),
  ],
});
