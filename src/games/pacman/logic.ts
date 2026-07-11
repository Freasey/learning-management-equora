import type { Dir } from "../engine/input";
import type { Cell, Fruit } from "../snake/logic";

/**
 * Logika murni game Pacman  seperti snake/logic.ts, tidak menyentuh
 * canvas/DOM sehingga bisa diuji otomatis tanpa browser.
 *
 * Labirin tetap (template di bawah): `#` tembok, `.` lorong, `A`–`D` titik
 * buah jawaban, `P` posisi awal pemain, `G` posisi awal hantu. Huruf pada
 * template hanya menandai TEMPAT buah  opsi mana yang menempati tempat mana
 * diacak tiap soal supaya jawaban benar tidak selalu di pojok yang sama.
 */

const MAZE = [
  "#####################",
  "#A........#........B#",
  "#.###.###.#.###.###.#",
  "#...................#",
  "###.#.#########.#.###",
  "#...#.....#.....#...#",
  "#.###.###.#.###.###.#",
  "#.....#...G...#.....#",
  "#.###.#.##.##.#.###.#",
  "#.........G.........#",
  "###.#.#########.#.###",
  "#...#.....#.....#...#",
  "#.###.###.#.###.###.#",
  "#C........P........D#",
  "#####################",
];

export const PACMAN_COLS = MAZE[0].length;
export const PACMAN_ROWS = MAZE.length;

export type Ghost = { cell: Cell; dir: Dir };

export type PacmanState = {
  cols: number;
  rows: number;
  /** walls[y][x] = true bila tembok. */
  walls: boolean[][];
  fruits: Fruit[];
  player: Cell;
  playerDir: Dir | null;
  /** Belokan yang diminta; disimpan sampai bisa dilakukan (gaya pacman). */
  pendingDir: Dir | null;
  ghosts: Ghost[];
  tickCount: number;
};

export type PacmanTickEvent =
  | { type: "ate"; optionIndex: number }
  | { type: "died" }
  | null;

const DELTA: Record<Dir, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const DIRS: Dir[] = ["up", "down", "left", "right"];

export function createPacmanState(opts: {
  optionCount: number;
  random?: () => number;
}): PacmanState {
  const random = opts.random ?? Math.random;
  const walls: boolean[][] = [];
  const fruitSpots: Cell[] = [];
  const ghosts: Ghost[] = [];
  let player: Cell = { x: 1, y: 1 };

  MAZE.forEach((row, y) => {
    walls.push([]);
    [...row].forEach((ch, x) => {
      walls[y].push(ch === "#");
      if (ch >= "A" && ch <= "D") fruitSpots.push({ x, y });
      if (ch === "G") ghosts.push({ cell: { x, y }, dir: "left" });
      if (ch === "P") player = { x, y };
    });
  });

  // Acak opsi mana yang menempati tempat buah mana.
  const order = fruitSpots.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const fruits: Fruit[] = [];
  for (let i = 0; i < Math.min(opts.optionCount, fruitSpots.length); i++) {
    fruits.push({ cell: fruitSpots[order[i]], optionIndex: i });
  }

  return {
    cols: PACMAN_COLS,
    rows: PACMAN_ROWS,
    walls,
    fruits,
    player,
    playerDir: null,
    pendingDir: null,
    ghosts,
    tickCount: 0,
  };
}

export function requestPacmanDirection(state: PacmanState, dir: Dir): PacmanState {
  if (state.pendingDir === dir) return state;
  return { ...state, pendingDir: dir };
}

function isWall(state: PacmanState, cell: Cell): boolean {
  if (cell.x < 0 || cell.y < 0 || cell.x >= state.cols || cell.y >= state.rows) return true;
  return state.walls[cell.y][cell.x];
}

function step(cell: Cell, dir: Dir): Cell {
  return { x: cell.x + DELTA[dir].x, y: cell.y + DELTA[dir].y };
}

/** Satu langkah dunia: pemain bergerak, lalu hantu mengejar. */
export function pacmanTick(
  state: PacmanState,
  random: () => number = Math.random,
): { state: PacmanState; event: PacmanTickEvent } {
  const tickCount = state.tickCount + 1;

  // ── Pemain: belokan tertunda dipakai begitu memungkinkan; mentok = diam.
  let playerDir = state.playerDir;
  let pendingDir = state.pendingDir;
  if (pendingDir && !isWall(state, step(state.player, pendingDir))) {
    playerDir = pendingDir;
    pendingDir = null;
  }
  const prevPlayer = state.player;
  let player = state.player;
  if (playerDir && !isWall(state, step(state.player, playerDir))) {
    player = step(state.player, playerDir);
  }

  // Tertangkap hantu di sel yang baru dimasuki?
  if (state.ghosts.some((g) => g.cell.x === player.x && g.cell.y === player.y)) {
    return { state: { ...state, player, playerDir, pendingDir, tickCount }, event: { type: "died" } };
  }

  // Makan buah?
  const fruit = state.fruits.find((f) => f.cell.x === player.x && f.cell.y === player.y);
  if (fruit) {
    return {
      state: { ...state, player, playerDir, pendingDir, tickCount },
      event: { type: "ate", optionIndex: fruit.optionIndex },
    };
  }

  // ── Hantu: mengejar secara rakus, sedikit acak; jeda tiap tick ke-4 supaya
  //   pemain sedikit lebih cepat (bisa lolos dari kejaran lurus).
  let ghosts = state.ghosts;
  let died = false;
  if (tickCount % 4 !== 0) {
    ghosts = state.ghosts.map((g) => {
      const options = DIRS.filter((d) => !isWall(state, step(g.cell, d)));
      if (options.length === 0) return g;
      // Jangan putar balik kecuali buntu.
      const forward = options.filter((d) => d !== OPPOSITE[g.dir]);
      const pool = forward.length > 0 ? forward : options;
      let dir: Dir;
      if (random() < 0.75) {
        dir = pool.reduce((best, d) => {
          const bc = step(g.cell, best);
          const dc = step(g.cell, d);
          const bDist = Math.abs(bc.x - player.x) + Math.abs(bc.y - player.y);
          const dDist = Math.abs(dc.x - player.x) + Math.abs(dc.y - player.y);
          return dDist < bDist ? d : best;
        }, pool[0]);
      } else {
        dir = pool[Math.floor(random() * pool.length)];
      }
      const cell = step(g.cell, dir);
      // Tabrakan: menempati sel pemain, atau bertukar tempat dengan pemain.
      if (
        (cell.x === player.x && cell.y === player.y) ||
        (g.cell.x === player.x && g.cell.y === player.y && cell.x === prevPlayer.x && cell.y === prevPlayer.y)
      ) {
        died = true;
      }
      return { cell, dir };
    });
  }

  const next: PacmanState = { ...state, player, playerDir, pendingDir, ghosts, tickCount };
  return { state: next, event: died ? { type: "died" } : null };
}
