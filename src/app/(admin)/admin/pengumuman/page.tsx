import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, schoolAnnouncements } from "@/db";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PageHeader, Field, SelectField, Textarea, RowAction } from "@/components/admin/ui";
import {
  addSchoolAnnouncement,
  toggleSchoolAnnouncement,
  deleteSchoolAnnouncement,
} from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengumuman · Admin Sekolah" };

const audienceLabel: Record<string, string> = {
  all: "Semua",
  teachers: "Guru",
  students: "Siswa",
};

export default async function PengumumanPage() {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  if (!schoolId) redirect("/super");

  const rows = await db
    .select()
    .from(schoolAnnouncements)
    .where(eq(schoolAnnouncements.schoolId, schoolId))
    .orderBy(desc(schoolAnnouncements.createdAt));

  return (
    <div>
      <PageHeader title="Pengumuman" description="Pengumuman untuk warga sekolah." />

      <form action={addSchoolAnnouncement} className="mb-8 rounded-xl border border-line bg-paper p-5">
        <h2 className="mb-4 font-display text-lg font-medium text-ink">Buat pengumuman</h2>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
            <Field label="Judul" name="title" required placeholder="cth. Libur Semester" />
            <SelectField label="Untuk" name="audience" defaultValue="all">
              <option value="all">Semua</option>
              <option value="teachers">Guru</option>
              <option value="students">Siswa</option>
            </SelectField>
          </div>
          <Textarea label="Isi" name="body" rows={3} placeholder="Tulis isi pengumuman…" />
          <Button type="submit" variant="accent" size="md">Terbitkan</Button>
        </div>
      </form>

      <div className="space-y-3">
        {rows.length === 0 ? (
          <p className="rounded-xl border border-line bg-paper px-4 py-10 text-center text-muted">
            Belum ada pengumuman.
          </p>
        ) : (
          rows.map((a) => (
            <div
              key={a.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-line bg-paper p-5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-sand-deep px-2.5 py-1 font-mono text-[10px] uppercase text-ink">
                    {audienceLabel[a.audience] ?? a.audience}
                  </span>
                  <h3 className="font-display text-lg font-medium text-ink">{a.title}</h3>
                  {!a.isActive && (
                    <span className="rounded-full bg-sand-deep px-2 py-0.5 text-[10px] text-muted">
                      nonaktif
                    </span>
                  )}
                </div>
                {a.body && <p className="mt-1 text-sm text-muted">{a.body}</p>}
                <p className="mt-2 font-mono text-[10px] text-muted">{formatDate(a.createdAt)}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <form action={toggleSchoolAnnouncement}>
                  <input type="hidden" name="id" value={a.id} />
                  <RowAction>{a.isActive ? "Nonaktifkan" : "Aktifkan"}</RowAction>
                </form>
                <form action={deleteSchoolAnnouncement}>
                  <input type="hidden" name="id" value={a.id} />
                  <RowAction danger>Hapus</RowAction>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
