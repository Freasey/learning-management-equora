import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, materials, subjects, classes } from "@/db";
import { getTeacherAssignments } from "@/lib/teaching";
import { isStorageConfigured } from "@/lib/storage";
import { isAiConfigured } from "@/lib/ai";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/admin/ui";
import { MateriManager, type MaterialRow } from "./materi-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Materi · Guru" };

export default async function MateriPage() {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  const teacherId = session?.user?.id;
  if (!schoolId || !teacherId || session?.user?.role !== "teacher") redirect("/dashboard");

  const assignments = await getTeacherAssignments(schoolId, teacherId);
  const subjectOptions = dedupe(assignments.map((a) => ({ id: a.subjectId, name: a.subjectName })));
  const classOptions = dedupe(assignments.map((a) => ({ id: a.classId, name: a.className })));

  const raw = await db
    .select({
      id: materials.id,
      title: materials.title,
      topic: materials.topic,
      type: materials.type,
      url: materials.url,
      notes: materials.notes,
      subjectId: materials.subjectId,
      classId: materials.classId,
      subjectName: subjects.name,
      className: classes.name,
      createdAt: materials.createdAt,
    })
    .from(materials)
    .leftJoin(subjects, eq(subjects.id, materials.subjectId))
    .leftJoin(classes, eq(classes.id, materials.classId))
    .where(and(eq(materials.schoolId, schoolId), eq(materials.teacherId, teacherId)))
    .orderBy(desc(materials.createdAt));

  if (subjectOptions.length === 0) {
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

  const rows: MaterialRow[] = raw.map((m) => ({
    id: m.id,
    title: m.title,
    topic: m.topic,
    type: m.type,
    url: m.url,
    notes: m.notes ?? "",
    subjectId: m.subjectId,
    classId: m.classId,
    subjectName: m.subjectName,
    className: m.className,
    createdLabel: formatDate(m.createdAt),
  }));

  return (
    <MateriManager
      rows={rows}
      subjectOptions={subjectOptions}
      classOptions={classOptions}
      storageOn={isStorageConfigured()}
      aiConfigured={isAiConfigured()}
    />
  );
}

function dedupe(items: { id: string; name: string | null }[]) {
  const map = new Map<string, string | null>();
  for (const it of items) if (!map.has(it.id)) map.set(it.id, it.name);
  return Array.from(map, ([id, name]) => ({ id, name }));
}
