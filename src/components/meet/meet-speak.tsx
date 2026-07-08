"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useConnectionState,
  useDataChannel,
  useLocalParticipant,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import type { ReceivedDataMessage } from "@livekit/components-core";
import { MessageSquareText, Send } from "lucide-react";

/**
 * Bicara Lewat Teks fitur aksesibilitas siswa tunawicara
 * (lihat `lib/accessibility.ts`, kunci "wicara").
 *
 * Cara kerja (tanpa server & tanpa kuota, kembaran MeetCaptions):
 * 1. Siswa mengetik kalimat / menekan frasa cepat → teks dikirim ke semua
 *    peserta lewat kanal data LiveKit topik "speak".
 * 2. Perangkat TIAP penerima membacakan teks itu dengan suara browser
 *    (speechSynthesis) DAN menampilkannya sebagai gelembung teks jadi
 *    peserta tunarungu pun tetap bisa membacanya.
 * 3. Komponen ini selalu terpasang untuk semua peserta (guru & siswa)
 *    sebagai penerima; tombol "Bicara" hanya membuka panel pengetiknya.
 */

const TOPIC_SPEAK = "speak";
const MAX_LEN = 200;
/** Gelembung teks hilang setelah sekian md tanpa pesan baru dari orang itu. */
const BUBBLE_TTL_MS = 8000;

const QUICK_PHRASES = [
  "Saya mau bertanya.",
  "Saya belum paham, bisa dijelaskan lagi?",
  "Bisa diulang, Bu/Pak?",
  "Saya sudah selesai.",
  "Ya.",
  "Tidak.",
];

type SpeakBubble = { name: string; text: string; at: number };

const enc = new TextEncoder();
const dec = new TextDecoder();

export function MeetSpeak({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const connState = useConnectionState();
  const { localParticipant } = useLocalParticipant();

  const [open, setOpen] = useState(defaultOpen);
  const [input, setInput] = useState("");
  /** Pesan terbaru per pengirim (kunci = identity peserta). */
  const [bubbles, setBubbles] = useState<Record<string, SpeakBubble>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  /* ── Suara Indonesia (pola sama dengan TtsReader) ── */
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current =
        voices.find((v) => v.lang.toLowerCase().startsWith("id")) ?? null;
    };
    pickVoice();
    window.speechSynthesis.addEventListener("voiceschanged", pickVoice);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", pickVoice);
    };
  }, []);

  /* Bacakan tanpa membatalkan antrean pesan beruntun dibaca bergiliran. */
  const speakAloud = useCallback((name: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(`${name} berkata: ${text}`);
    u.lang = "id-ID";
    if (voiceRef.current) u.voice = voiceRef.current;
    window.speechSynthesis.speak(u);
  }, []);

  const showBubble = useCallback((id: string, name: string, text: string) => {
    setBubbles((prev) => ({ ...prev, [id]: { name, text, at: Date.now() } }));
  }, []);

  /* ── Terima pesan bicara dari peserta lain ── */
  const onSpeak = useCallback(
    (msg: ReceivedDataMessage) => {
      if (!msg.from) return;
      try {
        const { text } = JSON.parse(dec.decode(msg.payload)) as { text: string };
        if (!text) return;
        const name = msg.from.name || "Peserta";
        showBubble(msg.from.identity, name, text);
        speakAloud(name, text);
      } catch {
        // abaikan payload yang tidak dikenal
      }
    },
    [showBubble, speakAloud],
  );
  const { send } = useDataChannel(TOPIC_SPEAK, onSpeak);

  const connected = connState === ConnectionState.Connected;

  /* ── Kirim: siarkan ke semua + tampil & bunyikan di perangkat sendiri
        (kanal data tidak menggemakan pesan kembali ke pengirim). ── */
  const submit = useCallback(
    (raw: string) => {
      const text = raw.trim().slice(0, MAX_LEN);
      if (!text || !connected) return;
      send(enc.encode(JSON.stringify({ text })), { reliable: true }).catch(() => {});
      const name = localParticipant.name || "Aku";
      showBubble(localParticipant.identity, name, text);
      speakAloud(name, text);
      setInput("");
      inputRef.current?.focus();
    },
    [connected, send, localParticipant, showBubble, speakAloud],
  );

  /* Bersihkan gelembung yang sudah lama tidak diperbarui. */
  useEffect(() => {
    const t = setInterval(() => {
      setBubbles((prev) => {
        const now = Date.now();
        const kept = Object.entries(prev).filter(([, b]) => now - b.at < BUBBLE_TTL_MS);
        return kept.length === Object.keys(prev).length ? prev : Object.fromEntries(kept);
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const visible = Object.values(bubbles)
    .sort((a, b) => a.at - b.at)
    .slice(-2);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-pressed={open}
        aria-label={open ? "Tutup panel Bicara Lewat Teks" : "Buka panel Bicara Lewat Teks"}
        title="Bicara Lewat Teks: ketik kalimat, semua peserta mendengarnya dibacakan"
        className={`absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
          open ? "bg-teal-500 text-white" : "bg-black/60 text-white/80 hover:bg-black/80"
        }`}
      >
        <MessageSquareText className="h-4 w-4" aria-hidden />
        Bicara
      </button>

      {open && (
        <div className="absolute left-3 top-12 z-10 w-[min(20rem,calc(100%-1.5rem))] rounded-xl bg-black/75 p-3 backdrop-blur">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {QUICK_PHRASES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => submit(p)}
                disabled={!connected}
                className="rounded-full bg-white/15 px-2.5 py-1 text-xs text-white transition hover:bg-teal-500 disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
            className="flex gap-1.5"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={MAX_LEN}
              placeholder="Ketik kalimatmu…"
              aria-label="Kalimat yang akan disuarakan ke semua peserta"
              className="min-w-0 flex-1 rounded-md border border-white/20 bg-black/40 px-2.5 py-1.5 text-sm text-white placeholder:text-white/40 focus:border-teal-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!connected || !input.trim()}
              aria-label="Suarakan"
              title="Suarakan ke semua peserta"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-teal-500 text-white transition hover:bg-teal-400 disabled:opacity-50"
            >
              <Send className="h-4 w-4" aria-hidden />
            </button>
          </form>
        </div>
      )}

      {visible.length > 0 && (
        <div
          aria-live="polite"
          className="pointer-events-none absolute bottom-40 left-1/2 z-10 flex w-[min(92%,42rem)] -translate-x-1/2 flex-col items-center gap-1"
        >
          {visible.map((b) => (
            <p
              key={b.name}
              className="max-w-full rounded-lg bg-teal-900/85 px-4 py-2 text-center text-sm text-white md:text-base"
            >
              <MessageSquareText
                className="mr-2 inline h-4 w-4 align-[-2px] text-teal-300"
                aria-hidden
              />
              <span className="mr-2 font-semibold text-teal-300">{b.name}</span>
              {b.text}
            </p>
          ))}
        </div>
      )}
    </>
  );
}
