import { asc, desc } from "drizzle-orm";
import { db, schools, pricingPlans } from "@/db";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { createTenant, setTenantStatus } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sekolah · Super Admin" };

const statusStyle: Record<string, string> = {
  active: "bg-teal-700/10 text-teal-700",
  trial: "bg-accent/15 text-accent",
  suspended: "bg-sand-deep text-ink",
};

export default async function SchoolsPage() {
  const [rows, plans] = await Promise.all([
    db.select().from(schools).orderBy(desc(schools.createdAt)),
    db.select().from(pricingPlans).orderBy(asc(pricingPlans.sortOrder)),
  ]);

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl font-medium text-ink">Sekolah</h1>
        <p className="mt-1 text-sm text-muted">
          Daftar seluruh sekolah (tenant). Suspend atau aktifkan langganan dari
          sini.
        </p>
      </header>

      <form
        action={createTenant}
        className="mb-8 rounded-xl border border-line bg-paper p-5"
      >
        <h2 className="mb-4 font-display text-lg font-medium text-ink">
          Tambah sekolah
        </h2>
        <div className="grid items-end gap-4 md:grid-cols-[2fr_1fr_2fr_auto]">
          <Input label="Nama sekolah" name="name" placeholder="SMA Nusantara" />
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink">
              Paket
            </span>
            <select
              name="planKey"
              defaultValue="starting"
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
            >
              {plans.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Email kontak (opsional)"
            name="contactEmail"
            type="email"
            placeholder="admin@sekolah.sch.id"
          />
          <Button type="submit" variant="accent" size="md">
            Tambah
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-line bg-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-sand/40 text-left">
              <Th>Sekolah</Th>
              <Th>Kode</Th>
              <Th>Paket</Th>
              <Th>Status</Th>
              <Th>Dibuat</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  Belum ada sekolah terdaftar.
                </td>
              </tr>
            ) : (
              rows.map((t) => (
                <tr key={t.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{t.name}</div>
                    {t.contactEmail && (
                      <div className="text-xs text-muted">{t.contactEmail}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink">
                    {t.code}
                  </td>
                  <td className="px-4 py-3 capitalize text-ink">{t.planKey}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase ${
                        statusStyle[t.status] ?? "bg-sand-deep text-ink"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {formatDate(t.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {t.status === "suspended" ? (
                      <StatusButton id={t.id} status="active" label="Aktifkan" />
                    ) : (
                      <StatusButton
                        id={t.id}
                        status="suspended"
                        label="Suspend"
                      />
                    )}
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

function StatusButton({
  id,
  status,
  label,
}: {
  id: string;
  status: string;
  label: string;
}) {
  return (
    <form action={setTenantStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-700 hover:text-paper"
      >
        {label}
      </button>
    </form>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-muted">
      {children}
    </th>
  );
}

function Input({
  label,
  name,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink">
        {label}
      </span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted/50 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
      />
    </label>
  );
}
