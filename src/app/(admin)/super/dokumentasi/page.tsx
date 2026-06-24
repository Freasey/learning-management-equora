import Link from "next/link";
import { asc } from "drizzle-orm";
import { Plus, Pencil } from "lucide-react";
import { db, docArticles } from "@/db";
import { DOC_AUDIENCES, audienceLabel } from "@/lib/docs";
import { deleteArticle } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dokumentasi · Super Admin" };

export default async function SuperDocsPage() {
  const rows = await db
    .select()
    .from(docArticles)
    .orderBy(asc(docArticles.audience), asc(docArticles.category), asc(docArticles.sortOrder));

  return (
    <div>
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-ink">Dokumentasi</h1>
          <p className="mt-1 text-sm text-muted">
            Pusat bantuan yang tampil di{" "}
            <Link href="/panduan" className="text-teal-700 underline">
              /panduan
            </Link>{" "}
            dan sebagai bantuan kontekstual di dalam aplikasi. Kelola kontennya di sini.
          </p>
        </div>
        <Link
          href="/super/dokumentasi/baru"
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-paper transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Artikel baru
        </Link>
      </header>

      <div className="space-y-8">
        {DOC_AUDIENCES.map((au) => {
          const items = rows.filter((r) => r.audience === au.key);
          return (
            <section key={au.key}>
              <h2 className="mb-3 flex items-baseline gap-2 font-display text-lg font-medium text-ink">
                {audienceLabel(au.key)}
                <span className="font-mono text-xs text-muted">{items.length} artikel</span>
              </h2>
              {items.length === 0 ? (
                <p className="rounded-xl border border-line bg-paper px-4 py-6 text-center text-sm text-muted">
                  Belum ada artikel.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-line bg-paper">
                  <table className="w-full text-sm">
                    <tbody>
                      {items.map((r) => (
                        <tr key={r.id} className="border-b border-line last:border-0">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-ink">{r.title}</span>
                              {r.status === "draft" && (
                                <span className="rounded-full bg-sand-deep px-2 py-0.5 text-[10px] text-muted">
                                  draf
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 font-mono text-[11px] text-muted">
                              {r.category} · /{r.slug}
                              {r.route ? ` · ${r.route}` : ""}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/super/dokumentasi/${r.id}`}
                                className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-700 hover:text-paper"
                              >
                                <Pencil className="h-3.5 w-3.5" /> Sunting
                              </Link>
                              <form action={deleteArticle}>
                                <input type="hidden" name="id" value={r.id} />
                                <button
                                  type="submit"
                                  className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-paper"
                                >
                                  Hapus
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
