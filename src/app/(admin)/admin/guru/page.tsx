import { redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, users } from "@/db";
import { getSchoolPlan, countRole } from "@/lib/quota";
import { quotaLabel, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PageHeader, Field, RowAction, Th, EmptyRow } from "@/components/admin/ui";
import { addTeacher, setTeacherStatus, deleteTeacher } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Guru · Admin Sekolah" };

export default async function GuruPage() {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  if (!schoolId) redirect("/super");

  const [rows, plan, used] = await Promise.all([
    db
      .select()
      .from(users)
      .where(and(eq(users.schoolId, schoolId), eq(users.role, "teacher")))
      .orderBy(asc(users.name)),
    getSchoolPlan(schoolId),
    countRole(schoolId, "teacher"),
  ]);

  const quota = plan?.quotaTeachers ?? null;

  return (
    <div>
      <PageHeader title="Manajemen Guru" description="Kelola akun guru sekolah.">
        <span className="rounded-lg border border-line bg-sand/50 px-4 py-2 font-mono text-xs text-muted">
          {used} / {quotaLabel(quota)} guru
        </span>
      </PageHeader>

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
              <Th>Bergabung</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyRow colSpan={5} text="Belum ada guru." />
            ) : (
              rows.map((t) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
