"use client";

import "@livekit/components-styles";
import { LiveKitRoom, useDataChannel } from "@livekit/components-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { MessagesSquare, Send } from "lucide-react";
import { sendChatMessage, fetchGroupMessages } from "@/lib/chat-actions";
import type { ChatGroup, ChatMessageView } from "@/lib/chat";

const SERVER_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL;

/** Payload ringkas yang disiarkan lewat data channel (tanpa flag `mine`). */
type Wire = Pick<
  ChatMessageView,
  "id" | "senderId" | "senderName" | "body" | "createdAt"
>;

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatClient({
  groups: initialGroups,
  meId,
  variant,
}: {
  groups: ChatGroup[];
  meId: string;
  variant: "teacher" | "student";
}) {
  const [groups, setGroups] = useState(initialGroups);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialGroups[0]?.id ?? null,
  );
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState("");

  const selected = groups.find((g) => g.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      setToken(null);
      setMessages([]);
      try {
        const msgs = await fetchGroupMessages(selectedId);
        if (cancelled) return;
        setMessages(msgs);
        setGroups((gs) =>
          gs.map((g) => (g.id === selectedId ? { ...g, unread: 0 } : g)),
        );
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Gagal memuat pesan.");
      } finally {
        if (!cancelled) setLoading(false);
      }

      // Token realtime bersifat best-effort; chat tetap jalan tanpanya.
      if (SERVER_URL) {
        try {
          const res = await fetch(
            `/api/chat-token?group=${encodeURIComponent(selectedId)}`,
          );
          if (res.ok && !cancelled) {
            const d = await res.json();
            setToken(d.token);
          }
        } catch {
          /* abaikan — mode non-realtime */
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const appendMessage = useCallback((m: ChatMessageView) => {
    setMessages((prev) =>
      prev.some((x) => x.id === m.id) ? prev : [...prev, m],
    );
  }, []);

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-paper p-12 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-700/10 text-teal-700">
          <MessagesSquare className="h-7 w-7" />
        </span>
        <h2 className="mt-4 font-display text-xl font-medium text-ink">
          Belum ada grup obrolan
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          {variant === "teacher"
            ? "Grup muncul otomatis untuk tiap Kelas + Mata Pelajaran yang kamu ampu."
            : "Grup muncul otomatis untuk tiap Kelas + Mata Pelajaran kelasmu."}
        </p>
      </div>
    );
  }

  const threadProps = {
    groupId: selectedId!,
    title: selected?.label ?? "",
    messages,
    loading,
    error,
    meId,
    appendMessage,
  };

  return (
    <div className="grid h-[72dvh] grid-cols-1 overflow-hidden rounded-xl border border-line bg-paper md:grid-cols-[260px_1fr]">
      {/* Daftar grup */}
      <aside className="hidden border-r border-line md:block">
        <div className="overflow-y-auto">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedId(g.id)}
              className={`flex w-full items-center justify-between gap-2 border-b border-line px-4 py-3 text-left text-sm transition hover:bg-teal-700/5 ${
                g.id === selectedId ? "bg-teal-700/10" : ""
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium text-ink">
                  {g.subjectName}
                </span>
                <span className="block truncate text-xs text-muted">
                  {g.className}
                </span>
              </span>
              {g.unread > 0 && (
                <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">
                  {g.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* Pemilih grup versi mobile */}
      <div className="border-b border-line p-2 md:hidden">
        <select
          value={selectedId ?? ""}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
              {g.unread > 0 ? ` (${g.unread})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Thread */}
      {selectedId && SERVER_URL && token ? (
        <LiveKitRoom
          key={selectedId}
          token={token}
          serverUrl={SERVER_URL}
          connect
          audio={false}
          video={false}
          onError={() => {
            /* gagal konek realtime → tetap mode non-realtime */
          }}
          style={{ display: "contents" }}
        >
          <RealtimeThread {...threadProps} />
        </LiveKitRoom>
      ) : (
        <ThreadView {...threadProps} />
      )}
    </div>
  );
}

type ThreadProps = {
  groupId: string;
  title: string;
  messages: ChatMessageView[];
  loading: boolean;
  error: string;
  meId: string;
  appendMessage: (m: ChatMessageView) => void;
};

/** Bungkus realtime: terima pesan masuk & sediakan fungsi siar (broadcast). */
function RealtimeThread(props: ThreadProps) {
  const { message, send } = useDataChannel("chat");

  useEffect(() => {
    if (!message) return;
    try {
      const data = JSON.parse(new TextDecoder().decode(message.payload)) as Wire;
      props.appendMessage({ ...data, mine: data.senderId === props.meId });
    } catch {
      /* payload tak valid — abaikan */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  const broadcast = useCallback(
    (w: Wire) => {
      try {
        void send(new TextEncoder().encode(JSON.stringify(w)), {
          topic: "chat",
          reliable: true,
        });
      } catch {
        /* belum tersambung — penerima akan lihat dari riwayat */
      }
    },
    [send],
  );

  return <ThreadView {...props} broadcast={broadcast} />;
}

function ThreadView({
  groupId,
  title,
  messages,
  loading,
  error,
  appendMessage,
  broadcast,
}: ThreadProps & { broadcast?: (w: Wire) => void }) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    setSendError("");
    try {
      const m = await sendChatMessage(groupId, body);
      appendMessage(m);
      broadcast?.({
        id: m.id,
        senderId: m.senderId,
        senderName: m.senderName,
        body: m.body,
        createdAt: m.createdAt,
      });
      setInput("");
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Gagal mengirim.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="flex min-h-0 flex-col">
      <header className="border-b border-line px-4 py-3">
        <h2 className="truncate font-display text-base font-medium text-ink">
          {title}
        </h2>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto bg-white/40 px-4 py-4">
        {loading ? (
          <p className="text-center text-sm text-muted">Memuat pesan…</p>
        ) : error ? (
          <p className="text-center text-sm text-rose-600">{error}</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted">
            Belum ada pesan. Mulai percakapan!
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.mine ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${
                  m.mine
                    ? "bg-teal-700 text-white"
                    : "border border-line bg-paper text-ink"
                }`}
              >
                {!m.mine && (
                  <span className="mb-0.5 block text-xs font-semibold text-teal-700">
                    {m.senderName}
                  </span>
                )}
                <span className="whitespace-pre-wrap wrap-break-word">{m.body}</span>
              </div>
              <span className="mt-0.5 px-1 text-[11px] text-muted">
                {timeOf(m.createdAt)}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-line p-3">
        {sendError && <p className="mb-2 text-sm text-rose-600">{sendError}</p>}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            rows={1}
            placeholder="Tulis pesan… (Enter kirim, Shift+Enter baris baru)"
            className="max-h-32 min-h-10.5 flex-1 resize-none rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/50 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="grid h-10.5 w-10.5 shrink-0 place-items-center rounded-md bg-teal-700 text-white transition hover:bg-teal-800 disabled:opacity-50"
            aria-label="Kirim"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </section>
  );
}
