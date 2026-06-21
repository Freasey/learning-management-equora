import { LogOut } from "lucide-react";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { doSignOut } from "./actions";

export default async function SuperAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-x-hidden bg-paper">
        <header className="flex h-16 items-center justify-end gap-4 border-b border-line px-8">
          <div className="text-right leading-tight">
            <div className="text-sm font-medium text-ink">
              {session?.user?.name ?? "—"}
            </div>
            <div className="font-mono text-[10px] text-muted">
              {session?.user?.email}
            </div>
          </div>
          <form action={doSignOut}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-sand"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </form>
        </header>
        <div className="mx-auto w-full max-w-5xl px-8 py-10">{children}</div>
      </div>
    </div>
  );
}
