import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { ArrowRight } from "lucide-react";
import { auth } from "@/auth";
import { db, assessments, subjects, classes } from "@/db";
import { getTeacherAssignments } from "@/lib/teaching";
import { Button } from "@/components/ui/button";
import { PageHeader, Field, SelectField, RowAction, Th, EmptyRow } from "@/components/admin/ui";
import { createAssessment, deleteAssessment } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kuis & Ujian · Guru" };

export default async function KuisPage() {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  const teacherId = session?.user?.id;
  if (!schoolId || !teacherId || session?.user?.role !== "teacher") redirect("/dashboard");

  const assignments = await getTeacherAssignments(schoolId, teacherId);
  const subjOptions = dedupe(assignments.map((a) => ({ id: a.subjectId, name: a.subjectName })));
  const classOptions = dedupe(assignments.map((a) => ({ id: a.classId, name: a.className })));

  const rows = await db
    .select({
      id: assessments.id,
      title: assessments.title,
      type: assessments.type,
      status: assessments.status,
      subjectName: subjects.name,
      className: classes.name,
    })
    .from(assessments)
    .leftJoin(subjects, eq(subjects.id, assessments.subjectId))
    .leftJoin(classes, eq(classes.id, assessments.classId))
    .where(and(eq(assessments.schoolId, schoolId), eq(assessments.teacherId, teacherId)))
    .orderBy(desc(assessments.createdAt));

  return (
    <div>
      <PageHeader title="Kuis & Ujian" description="Susun kuis atau ujian formal." />

      {subjOptions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-paper p-8 text-center text-muted">
          Belum ada kelas/mapel yang Anda ampu.
        </div>
      ) : (
        <form action={createAssessment} className="mb-8 rounded-xl border border-line bg-paper p-5">
          <h2 className="mb-4 font-display text-lg font-medium text-ink">Buat baru</h2>
          <div className="grid items-end gap-4 md:grid-cols-5">
            <Field label="Judul" name="title" required placeholder="cth. Ulangan Bab 1" />
            <SelectField label="Jenis" name="type" defaultValue="quiz">
              <option value="quiz">Kuis</option>
              <option value="exam">Ujian</option>
            </SelectField>
            <SelectField label="Mapel" name="subjectId" required>
              {subjOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </SelectField>
            <SelectField label="Kelas" name="classId" required>
              {classOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </SelectField>
            <Button type="submit" variant="accent" size="md">Buat &amp; Susun</Button>
          </div>
          <div className="mt-3 max-w-xs">
            <Field label="Durasi (menit, opsional)" name="durationMin" type="number" placeholder="cth. 60" />
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-sand/40">
              <Th>Judul</Th>
              <Th>Jenis</Th>
              <Th>Mapel</Th>
              <Th>Kelas</Th>
              <Th>Status</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyRow colSpan={6} text="Belum ada kuis/ujian." />
            ) : (
              rows.map((a) => (
                <tr key={a.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">
                    <Link href={`/guru/kuis/${a.id}`} className="inline-flex items-center gap-1 hover:text-teal-700">
                      {a.title} <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize text-ink">
                    {a.type === "exam" ? "Ujian" : "Kuis"}
                  </td>
                  <td className="px-4 py-3 text-ink">{a.subjectName ?? "—"}</td>
                  <td className="px-4 py-3 text-ink">{a.className ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase ${
                      a.status === "published" ? "bg-teal-700/10 text-teal-700" : "bg-sand-deep text-ink"
                    }`}>
                      {a.status === "published" ? "Terbit" : "Draf"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <form action={deleteAssessment}>
                      <input type="hidden" name="id" value={a.id} />
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

function dedupe(items: { id: string; name: string | null }[]) {
  const map = new Map<string, string | null>();
  for (const it of items) if (!map.has(it.id)) map.set(it.id, it.name);
  return Array.from(map, ([id, name]) => ({ id, name }));
}
