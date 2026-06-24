import { redirect } from "next/navigation";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, parentLinks, users, grades, gradeItems, subjects } from "@/db";
import { requireParent } from "@/lib/auth-guard";
import { getStudentClass } from "@/lib/student";

export const dynamic = "force-dynamic";
export const metadata = { title: "Beranda · Orang Tua" };

export default async function OrtuHome() {
  const { session, parentId } = await requireParent();
  const schoolId = session?.user?.schoolId;
  if (!schoolId) redirect("/masuk");

  const children = await db
    .select({ id: users.id, name: users.name })
    .from(parentLinks)
    .innerJoin(users, eq(users.id, parentLinks.studentId))
    .where(and(eq(parentLinks.parentId, parentId), eq(parentLinks.schoolId, schoolId)));

  if (children.length === 0) {
    return (
      <div>
        <h1 className="mb-2 font-display text-2xl font-medium text-ink">Halo 👋</h1>
        <div className="rounded-xl border border-dashed border-line bg-paper p-8 text-center text-muted">
          Belum ada anak yang ditautkan ke akun Anda. Hubungi admin sekolah untuk
          menautkan data putra/putri Anda.
        </div>
      </div>
    );
  }

  const childIds = children.map((c) => c.id);
  const [classes, gradeRows] = await Promise.all([
    Promise.all(children.map((c) => getStudentClass(schoolId, c.id))),
    db
      .select({
        studentId: grades.studentId,
        title: gradeItems.title,
        subjectName: subjects.name,
        kkm: subjects.kkm,
        score: grades.score,
        max: gradeItems.maxScore,
        createdAt: grades.createdAt,
      })
      .from(grades)
      .innerJoin(gradeItems, eq(gradeItems.id, grades.gradeItemId))
      .leftJoin(subjects, eq(subjects.id, gradeItems.subjectId))
      .where(and(eq(grades.schoolId, schoolId), inArray(grades.studentId, childIds)))
      .orderBy(desc(grades.createdAt)),
  ]);

  const classByChild = new Map(children.map((c, i) => [c.id, classes[i]?.className ?? null]));
  const gradesByChild = new Map<string, typeof gradeRows>();
  for (const g of gradeRows) {
    const arr = gradesByChild.get(g.studentId) ?? [];
    if (arr.length < 6) arr.push(g);
    gradesByChild.set(g.studentId, arr);
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-medium text-ink">
        Halo, {session?.user?.name?.split(" ")[0] ?? "Orang Tua"} 👋
      </h1>

      {children.map((c) => {
        const rows = gradesByChild.get(c.id) ?? [];
        return (
          <section key={c.id} className="rounded-xl border border-line bg-paper p-6">
            <header className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-medium text-ink">{c.name}</h2>
                <p className="text-sm text-muted">
                  Kelas {classByChild.get(c.id) ?? "—"}
                </p>
              </div>
            </header>

            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Nilai terbaru
            </h3>
            {rows.length === 0 ? (
              <p className="text-sm text-muted">Belum ada nilai.</p>
            ) : (
              <ul className="divide-y divide-line">
                {rows.map((g, i) => {
                  const pct = g.max ? Math.round(((g.score ?? 0) / g.max) * 100) : 0;
                  const below = pct < (g.kkm ?? 75);
                  return (
                    <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{g.title}</p>
                        <p className="text-xs text-muted">{g.subjectName ?? "—"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-ink">
                          {g.score ?? "—"}/{g.max}
                        </span>
                        {below && (
                          <span className="rounded-full bg-accent/15 px-2 py-0.5 font-mono text-[10px] uppercase text-accent">
                            Perlu perhatian
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
