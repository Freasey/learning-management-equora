import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DOC_AUDIENCES, type DocAudience } from "@/lib/docs";
import { saveArticle } from "./actions";

const inputCls =
  "w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted/50 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15";

type Article = {
  id: string;
  audience: string;
  category: string;
  slug: string;
  title: string;
  summary: string;
  route: string | null;
  icon: string | null;
  sortOrder: number;
  status: string;
  body: string;
};

export function ArticleForm({ article }: { article?: Article }) {
  const a = article;
  return (
    <form action={saveArticle} className="space-y-4">
      {a && <input type="hidden" name="id" value={a.id} />}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Untuk peran (audiens)">
          <select name="audience" defaultValue={a?.audience ?? "guest"} className={inputCls}>
            {DOC_AUDIENCES.map((au) => (
              <option key={au.key} value={au.key as DocAudience}>
                {au.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={a?.status ?? "published"} className={inputCls}>
            <option value="published">Terbit</option>
            <option value="draft">Draf</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Kategori">
          <input name="category" defaultValue={a?.category ?? "Umum"} className={inputCls} />
        </Field>
        <Field label="Slug (unik, untuk URL)">
          <input
            name="slug"
            defaultValue={a?.slug ?? ""}
            placeholder="contoh-slug-artikel"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Judul">
        <input name="title" defaultValue={a?.title ?? ""} className={inputCls} />
      </Field>

      <Field label="Ringkasan (1 kalimat)">
        <input name="summary" defaultValue={a?.summary ?? ""} className={inputCls} />
      </Field>

      <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
        <Field label="Route in-app (opsional)" hint="mis. /guru/kuis → contextual help">
          <input
            name="route"
            defaultValue={a?.route ?? ""}
            placeholder="/guru/kuis"
            className={inputCls}
          />
        </Field>
        <Field label="Ikon (lucide, opsional)">
          <input name="icon" defaultValue={a?.icon ?? ""} placeholder="BookOpen" className={inputCls} />
        </Field>
        <Field label="Urutan">
          <input
            name="sortOrder"
            type="number"
            defaultValue={a?.sortOrder ?? 0}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Isi (Markdown)" hint="Mendukung # judul, **tebal**, - daftar, [tautan](url), `kode`">
        <textarea
          name="body"
          rows={16}
          defaultValue={a?.body ?? ""}
          className={`${inputCls} font-mono text-[13px] leading-relaxed`}
        />
      </Field>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="accent" size="md">
          Simpan
        </Button>
        <Link
          href="/super/dokumentasi"
          className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-sand"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink">
        {label}
        {hint && <span className="ml-2 font-normal text-muted">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
