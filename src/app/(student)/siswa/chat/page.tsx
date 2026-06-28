import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ChatClient } from "@/components/chat/chat-client";
import { getUserGroups } from "@/lib/chat";

export const dynamic = "force-dynamic";
export const metadata = { title: "Obrolan · Siswa" };

export default async function ChatSiswaPage() {
  const session = await auth();
  const u = session?.user;
  if (!u?.id || !u.schoolId || u.role !== "student") redirect("/dashboard");

  const groups = await getUserGroups(u.schoolId, u.id, "student");

  return (
    <div>
      <h1 className="mb-1 font-kid-display text-2xl font-extrabold text-slate-800">
        Obrolan Kelas
      </h1>
      <p className="mb-6 text-slate-500">
        Tiap kelas &amp; mata pelajaran punya grup sendiri untuk bertanya ke guru
        dan teman.
      </p>
      <ChatClient groups={groups} meId={u.id} variant="student" />
    </div>
  );
}
