import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { AUDIENCE_BY_SLUG, audienceLabel, listPublished } from "@/lib/docs";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ audience: string }>;
}): Promise<Metadata> {
  const { audience } = await params;
  const key = AUDIENCE_BY_SLUG[audience];
  return { title: key ? `Panduan ${audienceLabel(key)} — Equora` : "Panduan — Equora" };
}

export default async function PanduanAudiencePage({
  params,
}: {
  params: Promise<{ audience: string }>;
}) {
  const { audience } = await params;
  const key = AUDIENCE_BY_SLUG[audience];
  if (!key) notFound();

  const articles = await listPublished(key);

  // Kelompokkan per kategori (urutan kemunculan).
  const groups: { category: string; items: typeof articles }[] = [];
  for (const a of articles) {
    let g = groups.find((x) => x.category === a.category);
    if (!g) {
      g = { category: a.category, items: [] };
      groups.push(g);
    }
    g.items.push(a);
  }

  return (
    <>
      <PageHero
        eyebrow="Pusat Bantuan"
        title={`Panduan ${audienceLabel(key)}`}
        subtitle="Fungsi dan cara pakai tiap halaman."
      />
      <section className="mx-auto max-w-3xl px-5 py-12">
        <Link
          href="/panduan"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Semua peran
        </Link>

        {groups.length === 0 ? (
          <p className="rounded-xl border border-line bg-paper px-4 py-10 text-center text-muted">
            Belum ada artikel untuk peran ini.
          </p>
        ) : (
          <div className="space-y-8">
            {groups.map((g) => (
              <div key={g.category}>
                <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">
                  {g.category}
                </h2>
                <div className="overflow-hidden rounded-xl border border-line bg-paper">
                  {g.items.map((a) => (
                    <Link
                      key={a.id}
                      href={`/panduan/${audience}/${a.slug}`}
                      className="group flex items-start gap-3 border-b border-line px-4 py-3.5 transition-colors last:border-0 hover:bg-sand/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-ink">{a.title}</div>
                        {a.summary && (
                          <div className="mt-0.5 text-sm text-muted">{a.summary}</div>
                        )}
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-teal-700" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
