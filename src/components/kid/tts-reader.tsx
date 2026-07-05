"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Pembaca suara (Teks-ke-Suara) untuk siswa tunanetra.
 *
 * Memakai Web Speech API bawaan browser (speechSynthesis) — gratis, tanpa
 * layanan luar, tanpa kuota. Dipasang sekali di layout siswa dan hanya
 * dirender bila siswa memilih kebutuhan "netra" di Pengaturan.
 *
 * Kemampuan:
 * - "Bacakan halaman": membaca seluruh isi <main id="konten-utama">.
 * - "Baca saat ditunjuk": teks yang diklik/di-Tab dibacakan.
 * - Jeda/lanjut, berhenti, dan pengatur kecepatan (tersimpan di localStorage).
 */

const RATES = [0.75, 1, 1.25, 1.5];
const LS_RATE = "equora:tts:rate";
const LS_POINT = "equora:tts:point";

/** Elemen yang wajar dibacakan saat diklik (blok teks terdekat). */
const READABLE =
  "p,h1,h2,h3,h4,h5,h6,li,td,th,label,a,button,legend,figcaption,blockquote,dt,dd";

/**
 * Chrome menghentikan ucapan yang terlalu panjang di tengah jalan,
 * jadi teks dipecah per kalimat lalu diantre satu-satu.
 */
function toChunks(text: string): string[] {
  return text
    .split(/(?<=[.!?…:])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function TtsReader({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const [supported, setSupported] = useState(true);
  const [open, setOpen] = useState(false);
  const [reading, setReading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [pointMode, setPointMode] = useState(true);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const rateRef = useRef(1);
  rateRef.current = rate;
  /* Penanda sesi bicara: event onend/onerror dari antrean lama yang sudah
     dibatalkan datang terlambat dan tidak boleh mematikan status sesi baru. */
  const speakIdRef = useRef(0);

  /* ── Inisialisasi: dukungan browser, suara Indonesia, preferensi ── */
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current =
        voices.find((v) => v.lang.toLowerCase().startsWith("id")) ?? null;
    };
    pickVoice();
    window.speechSynthesis.addEventListener("voiceschanged", pickVoice);

    const savedRate = Number(localStorage.getItem(LS_RATE));
    if (RATES.includes(savedRate)) setRate(savedRate);
    setPointMode(localStorage.getItem(LS_POINT) !== "off");

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", pickVoice);
      window.speechSynthesis.cancel();
    };
  }, [enabled]);

  const stop = useCallback(() => {
    speakIdRef.current++;
    window.speechSynthesis.cancel();
    setReading(false);
    setPaused(false);
  }, []);

  const speak = useCallback((text: string) => {
    const chunks = toChunks(text);
    if (chunks.length === 0) return;
    const id = ++speakIdRef.current;
    window.speechSynthesis.cancel();
    setPaused(false);
    setReading(true);
    const done = () => {
      if (speakIdRef.current === id) setReading(false);
    };
    chunks.forEach((chunk, i) => {
      const u = new SpeechSynthesisUtterance(chunk);
      u.lang = "id-ID";
      if (voiceRef.current) u.voice = voiceRef.current;
      u.rate = rateRef.current;
      if (i === chunks.length - 1) {
        u.onend = done;
        u.onerror = done;
      }
      window.speechSynthesis.speak(u);
    });
  }, []);

  /* ── Ganti halaman: hentikan suara yang masih berjalan ── */
  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    stop();
  }, [pathname, enabled, stop]);

  /* ── Mode "baca saat ditunjuk": klik atau fokus keyboard ── */
  useEffect(() => {
    if (!enabled || !supported || !pointMode) return;
    const main = () => document.getElementById("konten-utama");

    const readTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return;
      if (target.closest("[data-tts-ui]")) return; // abaikan widget ini sendiri
      const el = target.closest<HTMLElement>(READABLE);
      if (!el || !main()?.contains(el)) return;
      const text = el.getAttribute("aria-label") || el.innerText;
      if (text?.trim()) speak(text);
    };

    const onClick = (e: MouseEvent) => readTarget(e.target);
    const onFocusIn = (e: FocusEvent) => readTarget(e.target);
    document.addEventListener("click", onClick);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [enabled, supported, pointMode, speak]);

  if (!enabled) return null;

  const readPage = () => {
    const text = document.getElementById("konten-utama")?.innerText ?? "";
    speak(text);
  };

  const togglePause = () => {
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  };

  const cycleRate = () => {
    const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    setRate(next);
    localStorage.setItem(LS_RATE, String(next));
    // Umpan balik langsung dengan kecepatan baru.
    rateRef.current = next;
    speak(`Kecepatan ${next.toString().replace(".", " koma ")} kali`);
  };

  const togglePointMode = () => {
    const next = !pointMode;
    setPointMode(next);
    localStorage.setItem(LS_POINT, next ? "on" : "off");
    speak(next ? "Baca saat ditunjuk menyala" : "Baca saat ditunjuk mati");
  };

  return (
    <div data-tts-ui className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="w-64 rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-lg">
          <div className="font-kid-display text-base font-extrabold text-slate-800">
            Pembaca Suara
          </div>
          {!supported ? (
            <p className="mt-2 text-sm text-slate-500">
              Maaf, perangkatmu belum mendukung suara. Coba pakai Chrome terbaru, ya.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {reading ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={togglePause}
                    className="rounded-full bg-grape px-4 py-2.5 text-sm font-extrabold text-white transition hover:brightness-95"
                  >
                    {paused ? "Lanjut" : "Jeda"}
                  </button>
                  <button
                    type="button"
                    onClick={stop}
                    className="rounded-full bg-coral px-4 py-2.5 text-sm font-extrabold text-white transition hover:brightness-95"
                  >
                    Berhenti
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={readPage}
                  className="w-full rounded-full bg-grape px-4 py-2.5 text-sm font-extrabold text-white transition hover:brightness-95"
                >
                  Bacakan halaman ini
                </button>
              )}
              <button
                type="button"
                onClick={cycleRate}
                aria-label={`Kecepatan suara ${rate} kali, tekan untuk mengubah`}
                className="w-full rounded-full border-2 border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-grape hover:text-grape"
              >
                Kecepatan: {rate}×
              </button>
              <button
                type="button"
                onClick={togglePointMode}
                aria-pressed={pointMode}
                className="w-full rounded-full border-2 border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-grape hover:text-grape"
              >
                Baca saat ditunjuk: {pointMode ? "Nyala" : "Mati"}
              </button>
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next && supported) speak("Pembaca suara terbuka");
        }}
        aria-expanded={open}
        aria-label={open ? "Tutup pembaca suara" : "Buka pembaca suara"}
        className="grid h-14 w-14 place-items-center rounded-full bg-grape text-white shadow-[0_4px_0_#6243db] transition hover:brightness-105 active:translate-y-0.5 active:shadow-[0_1px_0_#6243db]"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-7 w-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M11 5 6 9H3v6h3l5 4V5Z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
      </button>
    </div>
  );
}
