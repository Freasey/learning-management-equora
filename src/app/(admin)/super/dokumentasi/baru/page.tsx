import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ArticleForm } from "../article-form";

export const metadata = { title: "Artikel Baru · Super Admin" };

export default function NewArticlePage() {
  return (
    <div>
      <Link
        href="/super/dokumentasi"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke daftar
      </Link>
      <h1 className="mb-6 font-display text-3xl font-medium text-ink">Artikel baru</h1>
      <ArticleForm />
    </div>
  );
}
