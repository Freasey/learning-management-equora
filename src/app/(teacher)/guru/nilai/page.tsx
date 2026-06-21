import Link from "next/link";
import { redirect } from "next/navigation";
import { and, asc, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db, enrollments, users, gradeItems, grades, subjects } from "@/db";
import { getTeacherAssignments } from "@/lib/teaching";
import { Button } from "@/components/ui/button";
import { PageHeader, Field, RowAction, Th, EmptyRow, inputClass } from "@/components/admin/ui";
import { addGradeItem, deleteGradeItem, saveGrades } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nilai · Guru" };

export default async function NilaiPage({
  searchParams,
}: {
  searchParams: Promise<{ pair?: string; item?: string }>;
}) {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  const teacherId = session?.user?.id;
  if (!schoolId || !teacherId || session?.user?.role !== "teacher") redirect("/dashboard");

  const { pair, item } = await searchParams;
  const assignments = await getTeacherAssignments(schoolId, teacherId);

  let classId = "";
  let subjectId = "";
  if (pair && pair.includes(":")) [classId, subjectId] = pair.split(":");

  return (
    <div>
      <PageHeader title="Penilaian" description="Input nilai & rekap per kelas/mapel." />

      <form method="get" className="mb-8 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-paper p-5">
        <label className="block flex-1">
          <span className="mb-1.5 block text-xs font-semibold text-ink">Kelas &amp; Mata Pelajaran</span>
          <select name="pair" defaultValue={pair ?? ""} className={inputClass}>
            <option value="">— Pilih —</option>
            {assignments.map((a) => (
              <option key={`${a.classId}:${a.subjectId}`} value={`${a.classId}:${a.subjectId}`}>
                {a.className} — {a.subjectName}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="primary" size="md">Tampilkan</Button>
      </form>

      {!classId || !subjectId ? (
        <div className="rounded-xl border border-dashed border-line bg-paper p-8 text-center text-muted">
          Pilih kelas &amp; mapel untuk mulai menilai.
        </div>
      ) : (
        <GradeBook
          schoolId={schoolId}
          classId={classId}
          subjectId={subjectId}
          pair={pair!}
          selectedItem={item}
        />
      )}
    </div>
  );
}

async function GradeBook({
  schoolId,
  classId,
  subjectId,
  pair,
  selectedItem,
}: {
  schoolId: string;
  classId: string;
  subjectId: string;
  pair: string;
  selectedItem?: string;
}) {
  const pairEnc = encodeURIComponent(pair);

  const [subject] = await db
    .select()
    .from(subjects)
    .where(eq(subjects.id, subjectId))
    .limit(1);
  const kkm = subject?.kkm ?? 75;

  const [items, students] = await Promise.all([
    db
      .select()
      .from(gradeItems)
      .where(
        and(
          eq(gradeItems.schoolId, schoolId),
          eq(gradeItems.classId, classId),
          eq(gradeItems.subjectId, subjectId),
        ),
      )
      .orderBy(asc(gradeItems.createdAt)),
    db
      .select({ id: users.id, name: users.name, username: users.username })
      .from(enrollments)
      .innerJoin(users, eq(users.id, enrollments.studentId))
      .where(and(eq(enrollments.schoolId, schoolId), eq(enrollments.classId, classId)))
      .orderBy(asc(users.name)),
  ]);

  const itemIds = items.map((i) => i.id);
  const gradeRows = itemIds.length
    ? await db.select().from(grades).where(inArray(grades.gradeItemId, itemIds))
    : [];

  const maxOf = new Map(items.map((i) => [i.id, i.maxScore]));
  // studentId -> daftar persentase
  const pctByStudent = new Map<string, number[]>();
  // gradeItemId+studentId -> score
  const scoreMap = new Map<string, number>();
  for (const g of gradeRows) {
    if (g.score == null) continue;
    scoreMap.set(`${g.gradeItemId}_${g.studentId}`, g.score);
    const max = maxOf.get(g.gradeItemId) ?? 100;
    const pct = (g.score / max) * 100;
    const list = pctByStudent.get(g.studentId) ?? [];
    list.push(pct);
    pctByStudent.set(g.studentId, list);
  }

  const activeItem = items.find((i) => i.id === selectedItem);

  return (
    <div className="space-y-8">
      {/* Item penilaian */}
      <section className="rounded-xl border border-line bg-paper p-5">
        <h2 className="mb-4 font-display text-lg font-medium text-ink">Item penilaian</h2>
        <form action={addGradeItem} className="mb-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="classId" value={classId} />
          <input type="hidden" name="subjectId" value={subjectId} />
          <div className="flex-1">
            <Field label="Judul penilaian" name="title" required placeholder="cth. Ulangan Harian 1" />
          </div>
          <div className="w-28">
            <Field label="Nilai maks" name="maxScore" type="number" defaultValue={100} required />
          </div>
          <Button type="submit" variant="accent" size="md">Tambah</Button>
        </form>

        {items.length === 0 ? (
          <p className="text-sm text-muted">Belum ada item penilaian.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((it) => {
              const active = it.id === selectedItem;
              const auto = it.source === "assessment";
              return (
                <div
                  key={it.id}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${
                    active ? "border-teal-700 bg-teal-700/5" : "border-line"
                  }`}
                >
                  <Link href={`/guru/nilai?pair=${pairEnc}&item=${it.id}`} className="font-medium text-ink">
                    {it.title}
                    <span className="ml-1 font-mono text-[10px] text-muted">/{it.maxScore}</span>
                  </Link>
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-mono text-[9px] uppercase ${
                      auto ? "bg-teal-700/10 text-teal-700" : "bg-sand-deep text-ink"
                    }`}
                  >
                    {auto ? "Otomatis" : "Manual"}
                  </span>
                  {!auto && (
                    <form action={deleteGradeItem}>
                      <input type="hidden" name="id" value={it.id} />
                      <input type="hidden" name="classId" value={classId} />
                      <input type="hidden" name="subjectId" value={subjectId} />
                      <button type="submit" className="text-xs text-red-600 hover:underline">×</button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Input nilai untuk item terpilih */}
      {activeItem && (
        <section className="rounded-xl border border-line bg-paper p-5">
          <h2 className="mb-1 font-display text-lg font-medium text-ink">
            Isi nilai — {activeItem.title}{" "}
            <span className="font-mono text-xs text-muted">(maks {activeItem.maxScore})</span>
          </h2>
          {activeItem.source === "assessment" && (
            <p className="mb-4 text-xs text-muted">
              Kolom <strong className="text-teal-700">otomatis</strong> dari kuis — terisi
              sendiri saat siswa mengerjakan; nilai di sini bisa Anda override.
            </p>
          )}
          {students.length === 0 ? (
            <p className="text-sm text-muted">Belum ada siswa di kelas ini.</p>
          ) : (
            <form action={saveGrades}>
              <input type="hidden" name="gradeItemId" value={activeItem.id} />
              <input type="hidden" name="classId" value={classId} />
              <input type="hidden" name="subjectId" value={subjectId} />
              <div className="grid gap-2 sm:grid-cols-2">
                {students.map((st) => (
                  <div key={st.id} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2">
                    <span className="flex-1 text-sm text-ink">{st.name}</span>
                    <input
                      name={`score_${st.id}`}
                      type="number"
                      min={0}
                      max={activeItem.maxScore}
                      defaultValue={scoreMap.get(`${activeItem.id}_${st.id}`) ?? ""}
                      className={`${inputClass} w-20 py-1.5`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button type="submit" variant="primary" size="md">Simpan Nilai</Button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* Rekap */}
      <section className="overflow-hidden rounded-xl border border-line bg-paper">
        <div className="flex items-center justify-between border-b border-line bg-sand/40 px-4 py-3">
          <h2 className="font-display text-lg font-medium text-ink">Rekap nilai</h2>
          <span className="font-mono text-xs text-muted">KKM {kkm}</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line">
              <Th>Siswa</Th>
              <Th>Rata-rata</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <EmptyRow colSpan={3} text="Belum ada siswa di kelas ini." />
            ) : (
              students.map((st) => {
                const list = pctByStudent.get(st.id) ?? [];
                const avg = list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length) : null;
                const tuntas = avg != null && avg >= kkm;
                return (
                  <tr key={st.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 text-ink">{st.name}</td>
                    <td className="px-4 py-3 font-mono text-ink">{avg == null ? "—" : avg}</td>
                    <td className="px-4 py-3">
                      {avg == null ? (
                        <span className="text-xs text-muted">Belum dinilai</span>
                      ) : tuntas ? (
                        <span className="rounded-full bg-teal-700/10 px-2.5 py-1 font-mono text-[10px] uppercase text-teal-700">
                          Tuntas
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-2.5 py-1 font-mono text-[10px] uppercase text-red-700">
                          Perlu perhatian
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
