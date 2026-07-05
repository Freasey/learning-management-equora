"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useConnectionState,
  useDataChannel,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { ConnectionState, RoomEvent } from "livekit-client";
import type { ReceivedDataMessage } from "@livekit/components-core";
import { Captions } from "lucide-react";

/**
 * Teks berjalan (live caption) untuk ruang Meet — fitur aksesibilitas
 * siswa tunarungu (lihat `lib/accessibility.ts`, kunci "rungu").
 *
 * Cara kerja (tanpa server & tanpa kuota, seperti TTS netra):
 * 1. Peserta yang butuh caption menyalakan tombol CC → menyiarkan sinyal
 *    "cc-need" ke semua peserta (diulang saat ada peserta baru masuk).
 * 2. Selama ada yang butuh, tiap pembicara mentranskrip suaranya SENDIRI
 *    di browser-nya via Web Speech API (Chrome/Edge), lalu mengirim teks
 *    lewat kanal data LiveKit topik "cc".
 * 3. Penerima menampilkan teks per pembicara; baris kedaluwarsa dihapus.
 *
 * Mic yang mati = tidak ada transkripsi; tidak ada yang butuh caption =
 * tidak ada suara yang diproses sama sekali (hemat & menjaga privasi).
 */

const TOPIC_CAPTION = "cc";
const TOPIC_NEED = "cc-need";
/** Baris caption hilang setelah sekian md tanpa pembaruan. */
const LINE_TTL_MS = 5000;

// Web Speech API (SpeechRecognition) belum ada di tipe bawaan TypeScript.
type SpeechResultEvent = {
  resultIndex: number;
  results: {
    length: number;
    [i: number]: { isFinal: boolean; 0: { transcript: string } };
  };
};
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function createRecognition(): Recognition | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = "id-ID";
  rec.continuous = true;
  rec.interimResults = true;
  return rec;
}

export function speechRecognitionSupported() {
  return createRecognition() !== null;
}

type CaptionLine = { name: string; text: string; at: number };

const enc = new TextEncoder();
const dec = new TextDecoder();

