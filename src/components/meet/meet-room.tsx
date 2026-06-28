"use client";

import "@livekit/components-styles";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import { useState } from "react";
import { Video } from "lucide-react";

/**
 * Ruang Meet (LiveKit Cloud) yang menempel pada sesi login.
 *
 * Nama peserta TIDAK diisi di sini — diambil server dari sesi saat mencetak
 * token (lihat /api/livekit-token). Pengguna hanya memilih KODE RUANG; server
 * otomatis menamai-ulang per sekolah agar antar-sekolah terisolasi.
 */
export function MeetRoom({
  defaultRoom = "kelas",
  hint,
}: {
  defaultRoom?: string;
  hint?: string;
}) {
  const [room, setRoom] = useState(defaultRoom);
  const [token, setToken] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/livekit-token?room=${encodeURIComponent(room)}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengambil token.");
      setToken(data.token);
      setConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  if (!serverUrl) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-paper p-12 text-center">
        <h2 className="font-display text-xl font-medium text-ink">
          Meet belum dikonfigurasi
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Setel <code>NEXT_PUBLIC_LIVEKIT_URL</code>, <code>LIVEKIT_API_KEY</code>,
          dan <code>LIVEKIT_API_SECRET</code> di <code>.env.local</code> lalu
          muat ulang halaman.
        </p>
      </div>
    );
  }

  if (connected && token) {
    return (
      <div className="overflow-hidden rounded-xl border border-line">
        <LiveKitRoom
          token={token}
          serverUrl={serverUrl}
          connect={true}
          video={true}
          audio={true}
          onDisconnected={() => {
            setConnected(false);
            setToken("");
          }}
          data-lk-theme="default"
          style={{ height: "78dvh" }}
        >
          <VideoConference />
        </LiveKitRoom>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleJoin}
      className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-xl border border-line bg-paper p-8"
    >
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-700/10 text-teal-700">
        <Video className="h-7 w-7" />
      </span>
      <div className="text-center">
        <h2 className="font-display text-xl font-medium text-ink">Masuk ruang kelas</h2>
        <p className="mt-1 text-sm text-muted">
          {hint ?? "Bagikan kode ruang yang sama agar bisa bertemu di kelas daring."}
        </p>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink">Kode ruang</span>
        <input
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="mis. kelas-7a-fisika"
          required
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/50 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
        />
      </label>

      {error && <p className="text-sm text-rose-600">⚠️ {error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60"
      >
        {loading ? "Menyambungkan…" : "Gabung Ruang"}
      </button>
    </form>
  );
}
