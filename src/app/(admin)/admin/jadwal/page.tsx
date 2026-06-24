import { redirect } from "next/navigation";
import { and, asc, eq, isNull } from "drizzle-orm";
import { auth } from "@/auth";
import { db, schedules, classes, subjects, users } from "@/db";
import { getActiveYear } from "@/lib/academic";
import { listWorkspaceTeachers } from "@/lib/membership";
import { Button } from "@/components/ui/button";
import { PageHeader, Field, SelectField, RowAction, Th, EmptyRow } from "@/components/admin/ui";
import { addSchedule, deleteSchedule } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jadwal · Admin Sekolah" };

const days = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default async function JadwalPage() {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  if (!schoolId) redirect("/super");

  const year = await getActiveYear(schoolId);

  const [rows, classList, subjectList, teacherList] = await Promise.all([
    db
      .select({
        id: schedules.id,
        dayOfWeek: schedules.dayOfWeek,
        startTime: schedules.startTime,
        endTime: schedules.endTime,
        room: schedules.room,
        className: classes.name,
        subjectName: subjects.name,
        teacherName: users.name,
      })
      .from(schedules)
      .leftJoin(classes, eq(classes.id, schedules.classId))
      .leftJoin(subjects, eq(subjects.id, schedules.subjectId))
      .leftJoin(users, eq(users.id, schedules.teacherId))
      .where(and(eq(schedules.schoolId, schoolId), isNull(classes.deletedAt)))
      .orderBy(asc(schedules.dayOfWeek), asc(schedules.startTime)),
    year
      ? db
          .select({ id: classes.id, name: classes.name })
          .from(classes)
          .where(
            and(
              eq(classes.schoolId, schoolId),
              eq(classes.academicYearId, year.id),
              isNull(classes.deletedAt),
            ),
          )
          .orderBy(asc(classes.name))
      : Promise.resolve([]),
    db
      .select({ id: subjects.id, name: subjects.name })
      .from(subjects)
      .where(and(eq(subjects.schoolId, schoolId), isNull(subjects.deletedAt)))
      .orderBy(asc(subjects.name)),
    listWorkspaceTeachers(schoolId),
  ]);

  return (
    <div>
      <PageHeader title="Jadwal Pelajaran" description="Slot waktu pelajaran per kelas." />

      {classList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-paper p-8 text-center text-muted">
          Buat kelas dulu sebelum menyusun jadwal.
        </div>
      ) : (
        <form action={addSchedule} className="mb-8 rounded-xl border border-line bg-paper p-5">
          <h2 className="mb-4 font-display text-lg font-medium text-ink">Tambah jadwal</h2>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            <SelectField label="Kelas" name="classId" required>
              {classList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </SelectField>
            <SelectField label="Hari" name="dayOfWeek" defaultValue="1" required>
              {days.slice(1).map((d, i) => (
                <option key={d} value={i + 1}>{d}</option>
              ))}
            </SelectField>
            <Field label="Jam mulai" name="startTime" type="time" required />
            <Field label="Jam selesai" name="endTime" type="time" required />
            <SelectField label="Mapel" name="subjectId" defaultValue="">
              <option value="">— Pilih —</option>
              {subjectList.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </SelectField>
            <SelectField label="Guru" name="teacherId" defaultValue="">
              <option value="">— Pilih —</option>
              {teacherList.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </SelectField>
            <Field label="Ruang" name="room" placeholder="cth. R-101" />
            <div className="flex items-end">
              <Button type="submit" variant="accent" size="md" className="w-full">
                Tambah
              </Button>
            </div>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-sand/40">
              <Th>Hari</Th>
              <Th>Waktu</Th>
              <Th>Kelas</Th>
              <Th>Mapel</Th>
              <Th>Guru</Th>
              <Th>Ruang</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyRow colSpan={7} text="Belum ada jadwal." />
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-ink">{days[r.dayOfWeek] ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink">
                    {r.startTime}–{r.endTime}
                  </td>
                  <td className="px-4 py-3 text-ink">{r.className ?? "—"}</td>
                  <td className="px-4 py-3 text-ink">{r.subjectName ?? "—"}</td>
                  <td className="px-4 py-3 text-ink">{r.teacherName ?? "—"}</td>
                  <td className="px-4 py-3 text-ink">{r.room ?? "—"}</td>
                  <td className="px-4 py-3">
                    <form action={deleteSchedule}>
                      <input type="hidden" name="id" value={r.id} />
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
