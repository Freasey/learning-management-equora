import { redirect } from "next/navigation";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { auth } from "@/auth";
import { db, users, classes, memberships } from "@/db";
import { getActiveYear } from "@/lib/academic";
import { formatDate } from "@/lib/format";
import { PageHeader, RowAction, Th, EmptyRow, inputClass } from "@/components/admin/ui";
import {
  approveMember,
  rejectMember,
  approveMembership,
  rejectMembership,
} from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pendaftaran · Admin Sekolah" };

const roleLabel: Record<string, string> = {
  teacher: "Guru",
  student: "Siswa",
};

export default async function PendaftaranPage() {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  if (!schoolId) redirect("/super");

  const year = await getActiveYear(schoolId);
  const [rows, classList, memberReqs] = await Promise.all([
    db
      .select()
      .from(users)
      .where(and(eq(users.schoolId, schoolId), eq(users.status, "pending")))
      .orderBy(desc(users.createdAt)),
    year
      ? db
          .select()
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
    // Permintaan keanggotaan dari akun yang sudah ada (guru lintas-sekolah).
    db
      .select({
        id: memberships.id,
        name: users.name,
        email: users.email,
        createdAt: memberships.createdAt,
      })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(and(eq(memberships.schoolId, schoolId), eq(memberships.status, "pending")))
      .orderBy(desc(memberships.createdAt)),
  ]);

  return (
    <div>
      <PageHeader
        title="Pendaftaran"
        description="Setujui guru & siswa yang mendaftar memakai kode sekolah."
      />

      <div className="overflow-hidden rounded-xl border border-line bg-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-sand/40">
              <Th>Nama</Th>
              <Th>Peran</Th>
              <Th>Email / NIS</Th>
              <Th>Daftar</Th>
              <Th>Tindakan</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyRow colSpan={5} text="Tidak ada pendaftaran menunggu persetujuan." />
            ) : (
              rows.map((m) => (
                <tr key={m.id} className="border-b border-line align-top last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{m.name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-sand-deep px-2.5 py-1 font-mono text-[10px] uppercase text-ink">
                      {roleLabel[m.role] ?? m.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink">{m.email ?? m.username}</td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {formatDate(m.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={approveMember} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={m.id} />
                        {m.role === "student" && (
                          <select
                            name="classId"
                            defaultValue=""
                            className={`${inputClass} max-w-[9rem] py-1.5`}
                          >
                            <option value="">Tanpa kelas</option>
                            {classList.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        )}
                        <RowAction>Setujui</RowAction>
                      </form>
                      <form action={rejectMember}>
                        <input type="hidden" name="id" value={m.id} />
                        <RowAction danger>Tolak</RowAction>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {memberReqs.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-1 font-display text-lg font-medium text-ink">
            Permintaan guru lintas-sekolah
          </h2>
          <p className="mb-3 text-sm text-muted">
            Guru dengan akun yang sudah ada (mis. pemilik kelas pribadi) ingin
            mengajar di sekolah ini. Menyetujui hanya menambahkan akses—tidak
            membuat akun baru.
          </p>
          <div className="overflow-hidden rounded-xl border border-line bg-paper">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-sand/40">
                  <Th>Nama</Th>
                  <Th>Email</Th>
                  <Th>Minta</Th>
                  <Th>Tindakan</Th>
                </tr>
              </thead>
              <tbody>
                {memberReqs.map((m) => (
                  <tr key={m.id} className="border-b border-line align-top last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{m.name}</td>
                    <td className="px-4 py-3 text-ink">{m.email}</td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {formatDate(m.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <form action={approveMembership}>
                          <input type="hidden" name="id" value={m.id} />
                          <RowAction>Setujui</RowAction>
                        </form>
                        <form action={rejectMembership}>
                          <input type="hidden" name="id" value={m.id} />
                          <RowAction danger>Tolak</RowAction>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
