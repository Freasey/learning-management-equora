import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isUserActive } from "@/lib/auth-guard";
import { unreadCount } from "@/lib/notify";
import { TeacherTopNav } from "@/components/teacher/teacher-topnav";

export default async function TeacherLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!(await isUserActive(session?.user?.id))) redirect("/masuk");
  const unread = await unreadCount(session?.user?.id);

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <TeacherTopNav
        name={session?.user?.name ?? "—"}
        email={session?.user?.email}
        roles={session?.user?.roles ?? []}
        unread={unread}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
