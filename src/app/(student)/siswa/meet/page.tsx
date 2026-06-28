import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MeetRoom } from "@/components/meet/meet-room";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kelas Online · Siswa" };

export default async function MeetSiswaPage() {
  const session = await auth();
  if (session?.user?.role !== "student") redirect("/dashboard");

  return (
    <div>
      <h1 className="mb-1 font-kid-display text-2xl font-extrabold text-slate-800">
        Kelas Online
      </h1>
      <p className="mb-6 text-slate-500">
        Masukkan kode ruang dari gurumu untuk ikut kelas tatap muka daring.
      </p>
      <MeetRoom defaultRoom="kelas" hint="Masukkan kode ruang yang dibagikan gurumu." />
    </div>
  );
}
