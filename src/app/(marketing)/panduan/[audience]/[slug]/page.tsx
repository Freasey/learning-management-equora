import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  AUDIENCE_BY_SLUG,
  audienceLabel,
  getPublished,
  listPublished,
  renderMarkdown,
} from "@/lib/docs";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ audience: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublished(slug);
  return { title: article ? `${article.title} — Equora` : "Panduan — Equora" };
}

export default async function PanduanArticlePage({
  params,
}: {
  params: Promise<{ audience: string; slug: string }>;
}) {
  const { audience, slug } = await params;
  const key = AUDIENCE_BY_SLUG[audience];
  if (!key) notFound();

  const article = await getPublished(slug);
  if (!article || article.audience !== key) notFound();

  const siblings = (await listPublished(key)).filter((a) => a.slug !== slug);

  return (
    <section className="mx-auto max-w-3xl px-5 py-12">
      <Link
        href={`/panduan/${audience}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Panduan {audienceLabel(key)}
      </Link>

      <article>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          {article.category}
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium text-ink md:text-4xl">
          {article.title}
        </h1>
        {article.summary && (
          <p className="mt-2 text-lg text-muted">{article.summary}</p>
        )}
        <div
          className="mt-6 text-[15px] text-ink"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(article.body) }}
        />
      </article>

      {siblings.length > 0 && (
        <div className="mt-12 border-t border-line pt-6">
          <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">
            Artikel lain
          </h2>
          <div className="flex flex-wrap gap-2">
            {siblings.map((s) => (
              <Link
                key={s.id}
                href={`/panduan/${audience}/${s.slug}`}
                className="rounded-full border border-line bg-paper px-3 py-1.5 text-sm text-ink transition-colors hover:border-teal-700 hover:text-teal-700"
              >
                {s.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
