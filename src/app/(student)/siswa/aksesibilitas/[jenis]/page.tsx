import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, users } from "@/db";
import { getGuide, sanitizeDisabilities } from "@/lib/accessibility";
import { DisabilityIcon, TONE_CLASS } from "@/components/kid/disability-icon";
import { IconAlert } from "@/components/kid/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ jenis: string }>;
}) {
  const { jenis } = await params;
  const g = getGuide(jenis);
  return { title: g ? `${g.label} · Aksesibilitas` : "Aksesibilitas · Siswa" };
}

export default async function AksesibilitasDetailPage({
  params,
}: {
  params: Promise<{ jenis: string }>;
}) {
  const session = await auth();
  const studentId = session?.user?.id;
  if (!studentId || session?.user?.role !== "student") redirect("/dashboard");

  const { jenis } = await params;
  const guide = getGuide(jenis);
  if (!guide) notFound();

  const [u] = await db
    .select({ disabilities: users.disabilities })
    .from(users)
    .where(eq(users.id, studentId))
    .limit(1);
  const selected = sanitizeDisabilities(u?.disabilities).includes(guide.key);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/siswa/aksesibilitas"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700"
      >
        ← Semua kebutuhan
      </Link>

      <div className="flex items-center gap-4">
        <span
          className={`grid h-16 w-16 shrink-0 place-items-center rounded-3xl ${TONE_CLASS[guide.tone]}`}
        >
          <DisabilityIcon kind={guide.key} className="h-8 w-8" />
        </span>
        <div>
          <h1 className="font-kid-display text-2xl font-extrabold text-slate-800">
            {guide.label}
          </h1>
          <p className="text-sm font-bold text-slate-400">{guide.formal}</p>
        </div>
      </div>
      <p className="mt-4 text-slate-600">{guide.tagline}</p>

      <h2 className="mb-3 mt-8 font-kid-display text-lg font-extrabold text-slate-800">
        Fitur yang membantumu
      </h2>
      <div className="space-y-3">
        {guide.features.map((f) => (
          <div
            key={f.title}
            className="flex items-start justify-between gap-4 rounded-3xl border-2 border-slate-200/70 bg-white p-5"
          >
            <div className="min-w-0">
              <div className="font-kid-display font-extrabold text-slate-800">
                {f.title}
              </div>
              <p className="mt-0.5 text-sm text-slate-500">{f.desc}</p>
            </div>
            {f.status === "aktif" ? (
              <span className="shrink-0 rounded-full bg-mint/15 px-3 py-1 text-xs font-extrabold text-mint">
                Sudah bisa
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-400">
                Segera
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-3xl border-2 border-sunny/40 bg-sunny/10 p-5">
        <IconAlert className="mt-0.5 h-5 w-5 shrink-0 text-sunny" />
        <p className="text-sm text-slate-600">
          Fitur bertanda <span className="font-extrabold">Segera</span> sedang
          kami siapkan. Nyalakan preferensimu sekarang di Pengaturan, nanti fitur
          otomatis aktif saat sudah siap.
        </p>
      </div>

      <div className="mt-6">
        {selected ? (
          <div className="rounded-3xl border-2 border-mint/40 bg-mint/10 px-5 py-4 text-center text-sm font-bold text-slate-600">
            Kebutuhan ini sudah kamu pilih. Atur lagi kapan saja di{" "}
            <Link href="/siswa/pengaturan" className="text-mint underline">
              Pengaturan
            </Link>
            .
          </div>
        ) : (
          <Link
            href="/siswa/pengaturan"
            className="block rounded-full bg-sky px-5 py-3 text-center font-extrabold text-white transition hover:brightness-95"
          >
            Pilih kebutuhan ini di Pengaturan
          </Link>
        )}
      </div>
    </div>
  );
}
