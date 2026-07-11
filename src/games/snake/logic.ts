import type { Dir } from "../engine/input";

/**
 * Logika murni game Ular — tidak menyentuh canvas/DOM sama sekali, sehingga
 * bisa diuji otomatis tanpa browser: buat state → panggil tick() berulang →
 * periksa hasilnya.
 */

export type Cell = { x: number; y: number };

export type Fruit = {
  cell: Cell;
  /** Indeks opsi jawaban yang diwakili buah ini (0 = A, 1 = B, dst). */
  optionIndex: number;
};

export type SnakeState = {
  cols: number;
  rows: number;
  /** Sel-sel tubuh ular, kepala di indeks 0. */
  snake: Cell[];
  dir: Dir;
  /** Arah yang diminta pemain; baru diterapkan saat tick agar tidak bisa putar balik 180°. */
  pendingDir: Dir | null;
  fruits: Fruit[];
};

export type TickEvent =
  | { type: "ate"; optionIndex: number }
  | { type: "died" }
  | null;

const OPPOSITE: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const DELTA: Record<Dir, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function createSnakeState(opts: {
  cols: number;
  rows: number;
  optionCount: number;
  length: number;
  random?: () => number;
}): SnakeState {
  const { cols, rows, optionCount } = opts;
  const random = opts.random ?? Math.random;
  // Panjang maksimal setengah lebar arena agar spawn di tengah selalu muat.
  const length = Math.max(2, Math.min(opts.length, Math.floor(cols / 2)));

  const headY = Math.floor(rows / 2);
  const headX = Math.floor(cols / 2);
  const snake: Cell[] = [];
  for (let i = 0; i < length; i++) {
    snake.push({ x: headX - i, y: headY });
  }

  const state: SnakeState = {
    cols,
    rows,
    snake,
    dir: "right",
    pendingDir: null,
    fruits: [],
  };
  state.fruits = placeFruits(state, optionCount, random);
  return state;
}

/** Sebar buah di sel kosong, tidak menumpuk ular/buah lain dan tidak persis di depan kepala. */
function placeFruits(
  state: SnakeState,
  optionCount: number,
  random: () => number,
): Fruit[] {
  const occupied = new Set(state.snake.map((c) => `${c.x},${c.y}`));
  const head = state.snake[0];
  const fruits: Fruit[] = [];

  for (let i = 0; i < optionCount; i++) {
    let cell: Cell | null = null;
    for (let attempt = 0; attempt < 500 && !cell; attempt++) {
      const candidate = {
        x: Math.floor(random() * state.cols),
        y: Math.floor(random() * state.rows),
      };
      const key = `${candidate.x},${candidate.y}`;
      const nearHead =
        Math.abs(candidate.x - head.x) + Math.abs(candidate.y - head.y) < 3;
      if (!occupied.has(key) && !nearHead) {
        occupied.add(key);
        cell = candidate;
      }
    }
    // Arena 21×15 punya ratusan sel kosong; fallback ini praktis tak pernah terjadi.
    if (cell) fruits.push({ cell, optionIndex: i });
  }
  return fruits;
}

/** Minta belok. Putar balik 180° diabaikan (klasik aturan ular). */
export function requestDirection(state: SnakeState, dir: Dir): SnakeState {
  if (dir === OPPOSITE[state.dir]) return state;
  if (state.pendingDir === dir) return state;
  return { ...state, pendingDir: dir };
}

/** Majukan ular satu langkah. Memakan buah mengakhiri soal, jadi ular tidak tumbuh di sini. */
export function tick(state: SnakeState): { state: SnakeState; event: TickEvent } {
  const dir =
    state.pendingDir && state.pendingDir !== OPPOSITE[state.dir]
      ? state.pendingDir
      : state.dir;
  const head = state.snake[0];
  const next = { x: head.x + DELTA[dir].x, y: head.y + DELTA[dir].y };

  if (next.x < 0 || next.y < 0 || next.x >= state.cols || next.y >= state.rows) {
    return { state, event: { type: "died" } };
  }
  // Sel ekor ikut maju di tick yang sama, jadi menabrak posisi ekor lama tidak fatal.
  const body = state.snake.slice(0, -1);
  if (body.some((c) => c.x === next.x && c.y === next.y)) {
    return { state, event: { type: "died" } };
  }

  const snake = [next, ...state.snake.slice(0, -1)];
  const moved: SnakeState = { ...state, snake, dir, pendingDir: null };

  const fruit = state.fruits.find(
    (f) => f.cell.x === next.x && f.cell.y === next.y,
  );
  if (fruit) {
    return { state: moved, event: { type: "ate", optionIndex: fruit.optionIndex } };
  }
  return { state: moved, event: null };
}
