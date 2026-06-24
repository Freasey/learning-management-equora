import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { and, eq, or } from "drizzle-orm";
import { db, schools, users, memberships } from "@/db";
import { authConfig } from "@/auth.config";
import { primaryRole, type WorkspaceMembership } from "@/lib/roles";
import {
  isLoginBlocked,
  recordLoginFailure,
  clearLoginAttempts,
  logAudit,
} from "@/lib/audit";

/**
 * Susun daftar workspace + konteks aktif untuk sebuah user.
 *
 * - Bila user punya baris `memberships` → itulah sumber kebenaran.
 * - Bila tidak → sintesis SATU workspace dari users.schoolId + users.role
 *   (kompatibel mundur: alur lama single-workspace tetap jalan tanpa
 *   harus membuat baris membership).
 */
async function loadWorkspaces(user: typeof users.$inferSelect): Promise<{
  list: WorkspaceMembership[];
  activeSchoolId: string | null;
}> {
  // super_admin lintas-sekolah — tidak terikat workspace.
  if (user.role === "super_admin") {
    return { list: [], activeSchoolId: null };
  }

  const rows = await db
    .select({
      schoolId: memberships.schoolId,
      roles: memberships.roles,
      isOwner: memberships.isOwner,
      status: memberships.status,
      schoolName: schools.name,
      schoolType: schools.type,
    })
    .from(memberships)
    .innerJoin(schools, eq(schools.id, memberships.schoolId))
    .where(and(eq(memberships.userId, user.id), eq(memberships.status, "active")));

  let list: WorkspaceMembership[];
  if (rows.length > 0) {
    list = rows.map((r) => ({
      schoolId: r.schoolId,
      schoolName: r.schoolName,
      type: r.schoolType,
      roles: r.roles.split(",").map((s) => s.trim()).filter(Boolean),
      isOwner: r.isOwner,
    }));
  } else if (user.schoolId) {
    // Fallback: workspace tunggal dari kolom legacy.
    const [school] = await db
      .select({ name: schools.name, type: schools.type })
      .from(schools)
      .where(eq(schools.id, user.schoolId))
      .limit(1);
    list = [
      {
        schoolId: user.schoolId,
        schoolName: school?.name ?? "Sekolah",
        type: school?.type ?? "school",
        roles: [user.role],
        isOwner: false,
      },
    ];
  } else {
    list = [];
  }

  // Default aktif: workspace yang cocok dengan users.schoolId (home), atau yang pertama.
  const active =
    list.find((m) => m.schoolId === user.schoolId) ?? list[0] ?? null;
  return { list, activeSchoolId: active?.schoolId ?? null };
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
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

        // A9: rate-limit brute-force per identifier (+ kode sekolah bila ada).
        const rlKey = (schoolCode ? `${schoolCode}:` : "") + identifier.toLowerCase();
        if (await isLoginBlocked(rlKey)) return null;

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

        if (!user || user.status !== "active") {
          await recordLoginFailure(rlKey);
          await logAudit({ action: "login.failure", actorLabel: identifier });
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          await recordLoginFailure(rlKey);
          await logAudit({
            action: "login.failure",
            actorLabel: identifier,
            schoolId: user.schoolId,
          });
          return null;
        }

        await clearLoginAttempts(rlKey);

        const { list, activeSchoolId } = await loadWorkspaces(user);
        const active = list.find((m) => m.schoolId === activeSchoolId) ?? null;
        const roles = active?.roles ?? [user.role];

        await logAudit({
          action: "login.success",
          actorId: user.id,
          actorLabel: user.email ?? user.username,
          schoolId: activeSchoolId,
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email ?? undefined,
          role: primaryRole(roles),
          roles,
          schoolId: activeSchoolId,
          activeSchoolId,
          memberships: list,
        };
      },
    }),
  ],
});
