import Link from "next/link";
import { GraduationCap, LogOut } from "lucide-react";
import { auth } from "@/auth";
import { doSignOut } from "./workspace/actions";

export default async function AccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-sand/30">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-paper">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-medium text-teal-900">
              Equora
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:block">
              {session?.user?.name}
            </span>
            <form action={doSignOut}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-sand"
              >
                <LogOut className="h-3.5 w-3.5" />
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
