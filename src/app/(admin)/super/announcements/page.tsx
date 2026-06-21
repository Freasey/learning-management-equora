import { desc } from "drizzle-orm";
import { db, announcements } from "@/db";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  createAnnouncement,
  toggleAnnouncement,
  deleteAnnouncement,
} from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Pengumuman · Super Admin" };

const levelStyle: Record<string, string> = {
  info: "bg-teal-700/10 text-teal-700",
  warning: "bg-accent/15 text-accent",
  critical: "bg-red-100 text-red-700",
};

export default async function AnnouncementsPage() {
  const rows = await db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.createdAt));

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl font-medium text-ink">
          Pengumuman
        </h1>
        <p className="mt-1 text-sm text-muted">
          Banner global yang tampil untuk seluruh pengguna platform.
        </p>
      </header>

      <form
        action={createAnnouncement}
        className="mb-8 rounded-xl border border-line bg-paper p-5"
      >
        <h2 className="mb-4 font-display text-lg font-medium text-ink">
          Buat pengumuman
        </h2>
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink">
                Judul
              </span>
              <input
                name="title"
                placeholder="Pemeliharaan terjadwal"
                className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted/50 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink">
                Tingkat
              </span>
              <select
                name="level"
                defaultValue="info"
                className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
              >
                <option value="info">Info</option>
                <option value="warning">Peringatan</option>
                <option value="critical">Kritis</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink">
              Isi
            </span>
            <textarea
              name="body"
              rows={2}
              placeholder="Sistem akan dipelihara pada Sabtu, 22.00–23.00 WIB."
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted/50 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
            />
          </label>
          <div>
            <Button type="submit" variant="accent" size="md">
              Terbitkan
            </Button>
          </div>
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
                  <span
                    className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase ${
                      levelStyle[a.level] ?? "bg-sand-deep text-ink"
                    }`}
                  >
                    {a.level}
                  </span>
                  <h3 className="font-display text-lg font-medium text-ink">
                    {a.title}
                  </h3>
                  {!a.isActive && (
                    <span className="rounded-full bg-sand-deep px-2 py-0.5 text-[10px] text-muted">
                      nonaktif
                    </span>
                  )}
                </div>
                {a.body && <p className="mt-1 text-sm text-muted">{a.body}</p>}
                <p className="mt-2 font-mono text-[10px] text-muted">
                  {formatDate(a.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <form action={toggleAnnouncement}>
                  <input type="hidden" name="id" value={a.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-700 hover:text-paper"
                  >
                    {a.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </form>
                <form action={deleteAnnouncement}>
                  <input type="hidden" name="id" value={a.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-paper"
                  >
                    Hapus
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
