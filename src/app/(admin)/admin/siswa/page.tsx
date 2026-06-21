import { redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, users, enrollments, classes } from "@/db";
import { getActiveYear } from "@/lib/academic";
import { getSchoolPlan, countRole } from "@/lib/quota";
import { quotaLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  Field,
  SelectField,
  Textarea,
  RowAction,
  Th,
  EmptyRow,
  inputClass,
} from "@/components/admin/ui";
import {
  addStudent,
  bulkAddStudents,
  setStudentClass,
  deleteStudent,
} from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Siswa · Admin Sekolah" };

export default async function SiswaPage() {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  if (!schoolId) redirect("/super");

  const year = await getActiveYear(schoolId);
  const [rows, plan, used, classList] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        status: users.status,
        className: classes.name,
        classId: enrollments.classId,
      })
      .from(users)
      .leftJoin(enrollments, eq(enrollments.studentId, users.id))
      .leftJoin(classes, eq(classes.id, enrollments.classId))
      .where(and(eq(users.schoolId, schoolId), eq(users.role, "student")))
      .orderBy(asc(users.name)),
    getSchoolPlan(schoolId),
    countRole(schoolId, "student"),
    year
      ? db
          .select()
          .from(classes)
          .where(and(eq(classes.schoolId, schoolId), eq(classes.academicYearId, year.id)))
          .orderBy(asc(classes.name))
      : Promise.resolve([]),
  ]);

  const quota = plan?.quotaStudents ?? null;

  return (
    <div>
      <PageHeader title="Manajemen Siswa" description="Kelola akun & penempatan kelas siswa.">
        <span className="rounded-lg border border-line bg-sand/50 px-4 py-2 font-mono text-xs text-muted">
          {used} / {quotaLabel(quota)} siswa
        </span>
      </PageHeader>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <form action={addStudent} className="rounded-xl border border-line bg-paper p-5">
          <h2 className="mb-4 font-display text-lg font-medium text-ink">
            Tambah siswa
          </h2>
          <div className="space-y-4">
            <Field label="Nama" name="name" required placeholder="Nama siswa" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="NIS / Username" name="username" required placeholder="cth. 1713" />
              <Field label="Kata sandi" name="password" required placeholder="min. 4 karakter" />
            </div>
            <SelectField label="Kelas" name="classId" defaultValue="">
              <option value="">— Tanpa kelas —</option>
              {classList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </SelectField>
            <Button type="submit" variant="accent" size="md">
              Tambah Siswa
            </Button>
          </div>
        </form>

        <form action={bulkAddStudents} className="rounded-xl border border-line bg-paper p-5">
          <h2 className="mb-1 font-display text-lg font-medium text-ink">
            Impor massal
          </h2>
          <p className="mb-4 text-xs text-muted">
            Satu siswa per baris, format: <code>Nama,NIS</code>
          </p>
          <div className="space-y-4">
            <Textarea
              label="Data siswa"
              name="rows"
              rows={5}
              placeholder={"Andi Pratama,1713\nBudi Santoso,1714"}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Kata sandi default"
                name="password"
                defaultValue="siswa12345"
              />
              <SelectField label="Kelas" name="classId" defaultValue="">
                <option value="">— Tanpa kelas —</option>
                {classList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectField>
            </div>
            <Button type="submit" variant="primary" size="md">
              Impor
            </Button>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-sand/40">
              <Th>Nama</Th>
              <Th>NIS</Th>
              <Th>Kelas</Th>
              <Th>Status</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyRow colSpan={5} text="Belum ada siswa." />
            ) : (
              rows.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{s.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink">
                    {s.username}
                  </td>
                  <td className="px-4 py-3">
                    <form action={setStudentClass} className="flex items-center gap-2">
                      <input type="hidden" name="studentId" value={s.id} />
                      <select
                        name="classId"
                        defaultValue={s.classId ?? ""}
                        className={`${inputClass} max-w-[10rem] py-1.5`}
                      >
                        <option value="">— Tanpa kelas —</option>
                        {classList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <RowAction>Simpan</RowAction>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase ${
                        s.status === "active"
                          ? "bg-teal-700/10 text-teal-700"
                          : "bg-accent/15 text-accent"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <form action={deleteStudent}>
                      <input type="hidden" name="id" value={s.id} />
                      <RowAction danger>Hapus</RowAction>
                    </form>
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
