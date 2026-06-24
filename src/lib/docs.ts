import { and, asc, eq } from "drizzle-orm";
import { db, docArticles } from "@/db";

/** Audiens dokumentasi (peran yang membaca). */
export const DOC_AUDIENCES = [
  { key: "guest", label: "Umum", desc: "Untuk siapa saja / calon pengguna." },
  { key: "school_admin", label: "Admin Sekolah", desc: "Menyiapkan & mengelola sekolah." },
  { key: "teacher", label: "Guru", desc: "Mengajar, materi, penilaian." },
  { key: "student", label: "Siswa", desc: "Belajar, kuis, nilai." },
] as const;

export type DocAudience = (typeof DOC_AUDIENCES)[number]["key"];

export function audienceLabel(key: string): string {
  return DOC_AUDIENCES.find((a) => a.key === key)?.label ?? key;
}

/** Segmen URL ramah (/panduan/<slug>) ↔ kunci audiens di DB. */
export const AUDIENCE_BY_SLUG: Record<string, string> = {
  umum: "guest",
  admin: "school_admin",
  guru: "teacher",
  siswa: "student",
};
export const SLUG_BY_AUDIENCE: Record<string, string> = {
  guest: "umum",
  school_admin: "admin",
  teacher: "guru",
  student: "siswa",
};

/** Artikel terbit untuk satu audiens, terurut kategori lalu sortOrder. */
export function listPublished(audience: string) {
  return db
    .select()
    .from(docArticles)
    .where(
      and(eq(docArticles.audience, audience), eq(docArticles.status, "published")),
    )
    .orderBy(asc(docArticles.category), asc(docArticles.sortOrder));
}

/** Satu artikel terbit berdasarkan slug. */
export async function getPublished(slug: string) {
  const [row] = await db
    .select()
    .from(docArticles)
    .where(and(eq(docArticles.slug, slug), eq(docArticles.status, "published")))
    .limit(1);
  return row ?? null;
}

/** Artikel yang menjelaskan sebuah route in-app (contextual help). */
export async function getByRoute(route: string) {
  const [row] = await db
    .select()
    .from(docArticles)
    .where(and(eq(docArticles.route, route), eq(docArticles.status, "published")))
    .limit(1);
  return row ?? null;
}

/**
 * Renderer Markdown minimal & aman (escape dulu, lalu format subset):
 * judul (#, ##, ###), tebal **x**, kode inline `x`, tautan [t](u),
 * daftar berpoin (-) & bernomor (1.), serta paragraf. Cukup untuk dokumentasi
 * internal tanpa menambah dependensi.
 */
export function renderMarkdown(md: string): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, '<code class="rounded bg-sand px-1 py-0.5 font-mono text-[0.85em]">$1</code>')
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="font-medium text-teal-700 underline">$1</a>',
      );

  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let list: "ul" | "ol" | null = null;
  let para: string[] = [];

  const closeList = () => {
    if (list) {
      html.push(`</${list}>`);
      list = null;
    }
  };
  const closePara = () => {
    if (para.length) {
      html.push(`<p class="my-3 leading-relaxed">${inline(para.join(" "))}</p>`);
      para = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      closePara();
      closeList();
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      closePara();
      closeList();
      const lvl = h[1].length;
      const size =
        lvl === 1
          ? "mt-6 mb-2 font-display text-2xl font-medium"
          : lvl === 2
            ? "mt-5 mb-2 font-display text-xl font-medium"
            : "mt-4 mb-1 font-display text-lg font-medium";
      html.push(`<h${lvl} class="${size} text-ink">${inline(h[2])}</h${lvl}>`);
      continue;
    }
    const ul = /^[-*]\s+(.*)$/.exec(line);
    const ol = /^\d+\.\s+(.*)$/.exec(line);
    if (ul || ol) {
      closePara();
      const want = ul ? "ul" : "ol";
      if (list !== want) {
        closeList();
        list = want;
        html.push(
          `<${want} class="my-3 ml-5 list-${want === "ul" ? "disc" : "decimal"} space-y-1">`,
        );
      }
      html.push(`<li class="leading-relaxed">${inline((ul ?? ol)![1])}</li>`);
      continue;
    }
    para.push(line.trim());
  }
  closePara();
  closeList();
  return html.join("\n");
}
