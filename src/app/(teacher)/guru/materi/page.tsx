import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { Sparkles, FileText, Link2 } from "lucide-react";
import { auth } from "@/auth";
import { db, materials, subjects, classes } from "@/db";
import { getTeacherAssignments } from "@/lib/teaching";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PageHeader, Field, SelectField, Textarea, RowAction, Th, EmptyRow } from "@/components/admin/ui";
import { addMaterial, generateAiMaterial, deleteMaterial } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Materi · Guru" };

const typeBadge: Record<string, { label: string; cls: string }> = {
  ai: { label: "AI", cls: "bg-accent/15 text-accent" },
  link: { label: "Tautan", cls: "bg-teal-700/10 text-teal-700" },
  manual: { label: "Manual", cls: "bg-sand-deep text-ink" },
};

export default async function MateriPage() {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  const teacherId = session?.user?.id;
  if (!schoolId || !teacherId || session?.user?.role !== "teacher") redirect("/dashboard");

  const assignments = await getTeacherAssignments(schoolId, teacherId);
  const subjOptions = dedupe(assignments.map((a) => ({ id: a.subjectId, name: a.subjectName })));
  const classOptions = dedupe(assignments.map((a) => ({ id: a.classId, name: a.className })));

  const rows = await db
    .select({
      id: materials.id,
      title: materials.title,
      topic: materials.topic,
      type: materials.type,
      url: materials.url,
      subjectName: subjects.name,
      className: classes.name,
      createdAt: materials.createdAt,
    })
    .from(materials)
    .leftJoin(subjects, eq(subjects.id, materials.subjectId))
    .leftJoin(classes, eq(classes.id, materials.classId))
    .where(and(eq(materials.schoolId, schoolId), eq(materials.teacherId, teacherId)))
    .orderBy(desc(materials.createdAt));

  if (subjOptions.length === 0) {
    return (
      <div>
        <PageHeader title="Materi" />
        <div className="rounded-xl border border-dashed border-line bg-paper p-8 text-center text-muted">
          Belum ada mapel yang Anda ampu. Materi muncul setelah admin
          menugaskan Anda di jadwal.
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Materi Ajar" description="Generate dengan AI atau tambah manual." />

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* Generate AI */}
        <form action={generateAiMaterial} className="rounded-xl border border-line bg-paper p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent/15 text-accent">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-medium text-ink">Generate AI</h2>
              <p className="text-xs text-muted">PPT dari panduan kurikulum (mode demo)</p>
            </div>
          </div>
          <div className="space-y-4">
            <Field label="Topik" name="topic" required placeholder="cth. Hukum Newton" />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Mapel" name="subjectId" required>
                {subjOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </SelectField>
              <SelectField label="Kelas" name="classId" defaultValue="">
                <option value="">— Umum —</option>
                {classOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </SelectField>
            </div>
            <Button type="submit" variant="accent" size="md">
              <Sparkles className="h-4 w-4" /> Generate
            </Button>
          </div>
        </form>

        {/* Tambah manual */}
        <form action={addMaterial} className="rounded-xl border border-line bg-paper p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-700/10 text-teal-700">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-medium text-ink">Tambah manual</h2>
              <p className="text-xs text-muted">Unggah tautan / catatan materi</p>
            </div>
          </div>
          <div className="space-y-4">
            <Field label="Judul" name="title" required placeholder="cth. Ringkasan Bab 1" />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Mapel" name="subjectId" required>
                {subjOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </SelectField>
              <SelectField label="Tipe" name="type" defaultValue="link">
                <option value="link">Tautan</option>
                <option value="manual">Catatan</option>
              </SelectField>
            </div>
            <Field label="URL (opsional)" name="url" placeholder="https://…" />
            <Button type="submit" variant="primary" size="md">Tambah</Button>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-sand/40">
              <Th>Judul</Th>
              <Th>Mapel</Th>
              <Th>Kelas</Th>
              <Th>Tipe</Th>
              <Th>Dibuat</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyRow colSpan={6} text="Belum ada materi." />
            ) : (
              rows.map((m) => {
                const b = typeBadge[m.type] ?? typeBadge.manual;
                return (
                  <tr key={m.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">
                      {m.url ? (
                        <a href={m.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-teal-700 hover:underline">
                          {m.title} <Link2 className="h-3 w-3" />
                        </a>
                      ) : (
                        m.title
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink">{m.subjectName ?? "—"}</td>
                    <td className="px-4 py-3 text-ink">{m.className ?? "Umum"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase ${b.cls}`}>
                        {b.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{formatDate(m.createdAt)}</td>
                    <td className="px-4 py-3">
                      <form action={deleteMaterial}>
                        <input type="hidden" name="id" value={m.id} />
                        <RowAction danger>Hapus</RowAction>
                      </form>
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

function dedupe(items: { id: string; name: string | null }[]) {
  const map = new Map<string, string | null>();
  for (const it of items) if (!map.has(it.id)) map.set(it.id, it.name);
  return Array.from(map, ([id, name]) => ({ id, name }));
}
