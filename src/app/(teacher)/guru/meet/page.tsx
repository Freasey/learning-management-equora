import { redirect } from "next/navigation";
import { Video } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Meet · Guru" };

export default async function MeetPage() {
  const session = await auth();
  if (!session?.user?.schoolId || session?.user?.role !== "teacher") redirect("/dashboard");

  return (
    <div>
      <PageHeader title="Meet" description="Kelas tatap muka daring." />
      <div className="rounded-xl border border-dashed border-line bg-paper p-12 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-700/10 text-teal-700">
          <Video className="h-7 w-7" />
        </span>
        <h2 className="mt-4 font-display text-xl font-medium text-ink">
          Meet sedang disiapkan
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Fitur kelas daring (WebRTC, dibangun sendiri) akan berjalan di server
          media terpisah. Termasuk dukungan inklusif: teks langsung untuk
          tunarungu &amp; bahasa isyarat. Menyusul pada fase berikutnya.
        </p>
      </div>
    </div>
  );
}
