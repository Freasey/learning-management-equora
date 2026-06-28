import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/admin/ui";
import { ChatClient } from "@/components/chat/chat-client";
import { getUserGroups } from "@/lib/chat";

export const dynamic = "force-dynamic";
export const metadata = { title: "Obrolan Kelas · Guru" };

export default async function ChatPage() {
  const session = await auth();
  const u = session?.user;
  if (!u?.id || !u.schoolId || u.role !== "teacher") redirect("/dashboard");

  const groups = await getUserGroups(u.schoolId, u.id, "teacher");

  return (
    <div>
      <PageHeader
        title="Obrolan Kelas"
        description="Group chat per Kelas & Mata Pelajaran — anggotanya guru pengampu + siswa kelas tersebut."
      />
      <ChatClient groups={groups} meId={u.id} variant="teacher" />
    </div>
  );
}
