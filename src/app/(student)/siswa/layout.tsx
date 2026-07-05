import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, users } from "@/db";
import { isUserActive } from "@/lib/auth-guard";
import { unreadCount } from "@/lib/notify";
import { kidFontVars } from "@/lib/kid-fonts";
import { sanitizeDisabilities } from "@/lib/accessibility";
import { LogoBook, IconLogout, IconHelp } from "@/components/kid/icons";
import { StudentBackBar } from "@/components/kid/back-bar";
import { TtsReader } from "@/components/kid/tts-reader";
import { NotifBell } from "@/components/notif-bell";
import { doSignOut } from "./actions";

export default async function StudentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || !(await isUserActive(userId))) redirect("/masuk-siswa");

  const [unread, [u]] = await Promise.all([
    unreadCount(userId),
    db
      .select({ disabilities: users.disabilities })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
  ]);
  // Pembaca suara otomatis aktif untuk siswa berkebutuhan "netra".
  const ttsOn = sanitizeDisabilities(u?.disabilities).includes("netra");

  return (
    <div className={`${kidFontVars} font-kid min-h-screen bg-cream`}>
      <a
        href="#konten-utama"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-slate-800 focus:px-4 focus:py-2.5 focus:font-bold focus:text-white"
      >
        Lompat ke isi utama
      </a>
      <header className="border-b border-slate-200/70 bg-cream">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-5">
          <Link href="/siswa" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-coral text-white">
              <LogoBook className="h-5 w-5" />
            </span>
            <span className="font-kid-display text-xl font-extrabold text-slate-800">
              Equora
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-bold text-slate-600 sm:block">
              {session?.user?.name ?? "Siswa"}
            </span>
            <NotifBell count={unread} variant="light" />
            <Link
              href="/panduan/siswa"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Panduan cara pakai"
              title="Panduan cara pakai"
              className="flex items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 transition hover:border-sky hover:text-sky"
            >
              <IconHelp className="h-4 w-4" />
              <span className="hidden sm:inline">Panduan</span>
            </Link>
            <form action={doSignOut}>
              <button
                type="submit"
                aria-label="Keluar dari akun"
                className="flex items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 transition hover:border-coral hover:text-coral"
              >
                <IconLogout className="h-4 w-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </form>
          </div>
        </div>
      </header>
      <main
        id="konten-utama"
        tabIndex={-1}
        className="mx-auto max-w-5xl px-4 py-6 outline-none sm:px-5 sm:py-8"
      >
        <StudentBackBar />
        {children}
      </main>
      <TtsReader enabled={ttsOn} />
    </div>
  );
}
