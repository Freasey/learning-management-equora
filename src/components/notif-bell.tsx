import Link from "next/link";
import { Bell } from "lucide-react";

/**
 * Lonceng notifikasi + badge jumlah belum dibaca. Menautkan ke /notifikasi.
 * Komponen presentasional (tanpa state) → aman dipakai di server & client.
 */
export function NotifBell({
  count,
  variant = "dark",
}: {
  count: number;
  variant?: "dark" | "light";
}) {
  const base =
    variant === "dark"
      ? "border-paper/20 text-paper/90 hover:bg-paper/10"
      : "border-slate-200 bg-white text-slate-600 hover:border-sky hover:text-sky";
  return (
    <Link
      href="/notifikasi"
      aria-label={`Notifikasi${count > 0 ? ` (${count} belum dibaca)` : ""}`}
      title="Notifikasi"
      className={`relative grid h-8 w-8 place-items-center rounded-md border transition-colors ${base} ${
        variant === "light" ? "rounded-xl border-2" : ""
      }`}
    >
      <Bell className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 font-mono text-[9px] font-bold leading-none text-paper">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