export function MeetCaptions({ defaultOn = false }: { defaultOn?: boolean }) {
  const room = useRoomContext();
  const connState = useConnectionState();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();

  const [on, setOn] = useState(defaultOn);
  /** Teks terbaru per pembicara (kunci = identity peserta). */
  const [lines, setLines] = useState<Record<string, CaptionLine>>({});
  /** Identity peserta lain yang sedang butuh caption. */
  const [needers, setNeeders] = useState<ReadonlySet<string>>(new Set());

  // ---- Terima caption dari pembicara lain -------------------------------
  const onCaption = useCallback((msg: ReceivedDataMessage) => {
    if (!msg.from) return;
    try {
      const { text } = JSON.parse(dec.decode(msg.payload)) as { text: string };
      if (!text) return;
      const id = msg.from.identity;
      const name = msg.from.name || "Peserta";
      setLines((prev) => ({ ...prev, [id]: { name, text, at: Date.now() } }));
    } catch {
      // abaikan payload yang tidak dikenal
    }
  }, []);
  const { send: sendCaption } = useDataChannel(TOPIC_CAPTION, onCaption);

  // ---- Sinyal "aku butuh caption" ---------------------------------------
  const onNeed = useCallback((msg: ReceivedDataMessage) => {
    if (!msg.from) return;
    const id = msg.from.identity;
    try {
      const { need } = JSON.parse(dec.decode(msg.payload)) as { need: boolean };
      setNeeders((prev) => {
        if (prev.has(id) === need) return prev;
        const next = new Set(prev);
        if (need) next.add(id);
        else next.delete(id);
        return next;
      });
    } catch {
      // abaikan payload yang tidak dikenal
    }
  }, []);
  const { send: sendNeed } = useDataChannel(TOPIC_NEED, onNeed);

  const connected = connState === ConnectionState.Connected;

  // Siarkan status kebutuhanku saat berubah / saat tersambung.
  useEffect(() => {
    if (!connected) return;
    sendNeed(enc.encode(JSON.stringify({ need: on })), { reliable: true }).catch(() => {});
  }, [on, connected, sendNeed]);

  // Peserta baru masuk → ulangi sinyal agar dia ikut mentranskrip;
  // peserta keluar → berhenti menganggapnya butuh caption.
  useEffect(() => {
    const onJoin = () => {
      if (on) {
        sendNeed(enc.encode(JSON.stringify({ need: true })), { reliable: true }).catch(() => {});
      }
    };
    const onLeave = (p: { identity: string }) => {
      setNeeders((prev) => {
        if (!prev.has(p.identity)) return prev;
        const next = new Set(prev);
        next.delete(p.identity);
        return next;
      });
      setLines((prev) => {
        if (!prev[p.identity]) return prev;
        const next = { ...prev };
        delete next[p.identity];
        return next;
      });
    };
    room.on(RoomEvent.ParticipantConnected, onJoin);
    room.on(RoomEvent.ParticipantDisconnected, onLeave);
    return () => {
      room.off(RoomEvent.ParticipantConnected, onJoin);
      room.off(RoomEvent.ParticipantDisconnected, onLeave);
    };
  }, [room, on, sendNeed]);

  // ---- Transkripsi suaraku sendiri (hanya bila ada yang butuh) ----------
  const transcribe = connected && isMicrophoneEnabled && needers.size > 0;
  const sendCaptionRef = useRef(sendCaption);
  useEffect(() => {
    sendCaptionRef.current = sendCaption;
  }, [sendCaption]);

  useEffect(() => {
    if (!transcribe) return;
    const rec = createRecognition();
    if (!rec) return;

    let alive = true;
    let restartTimer: ReturnType<typeof setTimeout>;

    rec.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      text = text.trim();
      if (!text) return;
      sendCaptionRef.current(enc.encode(JSON.stringify({ text })), { reliable: false }).catch(() => {});
    };
    // Chrome menghentikan pengenalan saat hening — nyalakan lagi selama masih perlu.
    const restart = () => {
      if (!alive) return;
      restartTimer = setTimeout(() => {
        if (!alive) return;
        try {
          rec.start();
        } catch {
          // sudah berjalan / ditolak — biarkan
        }
      }, 300);
    };
    rec.onend = restart;
    rec.onerror = restart;
    try {
      rec.start();
    } catch {
      // izin mic ditolak, dsb.
    }

    return () => {
      alive = false;
      clearTimeout(restartTimer);
      rec.onend = null;
      rec.onerror = null;
      try {
        rec.stop();
      } catch {
        // sudah berhenti
      }
    };
  }, [transcribe, localParticipant]);

  // Bersihkan baris caption yang sudah lama tidak diperbarui.
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => {
      setLines((prev) => {
        const now = Date.now();
        const kept = Object.entries(prev).filter(([, l]) => now - l.at < LINE_TTL_MS);
        return kept.length === Object.keys(prev).length ? prev : Object.fromEntries(kept);
      });
    }, 1000);
    return () => clearInterval(t);
  }, [on]);

  const visible = on
    ? Object.values(lines)
        .sort((a, b) => a.at - b.at)
        .slice(-2)
    : [];

  return (
    <>
      <button
        type="button"
        onClick={() => setOn((v) => !v)}
        aria-pressed={on}
        title={
          on
            ? "Matikan teks berjalan"
            : "Nyalakan teks berjalan (ucapan peserta tampil sebagai teks)"
        }
        className={`absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
          on ? "bg-teal-500 text-white" : "bg-black/60 text-white/80 hover:bg-black/80"
        }`}
      >
        <Captions className="h-4 w-4" aria-hidden />
        {on ? "CC aktif" : "CC"}
      </button>

      {on && (
        <div
          aria-live="polite"
          className="pointer-events-none absolute bottom-24 left-1/2 z-10 flex w-[min(92%,42rem)] -translate-x-1/2 flex-col items-center gap-1"
        >
          {visible.length === 0 ? (
            <p className="rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white/70">
              Teks berjalan aktif — menunggu ada yang berbicara…
              {!speechRecognitionSupported() &&
                " (browser ini tidak bisa mentranskrip suaramu; pakai Chrome/Edge)"}
            </p>
          ) : (
            visible.map((l) => (
              <p
                key={l.name}
                className="max-w-full rounded-lg bg-black/75 px-4 py-2 text-center text-sm text-white md:text-base"
              >
                <span className="mr-2 font-semibold text-teal-300">{l.name}</span>
                {l.text}
              </p>
            ))
          )}
        </div>
      )}
    </>
  );
}
