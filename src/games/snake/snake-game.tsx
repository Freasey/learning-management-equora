"use client";

import { useEffect, useRef } from "react";
import { DPad } from "../engine/dpad";
import { useKeyboardDirection, type Dir } from "../engine/input";
import type { GameOutcome, GameQuestion } from "../types";
import {
  createSnakeState,
  requestDirection,
  tick,
  type SnakeState,
} from "./logic";

const COLS = 21;
const ROWS = 15;
const CELL = 30;

// Palet "Scholarly Calm" (globals.css) — canvas tidak bisa membaca kelas
// Tailwind, jadi nilai hex-nya disalin ke sini.
const COLOR_BG = "#fbf9f4"; // paper
const COLOR_GRID = "#ddd4c4"; // line
const COLOR_BODY = "#2f8f8a"; // teal-500
const COLOR_HEAD = "#155e5e"; // teal-700
const COLOR_FRUIT = "#c8783c"; // accent

const LETTERS = ["A", "B", "C", "D", "E"];

/**
 * Kulit game Ular. Dipasang sekali per soal (parent me-remount lewat `key`);
 * melapor tepat satu GameOutcome lalu berhenti. Panjang ular lintas-soal
 * adalah urusan rangka — dioper masuk lewat `snakeLength`.
 */
export function SnakeGame({
  question,
  snakeLength,
  speedMs = 150,
  paused = false,
  onOutcome,
}: {
  question: GameQuestion;
  snakeLength: number;
  speedMs?: number;
  paused?: boolean;
  onOutcome: (outcome: GameOutcome) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<SnakeState | null>(null);
  const doneRef = useRef(false);
  const onOutcomeRef = useRef(onOutcome);
  useEffect(() => {
    onOutcomeRef.current = onOutcome;
  }, [onOutcome]);

  if (stateRef.current === null) {
    stateRef.current = createSnakeState({
      cols: COLS,
      rows: ROWS,
      optionCount: question.options.length,
      length: snakeLength,
    });
  }

  function handleDir(dir: Dir) {
    if (doneRef.current || !stateRef.current) return;
    stateRef.current = requestDirection(stateRef.current, dir);
  }

  useKeyboardDirection(handleDir, !paused);

  useEffect(() => {
    draw(canvasRef.current, stateRef.current);
    if (paused) return;

    const id = window.setInterval(() => {
      if (doneRef.current || !stateRef.current) return;
      const { state, event } = tick(stateRef.current);
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
        style={{ aspectRatio: `${COLS} / ${ROWS}` }}
      />
      <DPad onDir={handleDir} />
    </div>
  );
}

function draw(canvas: HTMLCanvasElement | null, state: SnakeState | null) {
  if (!canvas || !state) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = COLS * CELL;
  const h = ROWS * CELL;
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = COLOR_GRID;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1;
  for (let x = 1; x < COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL + 0.5, 0);
    ctx.lineTo(x * CELL + 0.5, h);
    ctx.stroke();
  }
  for (let y = 1; y < ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL + 0.5);
    ctx.lineTo(w, y * CELL + 0.5);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

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

  state.snake.forEach((cell, i) => {
    ctx.fillStyle = i === 0 ? COLOR_HEAD : COLOR_BODY;
    const pad = i === 0 ? 2 : 3;
    ctx.beginPath();
    ctx.roundRect(
      cell.x * CELL + pad,
      cell.y * CELL + pad,
      CELL - pad * 2,
      CELL - pad * 2,
      6,
    );
    ctx.fill();
  });
}
