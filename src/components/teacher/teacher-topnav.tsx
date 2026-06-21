"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LogOut, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { doSignOut } from "@/app/(teacher)/guru/actions";

type Item = { href: string; label: string };
type Group = { id: string; label: string; href?: string; items: Item[] };

const groups: Group[] = [
  { id: "ikhtisar", label: "Ikhtisar", href: "/guru", items: [] },
  {
    id: "mengajar",
    label: "Mengajar",
    items: [
      { href: "/guru/jadwal", label: "Jadwal" },
      { href: "/guru/materi", label: "Materi" },
      { href: "/guru/chat", label: "Obrolan" },
    ],
  },
  {
    id: "penilaian",
    label: "Penilaian",
    items: [
      { href: "/guru/kuis", label: "Kuis & Ujian" },
      { href: "/guru/nilai", label: "Nilai" },
    ],
  },
  { id: "meet", label: "Meet", href: "/guru/meet", items: [] },
];

function matches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function TeacherTopNav({
  name,
  email,
}: {
  name: string;
  email?: string | null;
}) {
  const pathname = usePathname();

  const activeGroup =
    groups.find((g) =>
      g.href ? pathname === g.href : g.items.some((it) => matches(pathname, it.href)),
    ) ?? groups[0];

  return (
    <div className="sticky top-0 z-40 shadow-[0_8px_24px_-20px_rgba(14,58,58,0.6)]">
      <header className="bg-teal-900 text-paper">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-8">
            <Link href="/guru" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-paper">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span className="font-display text-lg font-medium">Equora</span>
              <span className="rounded-full bg-paper/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-paper/70">
                Guru
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {groups.map((g) => {
                const href = g.href ?? g.items[0].href;
                const active = g.id === activeGroup.id;
                return (
                  <Link
                    key={g.id}
                    href={href}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-paper/10 font-semibold text-paper"
                        : "text-paper/70 hover:text-paper",
                    )}
                  >
                    {g.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-sm font-medium">{name}</div>
              {email && (
                <div className="font-mono text-[10px] text-paper/50">{email}</div>
              )}
            </div>
            <Link
              href="/dokumentasi#guru"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Panduan & dokumentasi"
              title="Panduan & dokumentasi"
              className="grid h-8 w-8 place-items-center rounded-md border border-paper/20 text-paper/90 transition-colors hover:bg-paper/10"
            >
              <HelpCircle className="h-4 w-4" />
            </Link>
            <form action={doSignOut}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-md border border-paper/20 px-3 py-1.5 text-xs font-semibold text-paper/90 transition-colors hover:bg-paper/10"
              >
                <LogOut className="h-3.5 w-3.5" />
                Keluar
              </button>
            </form>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-6 pb-2 md:hidden">
          {groups.map((g) => {
            const href = g.href ?? g.items[0].href;
            const active = g.id === activeGroup.id;
            return (
              <Link
                key={g.id}
                href={href}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1.5 text-sm",
                  active ? "bg-paper/10 font-semibold" : "text-paper/70",
                )}
              >
                {g.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {activeGroup.items.length > 0 && (
        <div className="border-b border-line bg-paper">
          <nav className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-6">
            {activeGroup.items.map((it) => {
              const active = matches(pathname, it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={cn(
                    "shrink-0 border-b-2 py-3 text-sm transition-colors",
                    active
                      ? "border-accent font-semibold text-ink"
                      : "border-transparent text-muted hover:text-ink",
                  )}
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
