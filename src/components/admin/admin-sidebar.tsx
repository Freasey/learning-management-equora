"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Tags,
  School,
  Megaphone,
  Inbox,
  BookText,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/super", label: "Ringkasan", icon: LayoutDashboard, exact: true },
  { href: "/super/pricing", label: "Pricing & Kuota", icon: Tags },
  { href: "/super/schools", label: "Sekolah", icon: School },
  { href: "/super/leads", label: "Lead & Demo", icon: Inbox },
  { href: "/super/announcements", label: "Pengumuman", icon: Megaphone },
  { href: "/super/dokumentasi", label: "Dokumentasi", icon: BookText },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-teal-900 text-paper">
      <div className="flex h-16 items-center gap-2 px-5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-paper">
          <GraduationCap className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <div className="font-display text-lg font-medium">Equora</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-paper/50">
            Super Admin
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-3 py-4">
        {links.map((l) => {
          const active = l.exact
            ? pathname === l.href
            : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-paper/10 font-semibold text-paper"
                  : "text-paper/70 hover:bg-paper/5 hover:text-paper",
              )}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
