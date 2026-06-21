import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Obrolan · Siswa" };

export default async function ChatSiswaPage() {
  const session = await auth();
  if (session?.user?.role !== "student") redirect("/dashboard");

  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
      <h1 className="font-kid-display text-2xl font-extrabold text-slate-800">
        Obrolan kelas segera hadir
      </h1>
      <p className="mx-auto mt-2 max-w-md text-slate-500">
        Tiap kelas &amp; mata pelajaran akan punya grup obrolan sendiri untuk
        bertanya ke guru dan teman.
      </p>
    </div>
  );
}
