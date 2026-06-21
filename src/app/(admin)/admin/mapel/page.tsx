import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { BookOpen, Sparkles, Plus } from "lucide-react";
import { auth } from "@/auth";
import { db, subjects, curriculumSubjects, schools } from "@/db";
import { Button } from "@/components/ui/button";
import { PageHeader, Field, RowAction, Th, EmptyRow } from "@/components/admin/ui";
import { adoptCatalogSubjects, addCustomSubject, deleteSubject } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mata Pelajaran · Admin Sekolah" };

const smallInput =
  "w-full rounded-md border border-line bg-paper px-2.5 py-1.5 text-xs text-ink placeholder:text-muted/50 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15";

export default async function MapelPage() {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  if (!schoolId) redirect("/super");

  const [school] = await db
    .select()
    .from(schools)
    .where(eq(schools.id, schoolId))
    .limit(1);

  if (!school.level) {
    return (
      <div>
        <PageHeader title="Mata Pelajaran" />
        <div className="rounded-xl border border-dashed border-line bg-paper p-8 text-center">
          <p className="text-ink">Jenjang sekolah belum diatur.</p>
          <p className="mt-1 text-sm text-muted">
            Tetapkan jenjang (SD/SMP/SMA/SMK) agar katalog mapel sesuai.
          </p>
          <Button href="/admin/pengaturan" variant="primary" size="md" className="mt-4">
            Ke Pengaturan
          </Button>
        </div>
      </div>
    );
  }

  const [adopted, catalog] = await Promise.all([
    db
      .select()
      .from(subjects)
      .where(eq(subjects.schoolId, schoolId))
      .orderBy(asc(subjects.name)),
    db
      .select()
      .from(curriculumSubjects)
      .where(eq(curriculumSubjects.level, school.level))
      .orderBy(asc(curriculumSubjects.name)),
  ]);

  const takenCatalogIds = new Set(adopted.map((a) => a.catalogId).filter(Boolean));
  const available = catalog.filter((c) => !takenCatalogIds.has(c.id));

  return (
    <div>
      <PageHeader
        title="Mata Pelajaran"
        description={`Katalog jenjang ${school.level}. Kode otomatis dibuat bila dikosongkan.`}
      />

      {/* Katalog bawaan */}
      <section className="mb-6 rounded-xl border border-line bg-paper p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-700/10 text-teal-700">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-medium text-ink">
              Mapel bawaan kurikulum
            </h2>
            <p className="text-xs text-muted">
              Centang mapel yang dipakai · atur Kode &amp; KKM (opsional)
            </p>
          </div>
        </div>

        {available.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line py-8 text-center text-sm text-muted">
            Semua mapel katalog sudah ditambahkan. 🎉
          </div>
        ) : (
          <form action={adoptCatalogSubjects}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {available.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-line bg-paper p-3.5 transition-colors has-checked:border-teal-700 has-checked:bg-teal-700/5 has-checked:shadow-[0_8px_24px_-16px_rgba(14,58,58,0.5)]"
                >
                  <label className="flex cursor-pointer items-start justify-between gap-2">
                    <span className="text-sm font-medium leading-snug text-ink">
                      {c.name}
                    </span>
                    <input
                      type="checkbox"
                      name="catalogIds"
                      value={c.id}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-line text-teal-700 focus:ring-teal-500/30"
                    />
                  </label>
                  <div className="mt-3 grid grid-cols-[1fr_4.5rem] gap-2">
                    <input
                      name={`code_${c.id}`}
                      placeholder="Kode (auto)"
                      className={smallInput}
                    />
                    <input
                      name={`kkm_${c.id}`}
                      type="number"
                      defaultValue={75}
                      aria-label="KKM"
                      className={smallInput}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <Button type="submit" variant="accent" size="md">
                <Plus className="h-4 w-4" /> Tambah Terpilih
              </Button>
            </div>
          </form>
        )}
      </section>

      {/* Mapel kustom */}
      <form action={addCustomSubject} className="mb-8 rounded-xl border border-line bg-paper p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent/15 text-accent">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-medium text-ink">
              Mapel kustom
            </h2>
            <p className="text-xs text-muted">
              Muatan lokal (mis. Bahasa Daerah, Tahfidz)
            </p>
          </div>
        </div>
        <div className="grid items-end gap-4 md:grid-cols-[2fr_1fr_1fr_auto]">
          <Field label="Nama mapel" name="name" required placeholder="cth. Bahasa Sunda" />
          <Field label="Kode (auto bila kosong)" name="code" placeholder="cth. BSUN" />
          <Field label="KKM" name="kkm" type="number" defaultValue={75} required />
          <Button type="submit" variant="primary" size="md">
            Tambah
          </Button>
        </div>
      </form>

      {/* Daftar mapel sekolah */}
      <div className="overflow-hidden rounded-xl border border-line bg-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-sand/40">
              <Th>Mapel</Th>
              <Th>Kode</Th>
              <Th>KKM</Th>
              <Th>Sumber</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {adopted.length === 0 ? (
              <EmptyRow colSpan={5} text="Belum ada mata pelajaran." />
            ) : (
              adopted.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{s.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink">{s.code ?? "—"}</td>
                  <td className="px-4 py-3 text-ink">{s.kkm}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase ${
                        s.source === "catalog"
                          ? "bg-teal-700/10 text-teal-700"
                          : "bg-accent/15 text-accent"
                      }`}
                    >
                      {s.source === "catalog" ? "Katalog" : "Kustom"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <form action={deleteSubject}>
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
