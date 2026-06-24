import Link from "next/link";
import { redirect } from "next/navigation";
import { and, asc, count, eq, isNull } from "drizzle-orm";
import { auth } from "@/auth";
import { db, classes, users, enrollments } from "@/db";
import { getActiveYear } from "@/lib/academic";
import { listWorkspaceTeachers } from "@/lib/membership";
import { Button } from "@/components/ui/button";
import { PageHeader, Field, SelectField, RowAction, Th, EmptyRow } from "@/components/admin/ui";
import { addClass, deleteClass } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kelas · Admin Sekolah" };

export default async function KelasPage() {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  if (!schoolId) redirect("/super");

  const year = await getActiveYear(schoolId);

  if (!year) {
    return (
      <div>
        <PageHeader title="Kelas" />
        <div className="rounded-xl border border-dashed border-line bg-paper p-8 text-center">
          <p className="text-ink">Belum ada tahun ajaran aktif.</p>
          <p className="mt-1 text-sm text-muted">
            Kelas terikat pada tahun ajaran. Buat &amp; aktifkan dulu di
            Pengaturan.
          </p>
          <Button href="/admin/pengaturan" variant="primary" size="md" className="mt-4">
            Ke Pengaturan
          </Button>
        </div>
      </div>
    );
  }

  const [rows, teachers, counts] = await Promise.all([
    db
      .select({
        id: classes.id,
        name: classes.name,
        level: classes.level,
        capacity: classes.capacity,
        homeroomName: users.name,
      })
      .from(classes)
      .leftJoin(users, eq(users.id, classes.homeroomTeacherId))
      .where(
        and(
          eq(classes.schoolId, schoolId),
          eq(classes.academicYearId, year.id),
          isNull(classes.deletedAt),
        ),
      )
      .orderBy(asc(classes.name)),
    listWorkspaceTeachers(schoolId),
    db
      .select({ classId: enrollments.classId, n: count() })
      .from(enrollments)
      .where(eq(enrollments.schoolId, schoolId))
      .groupBy(enrollments.classId),
  ]);

  const countMap = new Map(counts.map((c) => [c.classId, c.n]));

  return (
    <div>
      <PageHeader title="Kelas" description={`Tahun ajaran aktif: ${year.name}`} />

      <form action={addClass} className="mb-8 rounded-xl border border-line bg-paper p-5">
        <h2 className="mb-4 font-display text-lg font-medium text-ink">Tambah kelas</h2>
        <div className="grid items-end gap-4 md:grid-cols-[1.5fr_1fr_1fr_2fr_auto]">
          <Field label="Nama kelas" name="name" required placeholder="cth. VII-A" />
          <Field label="Tingkat" name="level" placeholder="cth. VII" />
          <Field label="Kapasitas" name="capacity" type="number" placeholder="cth. 32" />
          <SelectField label="Wali kelas" name="homeroomTeacherId" defaultValue="">
            <option value="">— Belum ada —</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </SelectField>
          <Button type="submit" variant="accent" size="md">Tambah</Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-line bg-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-sand/40">
              <Th>Kelas</Th>
              <Th>Tingkat</Th>
              <Th>Siswa</Th>
              <Th>Wali kelas</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyRow colSpan={5} text="Belum ada kelas." />
            ) : (
              rows.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
                  <td className="px-4 py-3 text-ink">{c.level ?? "—"}</td>
                  <td className="px-4 py-3 text-ink">
                    {countMap.get(c.id) ?? 0}
                    {c.capacity ? ` / ${c.capacity}` : ""}
                  </td>
                  <td className="px-4 py-3 text-ink">{c.homeroomName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <form action={deleteClass}>
                      <input type="hidden" name="id" value={c.id} />
                      <RowAction danger>Hapus</RowAction>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-muted">
        Penempatan siswa ke kelas dilakukan di halaman{" "}
        <Link href="/admin/siswa" className="font-semibold text-teal-700">
          Siswa
        </Link>
        .
      </p>
    </div>
  );
}
