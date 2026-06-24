import Link from "next/link";
import { GraduationCap } from "lucide-react";

const cols = [
  {
    title: "Produk",
    links: [
      { href: "/#fitur", label: "Fitur" },
      { href: "/harga", label: "Harga" },
      { href: "/#inklusif", label: "Fitur Inklusif" },
      { href: "/daftar", label: "Mulai Gratis" },
      { href: "/demo", label: "Request Demo" },
    ],
  },
  {
    title: "Perusahaan",
    links: [
      { href: "/tentang", label: "Tentang Kami" },
      { href: "/#testimoni", label: "Testimoni" },
      { href: "/kontak", label: "Kontak" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Bantuan",
    links: [
      { href: "/panduan", label: "Panduan & Dokumentasi" },
      { href: "/faq", label: "FAQ" },
      { href: "/kebijakan-privasi", label: "Kebijakan Privasi" },
      { href: "/syarat", label: "Syarat & Ketentuan" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-sand">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-paper">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-medium text-teal-900">
              Equora
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-muted">
            Sistem manajemen sekolah yang tenang, kredibel, dan inklusif untuk
            siswa, guru, dan admin sekolah di Indonesia.
          </p>
        </div>

        {cols.map((col) => (
          <div key={col.title}>
            <h4 className="font-mono text-xs uppercase tracking-widest text-muted">
              {col.title}
            </h4>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-ink transition-colors hover:text-teal-700"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-5 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} Equora. Seluruh hak cipta dilindungi.</p>
          <p className="font-mono">Dibuat untuk pendidikan Indonesia 🇮🇩</p>
        </div>
      </div>
    </footer>
  );
}
