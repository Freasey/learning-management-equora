import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/admin/ui";
import { MeetRoom } from "@/components/meet/meet-room";

export const dynamic = "force-dynamic";
export const metadata = { title: "Meet · Guru" };

export default async function MeetPage() {
  const session = await auth();
  if (!session?.user?.schoolId || session?.user?.role !== "teacher") redirect("/dashboard");

  return (
    <div>
      <PageHeader
        title="Meet"
        description="Kelas tatap muka daring. Bagikan kode ruang ke siswa agar bergabung di ruang yang sama."
      />
      <MeetRoom
        defaultRoom="kelas"
        hint="Sebagai guru, kamu menjadi pengelola ruang (bisa mute/keluarkan peserta). Bagikan kode ini ke siswa."
      />
    </div>
  );
}
