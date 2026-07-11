"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Gamepad2,
  Play,
  RotateCw,
  Settings2,
  Skull,
  TimerOff,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GAME_CATALOG, type GameTypeId } from "@/games/catalog";
import { SnakeGame } from "@/games/snake/snake-game";
import type { GameOutcome } from "@/games/types";

/** Soal dummy khusus arena — di aplikasi nyata soal datang dari kuis guru. */
const DUMMY_QUESTIONS = [
  { text: "Hasil dari 5 × 6 adalah …", options: ["11", "30", "56", "25"], correctIndex: 1 },
  { text: "Planet terdekat dari Matahari adalah …", options: ["Venus", "Bumi", "Merkurius", "Mars"], correctIndex: 2 },
  { text: "Sinonim kata “gembira” adalah …", options: ["Sedih", "Marah", "Takut", "Senang"], correctIndex: 3 },
  { text: "Air membeku pada suhu …", options: ["0 °C", "100 °C", "50 °C", "−10 °C"], correctIndex: 0 },
  { text: "Hasil dari 15 − 7 + 2 adalah …", options: ["8", "12", "10", "6"], correctIndex: 2 },
];

const LETTERS = ["A", "B", "C", "D"];
const START_LENGTH = 3;
const MAX_LENGTH = 15;

const SPEEDS = [
  { label: "Santai", ms: 200 },
  { label: "Normal", ms: 150 },
  { label: "Cepat", ms: 110 },
];

type Phase = "setup" | "read" | "play" | "feedback" | "done";

type ResultCause = "correct" | "wrong-choice" | "death" | "timeout";

type ArenaResult = {
  cause: ResultCause;
  chosenIndex: number | null;
};

const CAUSE_LABEL: Record<ResultCause, string> = {
  correct: "Benar",
  "wrong-choice": "Salah — pilih jawaban keliru",
  death: "Salah — kalah di game",
  timeout: "Salah — waktu habis",
};

