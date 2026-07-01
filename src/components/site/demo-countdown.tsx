"use client";

import { useEffect, useState } from "react";

/**
 * Hitung mundur ke reset sekolah demo berikutnya. `targetIso` = waktu reset
 * terakhir + 6 jam (dihitung server dari createdAt DEMO01). Reset bersifat
 * "malas": begitu jatuh tempo, penyegaran terjadi saat sekolah demo diakses.
 */
export function DemoCountdown({
  targetIso,
  prefix = "reset berikutnya dalam",
}: {
  targetIso: string;
  prefix?: string;
}) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    function tick() {
      const ms = new Date(targetIso).getTime() - Date.now();
      if (ms <= 0) {
        setLabel("disegarkan saat dibuka");
        return;
      }
      const totalSec = Math.floor(ms / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      setLabel(`${h}j ${m}m ${String(s).padStart(2, "0")}d`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  return (
    <span className="tabular-nums">
      {prefix} <strong>{label ?? "…"}</strong>
    </span>
  );
}
