"use client";

import { useEffect, useRef } from "react";
import { DPad } from "../engine/dpad";
import { useKeyboardDirection, type Dir } from "../engine/input";
import type { GameOutcome, GameQuestion } from "../types";
import {
  createPacmanState,
  pacmanTick,
  requestPacmanDirection,
  PACMAN_COLS,
  PACMAN_ROWS,
  type PacmanState,
} from "./logic";

const CELL = 30;

// Palet "Scholarly Calm" + warna khas game (canvas tidak bisa membaca kelas Tailwind).
const COLOR_FLOOR = "#fbf9f4"; // paper
const COLOR_WALL = "#0e3a3a"; // teal-900
const COLOR_FRUIT = "#c8783c"; // accent
const COLOR_PLAYER = "#e8b429"; // kuning pacman
const GHOST_COLORS = ["#c0453c", "#7d5ba6"];

const LETTERS = ["A", "B", "C", "D", "E"];

/**
 * Kulit game Pacman — kontrak sama dengan SnakeGame: dipasang per soal,
 * melapor tepat satu GameOutcome (makan buah = jawab, kena hantu = kalah).
 */
export function PacmanGame({
  question,
  speedMs = 160,
  paused = false,
  onOutcome,
}: {
  question: GameQuestion;
  speedMs?: number;
  paused?: boolean;
  onOutcome: (outcome: GameOutcome) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<PacmanState | null>(null);
  const doneRef = useRef(false);
  const onOutcomeRef = useRef(onOutcome);
  useEffect(() => {
    onOutcomeRef.current = onOutcome;
  }, [onOutcome]);

  if (stateRef.current === null) {
    stateRef.current = createPacmanState({ optionCount: question.options.length });
  }

  function handleDir(dir: Dir) {
    if (doneRef.current || !stateRef.current) return;
    stateRef.current = requestPacmanDirection(stateRef.current, dir);
  }

  useKeyboardDirection(handleDir, !paused);

  useEffect(() => {
    draw(canvasRef.current, stateRef.current);
    if (paused) return;

    const id = window.setInterval(() => {
      if (doneRef.current || !stateRef.current) return;
      const { state, event } = pacmanTick(stateRef.current);
      stateRef.current = state;
      draw(canvasRef.current, state);
      if (event) {
        doneRef.current = true;
        window.clearInterval(id);
        onOutcomeRef.current(
          event.type === "ate"
            ? { kind: "answer", choiceIndex: event.optionIndex }
            : { kind: "death" },
        );
      }
    }, speedMs);
    return () => window.clearInterval(id);
  }, [paused, speedMs]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        className="w-full max-w-[630px] rounded-xl border border-line"
        style={{ aspectRatio: `${PACMAN_COLS} / ${PACMAN_ROWS}` }}
      />
      <DPad onDir={handleDir} />
    </div>
  );
}

function draw(canvas: HTMLCanvasElement | null, state: PacmanState | null) {
  if (!canvas || !state) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = state.cols * CELL;
  const h = state.rows * CELL;
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = COLOR_FLOOR;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = COLOR_WALL;
  for (let y = 0; y < state.rows; y++) {
    for (let x = 0; x < state.cols; x++) {
      if (!state.walls[y][x]) continue;
      ctx.beginPath();
      ctx.roundRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2, 4);
      ctx.fill();
    }
  }

  for (const fruit of state.fruits) {
    const cx = fruit.cell.x * CELL + CELL / 2;
    const cy = fruit.cell.y * CELL + CELL / 2;
    ctx.fillStyle = COLOR_FRUIT;
    ctx.beginPath();
    ctx.arc(cx, cy, CELL * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 15px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(LETTERS[fruit.optionIndex] ?? "?", cx, cy + 1);
  }

  // Pemain: lingkaran kuning dengan "mulut" menghadap arah gerak.
  const px = state.player.x * CELL + CELL / 2;
  const py = state.player.y * CELL + CELL / 2;
  const mouthAngle: Record<Dir, number> = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
  const facing = mouthAngle[state.playerDir ?? "right"];
  ctx.fillStyle = COLOR_PLAYER;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.arc(px, py, CELL * 0.42, facing + 0.5, facing - 0.5 + Math.PI * 2);
  ctx.closePath();
  ctx.fill();

  state.ghosts.forEach((g, i) => {
    const gx = g.cell.x * CELL + CELL / 2;
    const gy = g.cell.y * CELL + CELL / 2;
    const r = CELL * 0.4;
    ctx.fillStyle = GHOST_COLORS[i % GHOST_COLORS.length];
    ctx.beginPath();
    ctx.arc(gx, gy - r * 0.2, r, Math.PI, 0);
    ctx.lineTo(gx + r, gy + r * 0.8);
    ctx.lineTo(gx - r, gy + r * 0.8);
    ctx.closePath();
    ctx.fill();
    // Mata putih supaya hantu tetap terbaca bagi siswa buta warna.
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(gx - r * 0.35, gy - r * 0.25, r * 0.22, 0, Math.PI * 2);
    ctx.arc(gx + r * 0.35, gy - r * 0.25, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1d2422";
    ctx.beginPath();
    ctx.arc(gx - r * 0.3, gy - r * 0.25, r * 0.1, 0, Math.PI * 2);
    ctx.arc(gx + r * 0.4, gy - r * 0.25, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  });
}
