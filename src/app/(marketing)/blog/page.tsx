import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";

export const metadata: Metadata = {
  title: "Blog — Equora",
  description: "Tips manajemen sekolah, pendidikan inklusif, dan kabar produk.",
};

const posts = [
  {
    category: "Manajemen Sekolah",
    title: "5 cara mengurangi beban administrasi guru",
    excerpt:
      "Strategi praktis agar guru bisa kembali fokus pada hal yang paling penting: mengajar.",
    date: "Segera",
  },
  {
    category: "Inklusi",
    title: "Membangun kelas yang ramah untuk semua siswa",
    excerpt:
      "Mengapa aksesibilitas seharusnya menjadi bagian inti, bukan tambahan, dalam pendidikan.",
    date: "Segera",
  },
  {
    category: "Kurikulum",
    title: "Menyusun penilaian yang adil dan bermakna",
    excerpt:
      "Panduan menata rekap nilai agar mudah dibaca dan benar-benar membantu siswa berkembang.",
    date: "Segera",
  },
];

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Wawasan untuk sekolah yang lebih baik"
        subtitle="Tips manajemen sekolah, pendidikan inklusif, dan kabar produk Equora."
      />

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {posts.map((p) => (
            <article
              key={p.title}
              className="flex flex-col overflow-hidden rounded-xl border border-line bg-paper"
            >
              <div className="h-36 bg-gradient-to-br from-teal-700 to-teal-500" />
              <div className="flex flex-1 flex-col p-6">
                <span className="font-mono text-[10px] uppercase tracking-wider text-teal-700">
                  {p.category}
                </span>
                <h2 className="mt-2 font-display text-lg font-medium text-ink">
                  {p.title}
                </h2>
                <p className="mt-2 flex-1 text-sm text-muted">{p.excerpt}</p>
                <span className="mt-4 inline-block w-fit rounded-full bg-sand-deep px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ink">
                  {p.date}
                </span>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-muted">
          Artikel lengkap akan segera hadir. Pantau terus halaman ini!
        </p>
      </section>
    </>
  );
}
