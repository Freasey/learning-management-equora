"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PacmanGame } from "@/games/pacman/pacman-game";
import { SnakeGame } from "@/games/snake/snake-game";
import type { GameOutcome } from "@/games/types";
import { answerGameQuestion, finishGameAttempt, startGameAttempt } from "../actions";

/**
 * Rangka mode game di sisi siswa. Kunci jawaban TIDAK ada di sini — tiap soal
 * dinilai server lewat answerGameQuestion. Reload halaman aman: attempt
 * "playing" dilanjutkan dari soal pertama yang belum terjawab (answeredIds).
 */

const READ_SEC = 20;
/** Jeda siap-siap sebelum game bergerak (papan tampil beku + hitung mundur). */
const READY_SEC = 3;
const PLAY_SEC = 60;
const SNAKE_START = 3;
const SNAKE_MAX = 15;
const LETTERS = ["A", "B", "C", "D"];

export type GameQuestionRow = {
  id: string;
  text: string;
  options: string[];
  points: number;
};

type Phase = "start" | "read" | "ready" | "play" | "feedback" | "finishing";

type Feedback = {
  correct: boolean;
  correctIndex: number;
  cause: "answer" | "death" | "timeout";
};

export function GamePlayer({
  assessmentId,
  gameType,
  questions,
  initialAttemptId,
  answeredIds,
}: {
  assessmentId: string;
  gameType: string;
  questions: GameQuestionRow[];
  initialAttemptId: string | null;
  answeredIds: string[];
}) {
  const router = useRouter();
  // Antrean soal yang belum terjawab (dibekukan saat mount — resume dari sini).
  const [queue] = useState(() => {
    const done = new Set(answeredIds);
    return questions.filter((q) => !done.has(q.id));
  });

  const [attemptId, setAttemptId] = useState(initialAttemptId);
  const [phase, setPhase] = useState<Phase>(() =>
    initialAttemptId && queue.length > 0 ? "read" : initialAttemptId ? "finishing" : "start",
  );
  const [qPos, setQPos] = useState(0);
  const [countdown, setCountdown] = useState(READ_SEC);
  const [snakeLength, setSnakeLength] = useState(SNAKE_START);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Cegah satu soal terkirim dua kali (timeout & hasil game berbarengan).
  const sentRef = useRef(false);
  // Simpan hasil game terakhir supaya bisa dikirim ulang bila jaringan gagal.
  const lastPayloadRef = useRef<{ cause: Feedback["cause"]; choiceIndex: number | null } | null>(null);

  const question = queue[qPos];

  // Detak hitung mundur fase baca, bersiap, dan main.
  useEffect(() => {
    if (phase !== "read" && phase !== "ready" && phase !== "play") return;
    const id = window.setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => window.clearInterval(id);
  }, [phase, qPos]);

  // Hitung mundur habis: baca → bersiap 3 dtk; bersiap → main; main → timeout.
  useEffect(() => {
    if (countdown > 0) return;
    if (phase === "read") beginReady();
    if (phase === "ready") startPlay();
    if (phase === "play") void submitOutcome("timeout", null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, phase]);

  // Semua soal sudah terjawab (mis. finish gagal sebelum reload) → tutup attempt.
  useEffect(() => {
    if (phase === "finishing") void finishAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function handleStart() {
    setBusy(true);
    setError(null);
    try {
      const res = await startGameAttempt(assessmentId);
      setAttemptId(res.attemptId);
      beginRead(0);
    } catch {
      setError("Gagal memulai. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  function beginRead(pos: number) {
    sentRef.current = false;
    lastPayloadRef.current = null;
    setFeedback(null);
    setQPos(pos);
    setCountdown(READ_SEC);
    setPhase("read");
  }

  function beginReady() {
    setCountdown(READY_SEC);
    setPhase("ready");
  }

  function startPlay() {
    setCountdown(PLAY_SEC);
    setPhase("play");
  }

  function handleOutcome(outcome: GameOutcome) {
    if (outcome.kind === "answer") void submitOutcome("answer", outcome.choiceIndex);
    else void submitOutcome("death", null);
  }

  async function submitOutcome(cause: Feedback["cause"], choiceIndex: number | null) {
    if (sentRef.current || !attemptId || !question) return;
    sentRef.current = true;
    lastPayloadRef.current = { cause, choiceIndex };
    setBusy(true);
    setError(null);
    try {
      const res = await answerGameQuestion({
        attemptId,
        questionId: question.id,
        cause,
        choiceIndex,
      });
      if (cause === "answer" ? res.correct : false) {
        setSnakeLength((l) => Math.min(l + 2, SNAKE_MAX));
      } else if (cause === "death") {
        setSnakeLength(SNAKE_START);
      }
      setFeedback({ ...res, cause });
      setPhase("feedback");
    } catch {
      setError("Jawaban belum tersimpan. Periksa koneksi lalu kirim ulang.");
      setPhase("feedback");
    } finally {
      setBusy(false);
    }
  }

  async function retrySend() {
    const p = lastPayloadRef.current;
    if (!p) return;
    sentRef.current = false;
    await submitOutcome(p.cause, p.choiceIndex);
  }

  function nextQuestion() {
    const next = qPos + 1;
    if (next >= queue.length) setPhase("finishing");
    else beginRead(next);
  }

  async function finishAll() {
    if (!attemptId) return;
    try {
      await finishGameAttempt(attemptId);
      router.refresh(); // halaman server akan menampilkan hasil
    } catch {
      setError("Gagal menyimpan hasil. Coba muat ulang halaman.");
    }
  }

  /* ------------------------------- layar mulai ------------------------------- */

  if (phase === "start") {
    return (
      <div className="rounded-3xl border-2 border-slate-200/70 bg-white p-6 text-center">
        <div className="text-5xl">{gameType === "snake" ? "🐍" : "👻"}</div>
        <h2 className="mt-3 font-kid-display text-2xl font-extrabold text-slate-800">
          Kuis Mode Game: {gameType === "snake" ? "Ular" : "Pacman"}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          Baca soalnya ({READ_SEC} detik), lalu {gameType === "snake"
            ? "arahkan ular memakan buah berlabel huruf jawabanmu. Jangan menabrak tembok atau badanmu sendiri"
            : "susuri labirin dan makan buah berlabel huruf jawabanmu. Jangan sampai tertangkap hantu"}
          ! Kalah atau kehabisan waktu dihitung salah. Total {queue.length} soal.
        </p>
        {error && <p className="mt-3 text-sm font-bold text-coral">{error}</p>}
        <button
          type="button"
          onClick={handleStart}
          disabled={busy}
          className="mt-5 rounded-2xl bg-coral px-8 py-4 text-base font-extrabold text-white shadow-[0_4px_0_#d8503f] transition active:translate-y-1 active:shadow-[0_1px_0_#d8503f] disabled:opacity-60"
        >
          {busy ? "Menyiapkan…" : "Mulai Main!"}
        </button>
      </div>
    );
  }

  /* ------------------------------ layar penutup ------------------------------ */

  if (phase === "finishing") {
    return (
      <div className="rounded-3xl border-2 border-slate-200/70 bg-white p-8 text-center">
        <p className="font-kid-display text-xl font-extrabold text-slate-700">
          {error ?? "Menyimpan hasilmu…"}
        </p>
      </div>
    );
  }

  if (!question) return null;

  /* ------------------------ fase baca / main / umpan balik ------------------------ */

  return (
    <div className="rounded-3xl border-2 border-slate-200/70 bg-white p-5">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-bold text-slate-500">
          Soal {questions.length - queue.length + qPos + 1}/{questions.length}
        </span>
        {(phase === "read" || phase === "ready" || phase === "play") && (
          <span
            className={`rounded-full px-3 py-1 font-bold ${
              phase === "play" && countdown <= 5 ? "bg-coral/15 text-coral" : "bg-sky/15 text-sky"
            }`}
          >
            {phase === "read" ? "Baca dulu" : phase === "ready" ? "Bersiap" : "Main"} ·{" "}
            {Math.max(countdown, 0)} dtk
          </span>
        )}
      </div>

      <p className={`font-bold text-slate-800 ${phase === "read" ? "text-xl" : "text-base"}`}>
        {question.text}
      </p>

      <div className={`mt-3 grid gap-2 ${phase === "read" ? "sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
        {question.options.map((opt, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-coral text-xs font-extrabold text-white">
              {LETTERS[i]}
            </span>
            <span className="font-semibold text-slate-700">{opt}</span>
          </div>
        ))}
      </div>

      {phase === "read" && (
        <button
          type="button"
          onClick={beginReady}
          className="mt-5 w-full rounded-2xl bg-sky py-3 text-base font-extrabold text-white shadow-[0_4px_0_#3a8fc2] transition active:translate-y-1 active:shadow-[0_1px_0_#3a8fc2]"
        >
          Langsung Main!
        </button>
      )}

      {(phase === "ready" || phase === "play") && (
        <div className="mt-4">
          <div className="relative">
            {gameType === "snake" ? (
              <SnakeGame
                key={question.id}
                question={question}
                snakeLength={snakeLength}
                paused={phase === "ready"}
                onOutcome={handleOutcome}
              />
            ) : (
              <PacmanGame
                key={question.id}
                question={question}
                paused={phase === "ready"}
                onOutcome={handleOutcome}
              />
            )}
            {phase === "ready" && (
              <div className="absolute inset-0 grid place-items-center rounded-2xl bg-slate-800/30">
                <span className="font-kid-display text-8xl font-extrabold text-white drop-shadow-lg">
                  {Math.max(countdown, 1)}
                </span>
              </div>
            )}
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">
            Panah / WASD di keyboard, atau tombol arah di atas. Makan buah berlabel
            huruf jawabanmu!
          </p>
        </div>
      )}

      {phase === "feedback" && (
        <div
          className={`mt-4 rounded-2xl p-4 text-center ${
            error
              ? "bg-amber-50"
              : feedback?.correct
                ? "bg-mint/10"
                : "bg-coral/10"
          }`}
        >
          {error ? (
            <>
              <p className="font-bold text-amber-700">{error}</p>
              <button
                type="button"
                onClick={retrySend}
                disabled={busy}
                className="mt-3 rounded-2xl bg-amber-500 px-6 py-2.5 text-sm font-extrabold text-white disabled:opacity-60"
              >
                {busy ? "Mengirim…" : "Kirim Ulang"}
              </button>
            </>
          ) : (
            feedback && (
              <>
                <p className={`font-kid-display text-2xl font-extrabold ${feedback.correct ? "text-mint" : "text-coral"}`}>
                  {feedback.correct
                    ? "Benar! 🎉"
                    : feedback.cause === "death"
                      ? "Yah, kalah di game 💥"
                      : feedback.cause === "timeout"
                        ? "Waktu habis ⏰"
                        : "Belum tepat 😅"}
                </p>
                {!feedback.correct && (
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    Jawaban yang benar: {LETTERS[feedback.correctIndex]}.{" "}
                    {question.options[feedback.correctIndex]}
                  </p>
                )}
                <button
                  type="button"
                  onClick={nextQuestion}
                  className="mt-4 rounded-2xl bg-coral px-8 py-3 text-sm font-extrabold text-white shadow-[0_4px_0_#d8503f] transition active:translate-y-1 active:shadow-[0_1px_0_#d8503f]"
                >
                  {qPos + 1 >= queue.length ? "Lihat Hasil" : "Soal Berikutnya"}
                </button>
              </>
            )
          )}
        </div>
      )}
    </div>
  );
}
