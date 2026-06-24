import { redirect } from "next/navigation";
import { aliasedTable, and, asc, eq, ne } from "drizzle-orm";
import { auth } from "@/auth";
import { db, users, parentLinks } from "@/db";
import { Button } from "@/components/ui/button";
import { PageHeader, Field, SelectField, RowAction, Th, EmptyRow } from "@/components/admin/ui";
import { addParent, unlinkChild, deleteParent } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orang Tua · Admin Sekolah" };

export default async function OrtuPage() {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  if (!schoolId) redirect("/super");

  const studentT = aliasedTable(users, "student_u");
  const parentT = aliasedTable(users, "parent_u");

  const [students, parents, links] = await Promise.all([
    db
      .select({ id: users.id, name: users.name, username: users.username })
      .from(users)
      .where(
        and(eq(users.schoolId, schoolId), eq(users.role, "student"), ne(users.status, "inactive")),
      )
      .orderBy(asc(users.name)),
    db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(
        and(eq(users.schoolId, schoolId), eq(users.role, "parent"), ne(users.status, "inactive")),
      )
      .orderBy(asc(users.name)),
    db
      .select({
        id: parentLinks.id,
        parentId: parentLinks.parentId,
        childName: studentT.name,
      })
      .from(parentLinks)
      .innerJoin(studentT, eq(studentT.id, parentLinks.studentId))
      .innerJoin(parentT, eq(parentT.id, parentLinks.parentId))
      .where(and(eq(parentLinks.schoolId, schoolId), ne(parentT.status, "inactive"))),
  ]);

  const childrenOf = new Map<string, { id: string; childName: string }[]>();
  for (const l of links) {
    const arr = childrenOf.get(l.parentId) ?? [];
    arr.push({ id: l.id, childName: l.childName });
    childrenOf.set(l.parentId, arr);
  }

  return (
    <div>
      <PageHeader
        title="Orang Tua"
        description="Akun orang tua untuk memantau nilai & jadwal anaknya (akses baca)."
      />

      <form action={addParent} className="mb-8 rounded-xl border border-line bg-paper p-5">
        <h2 className="mb-4 font-display text-lg font-medium text-ink">Tambah orang tua</h2>
        <div className="grid items-end gap-4 md:grid-cols-[1.5fr_1.5fr_1fr_1.5fr_auto]">
          <Field label="Nama" name="name" required placeholder="Nama orang tua" />
          <Field label="Email" name="email" type="email" required placeholder="ortu@email.com" />
          <Field label="Kata sandi" name="password" type="password" required placeholder="min. 8" />
          <SelectField label="Anak (siswa)" name="studentId" defaultValue="">
            <option value="" disabled>
              — Pilih siswa —
            </option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.username ? `(${s.username})` : ""}
              </option>
            ))}
          </SelectField>
          <Button type="submit" variant="accent" size="md">
            Tambah
          </Button>
        </div>
        {students.length === 0 && (
          <p className="mt-3 text-xs text-muted">
            Belum ada siswa. Tambahkan siswa dulu sebelum membuat akun orang tua.
          </p>
        )}
      </form>

      <div className="overflow-hidden rounded-xl border border-line bg-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-sand/40">
              <Th>Nama</Th>
              <Th>Email</Th>
              <Th>Anak</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {parents.length === 0 ? (
              <EmptyRow colSpan={4} text="Belum ada akun orang tua." />
            ) : (
              parents.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0 align-top">
                  <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                  <td className="px-4 py-3 text-ink">{p.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {(childrenOf.get(p.id) ?? []).map((c) => (
                        <span
                          key={c.id}
                          className="inline-flex items-center gap-1 rounded-full border border-line bg-sand/40 px-2 py-0.5 text-xs text-ink"
                        >
                          {c.childName}
                          <form action={unlinkChild} className="inline">
                            <input type="hidden" name="id" value={c.id} />
                            <button type="submit" title="Lepas" className="text-muted hover:text-accent">
                              ×
                            </button>
                          </form>
                        </span>
                      ))}
                      {(childrenOf.get(p.id) ?? []).length === 0 && (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <form action={deleteParent}>
                      <input type="hidden" name="id" value={p.id} />
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
