"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Tombol kembali otomatis untuk area siswa (naik satu level).
 * Disembunyikan di beranda (/siswa).
 */
export function StudentBackBar() {
  const pathname = usePathname();
  if (pathname === "/siswa") return null;

  const segments = pathname.split("/").filter(Boolean); // ["siswa", "kuis", "id"]
  const parent =
    segments.length <= 2 ? "/siswa" : "/" + segments.slice(0, -1).join("/");
  const label = parent === "/siswa" ? "Beranda" : "Kembali";

  return (
    <Link
      href={parent}
      className="mb-4 inline-flex items-center gap-1.5 rounded-full border-2 border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-coral hover:text-coral"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
      {label}
    </Link>
  );
}
