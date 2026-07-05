import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, users } from "@/db";
import { sanitizeDisabilities } from "@/lib/accessibility";
import { MeetRoom } from "@/components/meet/meet-room";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kelas Online · Siswa" };

export default async function MeetSiswaPage() {
  const session = await auth();
  const studentId = session?.user?.id;
  if (!studentId || session?.user?.role !== "student") redirect("/dashboard");

  const [u] = await db
    .select({ disabilities: users.disabilities })
    .from(users)
    .where(eq(users.id, studentId))
    .limit(1);
  const disabilities = sanitizeDisabilities(u?.disabilities);
  // Siswa tunarungu langsung mendapat teks berjalan tanpa harus menyalakan CC.
  const captionsDefault = disabilities.includes("rungu");
  // Siswa tunawicara langsung mendapat panel Bicara Lewat Teks yang terbuka.
  const speakDefault = disabilities.includes("wicara");

  return (
    <div>
      <h1 className="mb-1 font-kid-display text-2xl font-extrabold text-slate-800">
        Kelas Online
      </h1>
      <p className="mb-6 text-slate-500">
        Masukkan kode ruang dari gurumu untuk ikut kelas tatap muka daring.
      </p>
      <MeetRoom
        defaultRoom="kelas"
        hint="Masukkan kode ruang yang dibagikan gurumu."
        captionsDefault={captionsDefault}
        speakDefault={speakDefault}
      />
    </div>
  );
}
