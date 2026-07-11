"use client";

import { useEffect, useRef } from "react";

/** Arah gerak pada game berbasis grid (Ular, Pacman). */
export type Dir = "up" | "down" | "left" | "right";

const KEY_DIRS: Record<string, Dir> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
  W: "up",
  S: "down",
  A: "left",
  D: "right",
};

/**
 * Dengarkan tombol panah + WASD dan teruskan sebagai arah. Tombol panah
 * di-preventDefault supaya halaman tidak ikut ter-scroll saat bermain.
 */
export function useKeyboardDirection(
  onDir: (dir: Dir) => void,
  enabled = true,
) {
  const onDirRef = useRef(onDir);
  onDirRef.current = onDir;

  useEffect(() => {
    if (!enabled) return;
    function handle(e: KeyboardEvent) {
      const dir = KEY_DIRS[e.key];
      if (!dir) return;
      if (e.key.startsWith("Arrow")) e.preventDefault();
      onDirRef.current(dir);
    }
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [enabled]);
}
