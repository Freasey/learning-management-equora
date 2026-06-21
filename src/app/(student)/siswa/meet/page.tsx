import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kelas Online · Siswa" };

export default async function MeetSiswaPage() {
  const session = await auth();
  if (session?.user?.role !== "student") redirect("/dashboard");

  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
      <h1 className="font-kid-display text-2xl font-extrabold text-slate-800">
        Kelas Online segera hadir
      </h1>
      <p className="mx-auto mt-2 max-w-md text-slate-500">
        Sebentar lagi kamu bisa ikut kelas tatap muka daring di sini—lengkap
        dengan teks langsung untuk teman tunarungu.
      </p>
    </div>
  );
}
