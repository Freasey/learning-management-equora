import { auth } from "@/auth";
import { SchoolTopNav } from "@/components/admin/school-topnav";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <SchoolTopNav
        name={session?.user?.name ?? "—"}
        email={session?.user?.email}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
