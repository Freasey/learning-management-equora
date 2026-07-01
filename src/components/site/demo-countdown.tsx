"use client";

import { useEffect, useState } from "react";

/** Waktu reset otomatis berikutnya: jam UTC 0/6/12/18 (cocok dgn vercel.json). */
function nextResetAt(now: number): number {
  const d = new Date(now);
  d.setUTCMinutes(0, 0, 0);
  d.setUTCHours((Math.floor(new Date(now).getUTCHours() / 6) + 1) * 6);
  return d.getTime();
}

/**
 * Hitung mundur ke reset otomatis sekolah demo berikutnya. Menghitung batas
 * 6-jam sendiri di sisi klien agar tidak basi meski halaman dibuka lama.
 */
export function DemoCountdown({ prefix = "Reset otomatis dalam" }: { prefix?: string }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    function tick() {
      const ms = nextResetAt(Date.now()) - Date.now();
      const totalMin = Math.max(0, Math.floor(ms / 60000));
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      const s = Math.floor((Math.max(0, ms) % 60000) / 1000);
      setLabel(`${h}j ${m}m ${String(s).padStart(2, "0")}d`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="tabular-nums">
      {prefix} <strong>{label ?? "…"}</strong>
    </span>
  );
}
