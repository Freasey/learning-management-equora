import { desc } from "drizzle-orm";
import { db, contactRequests } from "@/db";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Lead & Demo · Super Admin" };

const typeStyle: Record<string, string> = {
  demo: "bg-accent/15 text-accent",
  contact: "bg-teal-700/10 text-teal-700",
};

const typeLabel: Record<string, string> = {
  demo: "Demo",
  contact: "Kontak",
};

export default async function LeadsPage() {
  const rows = await db
    .select()
    .from(contactRequests)
    .orderBy(desc(contactRequests.createdAt));

  const demoCount = rows.filter((r) => r.type === "demo").length;
  const contactCount = rows.length - demoCount;

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl font-medium text-ink">Lead &amp; Demo</h1>
        <p className="mt-1 text-sm text-muted">
          Calon pelanggan yang mengisi formulir Request Demo atau Kontak dari
          halaman publik.
        </p>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Total lead" value={rows.length} />
        <Stat label="Request demo" value={demoCount} />
        <Stat label="Pesan kontak" value={contactCount} />
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-sand/40 text-left">
              <Th>Tipe</Th>
              <Th>Nama</Th>
              <Th>Sekolah</Th>
              <Th>Kontak</Th>
              <Th>Paket</Th>
              <Th>Pesan</Th>
              <Th>Tanggal</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  Belum ada lead masuk.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-line align-top last:border-0">
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase ${
                        typeStyle[r.type] ?? "bg-sand-deep text-ink"
                      }`}
                    >
                      {typeLabel[r.type] ?? r.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">{r.name}</td>
                  <td className="px-4 py-3 text-ink">{r.schoolName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="text-ink">{r.email}</div>
                    {r.phone && (
                      <div className="text-xs text-muted">{r.phone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize text-ink">
                    {r.planKey ?? "—"}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-muted">
                    {r.message ? (
                      <span className="line-clamp-2">{r.message}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-muted">
                    {formatDate(r.createdAt)}
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-paper p-5">
      <div className="border-l-2 border-accent pl-3">
        <div className="font-display text-2xl font-medium text-ink">{value}</div>
        <div className="mt-1 text-xs uppercase tracking-wide text-muted">
          {label}
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted">
      {children}
    </th>
  );
}
