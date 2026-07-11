"use client";

import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dir } from "./input";

const BTN =
  "grid h-14 w-14 select-none place-items-center rounded-xl border border-line bg-paper text-ink shadow-sm transition-colors active:bg-sand-deep touch-manipulation";

/**
 * Kontroler arah di layar (klik/sentuh)  dipakai semua game grid, terutama
 * untuk pemain HP yang tidak punya keyboard. onPointerDown (bukan onClick)
 * supaya responnya instan saat disentuh.
 */
export function DPad({
  onDir,
  className,
}: {
  onDir: (dir: Dir) => void;
  className?: string;
}) {
  function press(dir: Dir) {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      onDir(dir);
    };
  }

  return (
    <div className={cn("grid w-fit grid-cols-3 gap-1.5", className)}>
      <div />
      <button type="button" aria-label="Atas" className={BTN} onPointerDown={press("up")}>
        <ArrowUp className="h-6 w-6" />
      </button>
      <div />
      <button type="button" aria-label="Kiri" className={BTN} onPointerDown={press("left")}>
        <ArrowLeft className="h-6 w-6" />
      </button>
      <div />
      <button type="button" aria-label="Kanan" className={BTN} onPointerDown={press("right")}>
        <ArrowRight className="h-6 w-6" />
      </button>
      <div />
      <button type="button" aria-label="Bawah" className={BTN} onPointerDown={press("down")}>
        <ArrowDown className="h-6 w-6" />
      </button>
      <div />
    </div>
  );
}
