import { redirect } from "next/navigation";
import { MessagesSquare } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Obrolan Kelas · Guru" };

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user?.schoolId || session?.user?.role !== "teacher") redirect("/dashboard");

  return (
    <div>
      <PageHeader title="Obrolan Kelas" description="Group chat per Kelas & Mata Pelajaran." />
      <div className="rounded-xl border border-dashed border-line bg-paper p-12 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-700/10 text-teal-700">
          <MessagesSquare className="h-7 w-7" />
        </span>
        <h2 className="mt-4 font-display text-xl font-medium text-ink">
          Obrolan sedang menunggu WebSocket
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted">
          Setiap pasangan <strong className="text-ink">Kelas + Mata Pelajaran</strong>{" "}
          (mis. &ldquo;Kelas A — Fisika&rdquo;) akan punya grup chat otomatis—dibuat
          dari jadwal &amp; daftar siswa, menggantikan WhatsApp grup. Anggota = guru
          pengampu + siswa kelas tersebut.
        </p>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
          Fitur ini menyala bersama <strong className="text-ink">server WebSocket</strong>{" "}
          (dibangun sekaligus dengan Meet) agar pesan benar-benar real-time. Titik
          merah penanda pesan belum terbaca juga akan aktif saat itu.
        </p>
      </div>
    </div>
  );
}
