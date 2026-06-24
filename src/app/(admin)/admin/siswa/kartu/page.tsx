import Link from "next/link";
import { redirect } from "next/navigation";
import { and, asc, eq, isNull } from "drizzle-orm";
import { auth } from "@/auth";
import { db, schools, classes } from "@/db";
import { getActiveYear } from "@/lib/academic";
import { PageHeader } from "@/components/admin/ui";
import { KartuTool } from "./kartu-tool";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kartu Akun Siswa · Admin Sekolah" };

export default async function KartuPage() {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  if (!schoolId) redirect("/super");

  const [school] = await db
    .select({ code: schools.code, name: schools.name })
    .from(schools)
    .where(eq(schools.id, schoolId))
    .limit(1);

  const year = await getActiveYear(schoolId);
  const classList = year
    ? await db
        .select({ id: classes.id, name: classes.name })
        .from(classes)
        .where(
          and(
            eq(classes.schoolId, schoolId),
            eq(classes.academicYearId, year.id),
            isNull(classes.deletedAt),
          ),
        )
        .orderBy(asc(classes.name))
    : [];

  return (
    <div>
      <PageHeader
        title="Kartu Akun Siswa"
        description="Setel ulang sandi sekelas & cetak kartu untuk dibagikan ke siswa."
      >
        <Link href="/admin/siswa" className="text-sm font-semibold text-teal-700">
          ← Kembali ke Siswa
        </Link>
      </PageHeader>

      {classList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-paper p-8 text-center text-muted">
          Belum ada kelas pada tahun ajaran aktif. Buat kelas dan tempatkan siswa
          dulu.
        </div>
      ) : (
        <KartuTool
          classes={classList}
          schoolCode={school?.code ?? ""}
          schoolName={school?.name ?? ""}
        />
      )}
    </div>
  );
}
