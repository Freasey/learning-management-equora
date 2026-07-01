import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, users } from "@/db";
import { DISABILITY_GUIDES, sanitizeDisabilities } from "@/lib/accessibility";
import { DisabilityIcon, TONE_CLASS } from "@/components/kid/disability-icon";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panduan Aksesibilitas · Siswa" };

export default async function AksesibilitasIndexPage() {
  const session = await auth();
  const studentId = session?.user?.id;
  if (!studentId || session?.user?.role !== "student") redirect("/dashboard");

  const [u] = await db
    .select({ disabilities: users.disabilities })
    .from(users)
    .where(eq(users.id, studentId))
    .limit(1);
  const mine = new Set(sanitizeDisabilities(u?.disabilities));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 font-kid-display text-2xl font-extrabold text-slate-800">
        Fitur untukmu
      </h1>
      <p className="mb-6 text-slate-500">
        Pilih kebutuhanmu untuk melihat fitur apa saja yang bisa membantumu belajar.
        Kamu bisa mengubah pilihan di{" "}
        <Link href="/siswa/pengaturan" className="font-bold text-sky underline">
          Pengaturan
        </Link>
        .
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {DISABILITY_GUIDES.map((g) => {
          const selected = mine.has(g.key);
          return (
            <Link
              key={g.key}
              href={`/siswa/aksesibilitas/${g.key}`}
              className={`group flex flex-col gap-3 rounded-3xl border-2 bg-white p-5 transition ${
                selected ? "border-slate-300 shadow-sm" : "border-slate-200/70 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${TONE_CLASS[g.tone]}`}
                >
                  <DisabilityIcon kind={g.key} className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <div className="font-kid-display text-lg font-extrabold text-slate-800">
                    {g.label}
                  </div>
                  <div className="text-xs font-bold text-slate-400">{g.formal}</div>
                </div>
                {selected && (
                  <span className="ml-auto rounded-full bg-mint/15 px-2.5 py-1 text-xs font-extrabold text-mint">
                    Kebutuhanmu
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">{g.tagline}</p>
              <span className="mt-auto text-sm font-extrabold text-sky">
                Lihat fiturnya →
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
