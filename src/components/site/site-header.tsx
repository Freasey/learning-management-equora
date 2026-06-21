"use client";

import Link from "next/link";
import { useState } from "react";
import { GraduationCap, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/#fitur", label: "Fitur" },
  { href: "/#inklusif", label: "Inklusif" },
  { href: "/harga", label: "Harga" },
  { href: "/#testimoni", label: "Testimoni" },
  { href: "/tentang", label: "Tentang" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-paper">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-medium text-teal-900">
            Equora
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button href="/masuk" variant="ghost" size="sm">
            Masuk
          </Button>
          <Button href="/daftar" variant="accent" size="sm">
            Mulai Gratis
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-md text-ink md:hidden"
          aria-label="Buka menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "border-t border-line bg-paper md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2.5 text-sm text-muted hover:bg-sand hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-3 flex gap-3">
            <Button href="/masuk" variant="ghost" size="sm" className="flex-1">
              Masuk
            </Button>
            <Button href="/daftar" variant="accent" size="sm" className="flex-1">
              Mulai Gratis
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
