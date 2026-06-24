import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, auditLogs, users } from "@/db";
import { formatDate } from "@/lib/format";
import { PageHeader, Th, EmptyRow } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Log Aktivitas · Admin Sekolah" };

const ACTION_LABEL: Record<string, string> = {
  "login.success": "Login berhasil",
  "login.failure": "Login gagal",
  "teacher.delete": "Hapus guru",
  "student.delete": "Hapus siswa",
  "year.rollover": "Mulai tahun ajaran baru",
  "plan.activate": "Aktivasi paket",
};

export default async function AuditPage() {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  if (!schoolId) redirect("/super");

  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      target: auditLogs.target,
      actorLabel: auditLogs.actorLabel,
      actorName: users.name,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorId))
    .where(eq(auditLogs.schoolId, schoolId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(200);

  return (
    <div>
      <PageHeader
        title="Log Aktivitas"
        description="Jejak tindakan penting di sekolah Anda (200 terbaru)."
      />
      <div className="overflow-hidden rounded-xl border border-line bg-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-sand/40">
              <Th>Waktu</Th>
              <Th>Aktivitas</Th>
              <Th>Oleh</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyRow colSpan={3} text="Belum ada aktivitas tercatat." />
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {formatDate(r.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-ink">
                    {ACTION_LABEL[r.action] ?? r.action}
                  </td>
                  <td className="px-4 py-3 text-ink">
                    {r.actorName ?? r.actorLabel ?? "—"}
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
