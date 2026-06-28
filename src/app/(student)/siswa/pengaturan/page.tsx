import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { UserRound } from "lucide-react";
import { auth } from "@/auth";
import { db, users } from "@/db";
import { isStorageConfigured } from "@/lib/storage";
import { toggleTts } from "./actions";
import { updateAvatar, removeAvatar } from "../../../(account)/account-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengaturan · Siswa" };

export default async function PengaturanSiswaPage() {
  const session = await auth();
  const studentId = session?.user?.id;
  if (!studentId || session?.user?.role !== "student") redirect("/dashboard");

  const [u] = await db
    .select({ tts: users.ttsEnabled, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, studentId))
    .limit(1);
  const tts = u?.tts ?? false;
  const storageOn = isStorageConfigured();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 font-kid-display text-2xl font-extrabold text-slate-800">
        Pengaturan
      </h1>
      <p className="mb-6 text-slate-500">Sesuaikan cara belajarmu.</p>

      <div className="space-y-3">
        {/* Foto profil */}
        <div className="flex items-center justify-between gap-4 rounded-3xl border-2 border-slate-200/70 bg-white p-5">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100 text-slate-400">
              {u?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={u.avatarUrl} alt="Foto profil" className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-7 w-7" />
              )}
            </span>
            <div>
              <div className="font-kid-display text-lg font-extrabold text-slate-800">
                Foto Profil
              </div>
              <p className="text-sm text-slate-500">Pasang fotomu biar makin seru!</p>
            </div>
          </div>
          {storageOn ? (
            <div className="flex flex-col items-end gap-2">
              <form action={updateAvatar}>
                <input
                  name="avatar"
                  type="file"
                  accept="image/*"
                  required
                  className="block w-40 text-xs text-slate-600 file:mr-2 file:rounded-full file:border-0 file:bg-mint/20 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-mint"
                />
                <button
                  type="submit"
                  className="mt-2 rounded-full bg-mint px-4 py-1.5 text-sm font-extrabold text-white"
                >
                  Simpan Foto
                </button>
              </form>
              {u?.avatarUrl && (
                <form action={removeAvatar}>
                  <button type="submit" className="text-xs font-bold text-slate-400 hover:text-coral">
                    Hapus foto
                  </button>
                </form>
              )}
            </div>
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-400">
              Segera
            </span>
          )}
        </div>

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
