import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, users } from "@/db";
import { toggleTts } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengaturan · Siswa" };

export default async function PengaturanSiswaPage() {
  const session = await auth();
  const studentId = session?.user?.id;
  if (!studentId || session?.user?.role !== "student") redirect("/dashboard");

  const [u] = await db
    .select({ tts: users.ttsEnabled })
    .from(users)
    .where(eq(users.id, studentId))
    .limit(1);
  const tts = u?.tts ?? false;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 font-kid-display text-2xl font-extrabold text-slate-800">
        Pengaturan
      </h1>
      <p className="mb-6 text-slate-500">Sesuaikan cara belajarmu.</p>

      <div className="space-y-3">
        {/* TTS */}
        <div className="flex items-center justify-between gap-4 rounded-3xl border-2 border-slate-200/70 bg-white p-5">
          <div>
            <div className="font-kid-display text-lg font-extrabold text-slate-800">
              Teks ke Suara
            </div>
            <p className="text-sm text-slate-500">
              Bantu membacakan teks di layar (untuk teman tunanetra).
            </p>
          </div>
          <form action={toggleTts}>
            <button
              type="submit"
              aria-pressed={tts}
              className={`relative h-8 w-14 rounded-full transition ${tts ? "bg-mint" : "bg-slate-300"}`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${tts ? "left-7" : "left-1"}`}
              />
            </button>
          </form>
        </div>

        {/* BISINDO (stub) */}
        <div className="flex items-center justify-between gap-4 rounded-3xl border-2 border-slate-200/70 bg-white p-5 opacity-70">
          <div>
            <div className="font-kid-display text-lg font-extrabold text-slate-800">
              Bahasa Isyarat (BISINDO)
            </div>
            <p className="text-sm text-slate-500">
              Terjemahan isyarat ke teks saat kelas online.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-400">
            Segera
          </span>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Fitur suara &amp; isyarat sedang disiapkan—tombol ini menyimpan
        preferensimu.
      </p>
    </div>
  );
}
