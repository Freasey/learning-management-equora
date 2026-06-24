import Link from "next/link";
import { auth } from "@/auth";
import { kidFontVars } from "@/lib/kid-fonts";
import { LogoBook, IconLogout, IconHelp } from "@/components/kid/icons";
import { StudentBackBar } from "@/components/kid/back-bar";
import { doSignOut } from "./actions";

export default async function StudentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <div className={`${kidFontVars} font-kid min-h-screen bg-cream`}>
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
                className="flex items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 transition hover:border-coral hover:text-coral"
              >
                <IconLogout className="h-4 w-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-5 sm:py-8">
        <StudentBackBar />
        {children}
      </main>
    </div>
  );
}
