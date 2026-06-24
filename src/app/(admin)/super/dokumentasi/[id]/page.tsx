import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { ArrowLeft, History } from "lucide-react";
import { db, docArticles, docRevisions } from "@/db";
import { formatDate } from "@/lib/format";
import { ArticleForm } from "../article-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sunting Artikel · Super Admin" };

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [article] = await db
    .select()
    .from(docArticles)
    .where(eq(docArticles.id, id))
    .limit(1);
  if (!article) notFound();

  const revisions = await db
    .select({
      id: docRevisions.id,
      title: docRevisions.title,
      editedAt: docRevisions.editedAt,
    })
    .from(docRevisions)
    .where(eq(docRevisions.articleId, id))
    .orderBy(desc(docRevisions.editedAt))
    .limit(10);

  return (
    <div>
      <Link
        href="/super/dokumentasi"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke daftar
      </Link>
      <h1 className="mb-6 font-display text-3xl font-medium text-ink">
        Sunting artikel
      </h1>

      <ArticleForm article={article} />

      <section className="mt-10">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-medium text-ink">
          <History className="h-4 w-4 text-muted" /> Riwayat revisi
        </h2>
        {revisions.length === 0 ? (
          <p className="text-sm text-muted">Belum ada revisi tersimpan.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {revisions.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-md border border-line bg-paper px-3 py-2"
              >
                <span className="text-ink">{r.title}</span>
                <span className="font-mono text-[11px] text-muted">
                  {formatDate(r.editedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
