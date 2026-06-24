import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { auth } from "@/auth";
import { listNotifications } from "@/lib/notify";
import { formatDate } from "@/lib/format";
import { markAllRead } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifikasi · Equora" };

export default async function NotifikasiPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/masuk");

  const items = await listNotifications(userId);
  const hasUnread = items.some((n) => !n.readAt);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 font-display text-2xl font-medium text-ink">
          <Bell className="h-6 w-6 text-teal-700" />
          Notifikasi
        </h1>
        {hasUnread && (
          <form action={markAllRead}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-md border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-sand"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Tandai semua dibaca
            </button>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-paper p-10 text-center text-muted">
          Belum ada notifikasi.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const unread = !n.readAt;
            const inner = (
              <div
                className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
                  unread
                    ? "border-teal-700/30 bg-teal-700/5"
                    : "border-line bg-paper"
                }`}
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    unread ? "bg-accent" : "bg-transparent"
                  }`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-sm text-muted">{n.body}</p>}
                  <p className="mt-1 font-mono text-[10px] uppercase text-muted">
                    {formatDate(n.createdAt)}
                  </p>
                </div>
              </div>
            );
            return (
              <li key={n.id}>
                {n.href ? (
                  <Link href={n.href}>{inner}</Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