export function ArenaClient() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [gameId, setGameId] = useState<GameTypeId>("snake");
  const [speedMs, setSpeedMs] = useState(150);
  const [readSec, setReadSec] = useState(20);
  const [playSec, setPlaySec] = useState(60);

  const [qIndex, setQIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [snakeLength, setSnakeLength] = useState(START_LENGTH);
  const [results, setResults] = useState<ArenaResult[]>([]);
  // Cegah satu soal tercatat dua kali bila timeout & hasil game berbarengan.
  const finishedRef = useRef(false);

  const question = DUMMY_QUESTIONS[qIndex];

  // Detak hitung mundur untuk fase baca & fase main.
  useEffect(() => {
    if (phase !== "read" && phase !== "play") return;
    const id = window.setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => window.clearInterval(id);
  }, [phase, qIndex]);

  // Waktu habis: fase baca → langsung main; fase main → tercatat salah (timeout).
  useEffect(() => {
    if (countdown > 0) return;
    if (phase === "read") startPlay();
    if (phase === "play") finishQuestion({ cause: "timeout", chosenIndex: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, phase]);

  function startQuiz() {
    setResults([]);
    setSnakeLength(START_LENGTH);
    beginRead(0);
  }

  function beginRead(index: number) {
    finishedRef.current = false;
    setQIndex(index);
    setCountdown(readSec);
    setPhase("read");
  }

  function startPlay() {
    setCountdown(playSec);
    setPhase("play");
  }

  function finishQuestion(result: ArenaResult) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setResults((rs) => [...rs, result]);
    // Aturan panjang ular: benar = memanjang, kalah di game = reset pendek.
    if (result.cause === "correct") {
      setSnakeLength((l) => Math.min(l + 2, MAX_LENGTH));
    } else if (result.cause === "death") {
      setSnakeLength(START_LENGTH);
    }
    setPhase("feedback");
  }

  function handleOutcome(outcome: GameOutcome) {
    if (outcome.kind === "death") {
      finishQuestion({ cause: "death", chosenIndex: null });
      return;
    }
    finishQuestion({
      cause: outcome.choiceIndex === question.correctIndex ? "correct" : "wrong-choice",
      chosenIndex: outcome.choiceIndex,
    });
  }

  function nextQuestion() {
    const next = qIndex + 1;
    if (next >= DUMMY_QUESTIONS.length) setPhase("done");
    else beginRead(next);
  }

  /* ---------------------------------- setup ---------------------------------- */

  if (phase === "setup") {
    return (
      <div className="rounded-xl border border-line bg-paper p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-medium text-ink">
          <Settings2 className="h-5 w-5 text-teal-700" /> Pengaturan Uji Coba
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {GAME_CATALOG.map((game) => (
            <button
              key={game.id}
              type="button"
              disabled={!game.available}
              onClick={() => setGameId(game.id)}
              className={cn(
                "rounded-xl border p-4 text-left transition-colors",
                gameId === game.id && game.available
                  ? "border-teal-700 bg-teal-700/5"
                  : "border-line bg-paper hover:bg-sand/40",
                !game.available && "cursor-not-allowed opacity-60",
              )}
            >
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-teal-700" />
                <span className="font-semibold text-ink">{game.label}</span>
                {!game.available && (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                    Segera
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted">{game.description}</p>
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium text-ink">Kecepatan ular</span>
            <select
              value={speedMs}
              onChange={(e) => setSpeedMs(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
            >
              {SPEEDS.map((s) => (
                <option key={s.ms} value={s.ms}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink">Waktu baca (detik)</span>
            <input
              type="number"
              min={3}
              max={120}
              value={readSec}
              onChange={(e) => setReadSec(Math.max(3, Number(e.target.value) || 3))}
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink">Waktu main (detik)</span>
            <input
              type="number"
              min={10}
              max={300}
              value={playSec}
              onChange={(e) => setPlaySec(Math.max(10, Number(e.target.value) || 10))}
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={startQuiz}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
        >
          <Play className="h-4 w-4" /> Mulai ({DUMMY_QUESTIONS.length} soal dummy)
        </button>
      </div>
    );
  }

  /* ---------------------------------- rekap ---------------------------------- */

  if (phase === "done") {
    const correct = results.filter((r) => r.cause === "correct").length;
    return (
      <div className="rounded-xl border border-line bg-paper p-6">
        <h2 className="font-display text-lg font-medium text-ink">Rekap Uji Coba</h2>
        <p className="mt-1 text-sm text-muted">
          {correct} dari {DUMMY_QUESTIONS.length} soal benar.
        </p>

        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-muted">
              <th className="py-2 pr-3 font-medium">No</th>
              <th className="py-2 pr-3 font-medium">Soal</th>
              <th className="py-2 pr-3 font-medium">Jawaban</th>
              <th className="py-2 font-medium">Hasil</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} className="border-b border-line/60">
                <td className="py-2 pr-3 text-muted">{i + 1}</td>
                <td className="py-2 pr-3 text-ink">{DUMMY_QUESTIONS[i].text}</td>
                <td className="py-2 pr-3 text-ink">
                  {r.chosenIndex === null ? "—" : LETTERS[r.chosenIndex]}
                </td>
                <td
                  className={cn(
                    "py-2 font-medium",
                    r.cause === "correct" ? "text-teal-700" : "text-red-700",
                  )}
                >
                  {CAUSE_LABEL[r.cause]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={startQuiz}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
          >
            <RotateCw className="h-4 w-4" /> Main Lagi
          </button>
          <button
            type="button"
            onClick={() => setPhase("setup")}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-paper px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-sand/40"
          >
            <Settings2 className="h-4 w-4" /> Ubah Pengaturan
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------- fase baca / main / umpan balik ------------------------- */

  const lastResult = results[results.length - 1];

  return (
    <div className="rounded-xl border border-line bg-paper p-6">
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="font-mono text-muted">
          Soal {qIndex + 1}/{DUMMY_QUESTIONS.length}
        </span>
        {(phase === "read" || phase === "play") && (
          <span
            className={cn(
              "rounded-full px-3 py-1 font-mono font-semibold",
              countdown <= 5 ? "bg-red-100 text-red-700" : "bg-teal-700/10 text-teal-700",
            )}
          >
            {phase === "read" ? "Baca dulu" : "Main"} · {Math.max(countdown, 0)} dtk
          </span>
        )}
      </div>

      <p
        className={cn(
          "font-display text-ink",
          phase === "read" ? "text-2xl" : "text-base",
        )}
      >
        {question.text}
      </p>

      <div
        className={cn(
          "mt-3 grid gap-2",
          phase === "read" ? "sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-4",
        )}
      >
        {question.options.map((opt, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-2 rounded-lg border border-line bg-sand/40 px-3 py-2",
              phase === "read" ? "text-base" : "text-sm",
            )}
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-white">
              {LETTERS[i]}
            </span>
            <span className="text-ink">{opt}</span>
          </div>
        ))}
      </div>

      {phase === "read" && (
        <button
          type="button"
          onClick={startPlay}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
        >
          <Play className="h-4 w-4" /> Langsung Main
        </button>
      )}

      {phase === "play" && (
        <div className="mt-5">
          <SnakeGame
            key={qIndex}
            question={question}
            snakeLength={snakeLength}
            speedMs={speedMs}
            onOutcome={handleOutcome}
          />
          <p className="mt-3 text-center text-xs text-muted">
            Gerakkan dengan tombol panah / WASD, atau tombol arah di atas.
            Makan buah berlabel huruf jawabanmu.
          </p>
        </div>
      )}

      {phase === "feedback" && lastResult && (
        <div
          className={cn(
            "mt-5 rounded-xl border p-4",
            lastResult.cause === "correct"
              ? "border-teal-700/40 bg-teal-700/5"
              : "border-red-200 bg-red-50",
          )}
        >
          <p
            className={cn(
              "flex items-center gap-2 font-semibold",
              lastResult.cause === "correct" ? "text-teal-700" : "text-red-700",
            )}
          >
            {lastResult.cause === "correct" && <CheckCircle2 className="h-5 w-5" />}
            {lastResult.cause === "wrong-choice" && <XCircle className="h-5 w-5" />}
            {lastResult.cause === "death" && <Skull className="h-5 w-5" />}
            {lastResult.cause === "timeout" && <TimerOff className="h-5 w-5" />}
            {CAUSE_LABEL[lastResult.cause]}
          </p>
          {lastResult.cause !== "correct" && (
            <p className="mt-1 text-sm text-ink">
              Jawaban yang benar: <strong>{LETTERS[question.correctIndex]}</strong> —{" "}
              {question.options[question.correctIndex]}
            </p>
          )}
          <button
            type="button"
            onClick={nextQuestion}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
          >
            {qIndex + 1 >= DUMMY_QUESTIONS.length ? "Lihat Rekap" : "Soal Berikutnya"}
          </button>
        </div>
      )}
    </div>
  );
}
