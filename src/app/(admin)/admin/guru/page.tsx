import { redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, users, memberships } from "@/db";
import { getSchoolPlan, countRole } from "@/lib/quota";
import { parseRoles } from "@/lib/membership";
import { quotaLabel, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PageHeader, Field, RowAction, Th, EmptyRow } from "@/components/admin/ui";
import { addTeacher, setTeacherStatus, deleteTeacher, toggleMemberRole } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Guru · Admin Sekolah" };

export default async function GuruPage() {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  const myId = session?.user?.id;
  if (!schoolId) redirect("/super");

  const [rows, plan, used, myMembership] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        createdAt: users.createdAt,
        roles: memberships.roles,
      })
      .from(users)
      .leftJoin(
        memberships,
        and(eq(memberships.userId, users.id), eq(memberships.schoolId, schoolId)),
      )
      .where(and(eq(users.schoolId, schoolId), eq(users.role, "teacher")))
      .orderBy(asc(users.name)),
    getSchoolPlan(schoolId),
    countRole(schoolId, "teacher"),
    myId
      ? db
          .select({ roles: memberships.roles })
          .from(memberships)
          .where(and(eq(memberships.userId, myId), eq(memberships.schoolId, schoolId)))
          .limit(1)
      : Promise.resolve([]),
  ]);

  const quota = plan?.quotaTeachers ?? null;
  // Apakah admin yang login sudah mengaktifkan "saya juga mengajar"?
  const iTeach = parseRoles(myMembership[0]?.roles).includes("teacher");

  return (
    <div>
      <PageHeader title="Manajemen Guru" description="Kelola akun guru sekolah.">
        <span className="rounded-lg border border-line bg-sand/50 px-4 py-2 font-mono text-xs text-muted">
          {used} / {quotaLabel(quota)} guru
        </span>
      </PageHeader>

      {/* Admin yang juga ingin mengajar */}
      {myId && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-sand/30 p-4">
          <div>
            <p className="font-medium text-ink">Anda juga mengajar?</p>
            <p className="text-sm text-muted">
              Aktifkan agar Anda muncul sebagai pengajar (bisa di-assign di Jadwal
              & memakai area Guru). Berlaku setelah keluar lalu masuk lagi.
            </p>
          </div>
          <form action={toggleMemberRole}>
            <input type="hidden" name="userId" value={myId} />
            <input type="hidden" name="role" value="teacher" />
            <button
              type="submit"
              className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
                iTeach
                  ? "border-teal-700 bg-teal-700 text-paper hover:opacity-90"
                  : "border-line text-teal-700 hover:bg-teal-700 hover:text-paper"
              }`}
            >
              {iTeach ? "✓ Saya mengajar" : "Aktifkan mengajar"}
            </button>
          </form>
        </div>
      )}

      <form
        action={addTeacher}
        className="mb-8 rounded-xl border border-line bg-paper p-5"
      >
        <h2 className="mb-4 font-display text-lg font-medium text-ink">
          Tambah guru
        </h2>
        <div className="grid items-end gap-4 md:grid-cols-[2fr_2fr_1.5fr_auto]">
          <Field label="Nama" name="name" required placeholder="Nama guru" />
          <Field label="Email" name="email" type="email" required placeholder="guru@sekolah.sch.id" />
          <Field label="Kata sandi" name="password" type="password" required placeholder="min. 8 karakter" />
          <Button type="submit" variant="accent" size="md">
            Tambah
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-line bg-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-sand/40">
              <Th>Nama</Th>
              <Th>Email</Th>
              <Th>Status</Th>
              <Th>Peran</Th>
              <Th>Bergabung</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyRow colSpan={6} text="Belum ada guru." />
            ) : (
              rows.map((t) => {
                const isCoAdmin = parseRoles(t.roles).includes("school_admin");
                return (
                <tr key={t.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{t.name}</td>
                  <td className="px-4 py-3 text-ink">{t.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase ${
                        t.status === "active"
                          ? "bg-teal-700/10 text-teal-700"
                          : "bg-sand-deep text-ink"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggleMemberRole}>
                      <input type="hidden" name="userId" value={t.id} />
                      <input type="hidden" name="role" value="school_admin" />
                      <button
                        type="submit"
                        title={
                          isCoAdmin
                            ? "Cabut akses admin"
                            : "Jadikan juga admin sekolah"
                        }
                        className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase transition-colors ${
                          isCoAdmin
                            ? "border-teal-700 bg-teal-700/10 text-teal-700 hover:bg-teal-700 hover:text-paper"
                            : "border-line text-muted hover:border-teal-700 hover:text-teal-700"
                        }`}
                      >
                        {isCoAdmin ? "✓ co-admin" : "+ co-admin"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {formatDate(t.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <form action={setTeacherStatus}>
                        <input type="hidden" name="id" value={t.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={t.status === "active" ? "suspended" : "active"}
                        />
                        <RowAction>
                          {t.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                        </RowAction>
                      </form>
                      <form action={deleteTeacher}>
                        <input type="hidden" name="id" value={t.id} />
                        <RowAction danger>Hapus</RowAction>
                      </form>
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
