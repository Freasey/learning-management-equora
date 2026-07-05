import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { UserRound } from "lucide-react";
import { auth } from "@/auth";
import { db, users } from "@/db";
import { isStorageConfigured } from "@/lib/storage";
import {
  COLOR_VISION_MODES,
  DISABILITY_GUIDES,
  sanitizeColorVision,
  sanitizeDisabilities,
} from "@/lib/accessibility";
import { DisabilityIcon, TONE_CLASS } from "@/components/kid/disability-icon";
import { toggleDisability, setColorVision } from "./actions";
import { updateAvatar, removeAvatar } from "../../../(account)/account-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengaturan · Siswa" };

/** Pilihan Mode Warna: "normal" (palet standar) + mode dari accessibility.ts. */
const COLOR_OPTIONS = [
  {
    key: "normal",
    label: "Warna biasa",
    desc: "Palet standar aplikasi.",
    preview: ["#27ca9a", "#ff6b5e", "#3da9fc", "#ffc145"],
  },
  ...COLOR_VISION_MODES.map((m) => ({
    key: m.key,
    label: m.label,
    desc: m.desc,
    preview: m.preview,
  })),
];

export default async function PengaturanSiswaPage() {
  const session = await auth();
  const studentId = session?.user?.id;
  if (!studentId || session?.user?.role !== "student") redirect("/dashboard");

  const [u] = await db
    .select({
      avatarUrl: users.avatarUrl,
      disabilities: users.disabilities,
      colorVision: users.colorVision,
    })
    .from(users)
    .where(eq(users.id, studentId))
    .limit(1);
  const mine = new Set(sanitizeDisabilities(u?.disabilities));
  const colorMode = sanitizeColorVision(u?.colorVision);
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
                  aria-label="Pilih file foto profil"
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

        {/* Kebutuhan khusus */}
        <div className="rounded-3xl border-2 border-slate-200/70 bg-white p-5">
          <div className="font-kid-display text-lg font-extrabold text-slate-800">
            Kebutuhan Khususmu
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Pilih kebutuhanmu supaya kami bisa membantu caramu belajar.
          </p>

          <div className="mt-4 space-y-2.5">
            {DISABILITY_GUIDES.map((g) => {
              const on = mine.has(g.key);
              return (
                <div
                  key={g.key}
                  className={`rounded-2xl border-2 p-3.5 transition ${
                    on ? "border-slate-300 bg-slate-50/60" : "border-slate-200/70"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${TONE_CLASS[g.tone]}`}
                    >
                      <DisabilityIcon kind={g.key} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-800">{g.label}</div>
                      <div className="text-xs text-slate-400">{g.formal}</div>
                    </div>
                    <form action={toggleDisability}>
                      <input type="hidden" name="key" value={g.key} />
                      <button
                        type="submit"
                        aria-pressed={on}
                        aria-label={`${on ? "Matikan" : "Pilih"} ${g.label}`}
                        className={`relative h-8 w-14 rounded-full transition ${on ? "bg-mint" : "bg-slate-300"}`}
                      >
                        <span
                          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-7" : "left-1"}`}
                        />
                      </button>
                    </form>
                  </div>

                  {/* Mode Warna: hanya untuk kebutuhan buta-warna yang aktif. */}
                  {g.key === "buta-warna" && on && (
                    <div className="mt-3.5 border-t-2 border-slate-200/70 pt-3.5">
                      <div className="text-sm font-extrabold text-slate-700">
                        Mode Warna
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Pilih warna yang sulit kamu bedakan — warna aplikasi
                        langsung menyesuaikan untukmu.
                      </p>
                      <div
                        className="mt-3 space-y-2"
                        role="radiogroup"
                        aria-label="Mode Warna"
                      >
                        {COLOR_OPTIONS.map((opt) => {
                          const active =
                            opt.key === "normal"
                              ? colorMode === null
                              : colorMode === opt.key;
                          return (
                            <form key={opt.key} action={setColorVision}>
                              <input type="hidden" name="mode" value={opt.key} />
                              <button
                                type="submit"
                                role="radio"
                                aria-checked={active}
                                className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${
                                  active
                                    ? "border-sky bg-sky/5"
                                    : "border-slate-200/70 hover:border-slate-300"
                                }`}
                              >
                                <span
                                  aria-hidden
                                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                                    active ? "border-sky" : "border-slate-300"
                                  }`}
                                >
                                  {active && (
                                    <span className="h-2.5 w-2.5 rounded-full bg-sky" />
                                  )}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-bold text-slate-800">
                                    {opt.label}
                                  </span>
                                  <span className="block text-xs text-slate-400">
                                    {opt.desc}
                                  </span>
                                </span>
                                {/* Contoh warna: hex tetap, tidak ikut berubah palet. */}
                                <span aria-hidden className="flex shrink-0 gap-1">
                                  {opt.preview.map((c) => (
                                    <span
                                      key={c}
                                      className="h-4 w-4 rounded-full border border-black/10"
                                      style={{ backgroundColor: c }}
                                    />
                                  ))}
                                </span>
                              </button>
                            </form>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Link
            href="/siswa/aksesibilitas"
            className="mt-4 flex items-center justify-center gap-1.5 rounded-full bg-sky/10 px-4 py-2.5 text-sm font-extrabold text-sky transition hover:bg-sky/20"
          >
            Lihat semua fitur untukmu →
          </Link>
        </div>
      </div>
    </div>
  );
}
