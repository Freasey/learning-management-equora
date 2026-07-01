"use client";

import { useState, useTransition } from "react";
import { RotateCw, CheckCircle2, TriangleAlert } from "lucide-react";
import { DemoCountdown } from "@/components/site/demo-countdown";
import { resetDemoNow } from "./actions";

/** Kartu kelola sekolah demo: hitung mundur reset otomatis + tombol reset manual. */
export function DemoResetCard() {
  const [pending, startTransition] = useTransition();
  const [lastReset, setLastReset] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleReset() {
    if (pending) return;
    if (
      !window.confirm(
        "Reset sekolah demo (DEMO01) sekarang? Semua perubahan pada sekolah demo akan hilang dan dibuat ulang. Sekolah lain tidak terpengaruh.",
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await resetDemoNow();
        setLastReset(new Date(res.at).toLocaleString("id-ID"));
      } catch {
        setError("Gagal me-reset sekolah demo. Coba lagi.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-line bg-paper p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-medium text-ink">
            Sekolah Demo
          </h3>
          <p className="mt-1 text-sm text-muted">
            <code className="rounded bg-line/40 px-1">DEMO01</code> · reset
            otomatis tiap 6 jam · <DemoCountdown />
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          disabled={pending}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
        >
          <RotateCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
          {pending ? "Mereset…" : "Reset sekarang"}
        </button>
      </div>

      {lastReset && !error && (
        <p className="mt-3 flex items-center gap-2 text-sm text-teal-700">
          <CheckCircle2 className="h-4 w-4" />
          Berhasil direset {lastReset}.
        </p>
      )}
      {error && (
        <p className="mt-3 flex items-center gap-2 text-sm text-red-700">
          <TriangleAlert className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
}
