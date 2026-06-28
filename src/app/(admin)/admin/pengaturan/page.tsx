import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, schools } from "@/db";
import { listYears } from "@/lib/academic";
import { formatDate } from "@/lib/format";
import { isStorageConfigured } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { PageHeader, Field, SelectField, FileField, RowAction } from "@/components/admin/ui";
import {
  updateSchoolProfile,
  updateSchoolLogo,
  removeSchoolLogo,
  addAcademicYear,
  setActiveYear,
  deleteAcademicYear,
  rolloverAcademicYear,
} from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengaturan · Admin Sekolah" };

export default async function PengaturanPage() {
  const session = await auth();
  const schoolId = session?.user?.schoolId;
  if (!schoolId) redirect("/super");

  const [school] = await db
    .select()
    .from(schools)
    .where(eq(schools.id, schoolId))
    .limit(1);
  const years = await listYears(schoolId);
  const activeYear = years.find((y) => y.isActive);
  const storageOn = isStorageConfigured();

  return (
    <div>
      <PageHeader
        title="Pengaturan"
        description="Profil sekolah dan tahun ajaran."
      />

      <form
        action={updateSchoolProfile}
        className="mb-8 rounded-xl border border-line bg-paper p-6"
      >
        <h2 className="mb-4 font-display text-lg font-medium text-ink">
          Profil Sekolah
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nama sekolah" name="name" defaultValue={school.name} required />
          <SelectField label="Jenjang" name="level" defaultValue={school.level ?? "SMA"}>
            <option value="SD">SD/MI</option>
            <option value="SMP">SMP/MTs</option>
            <option value="SMA">SMA/MA</option>
            <option value="SMK">SMK/MAK</option>
          </SelectField>
          <Field
            label="Email kontak"
            name="contactEmail"
            type="email"
            defaultValue={school.contactEmail}
          />
          <Field
            label="Telepon"
            name="contactPhone"
            defaultValue={school.contactPhone}
          />
        </div>
        <div className="mt-4">
          <Button type="submit" variant="primary" size="sm">
            Simpan Profil
          </Button>
        </div>
      </form>

      {/* Logo sekolah */}
      <div className="mb-8 rounded-xl border border-line bg-paper p-6">
        <h2 className="mb-1 font-display text-lg font-medium text-ink">Logo Sekolah</h2>
        <p className="mb-4 text-sm text-muted">
          Tampil di kop kartu kredensial dan halaman sekolah.
        </p>
        <div className="flex flex-wrap items-center gap-5">
          <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-sand/40">
            {school.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={school.logoUrl} alt="Logo sekolah" className="h-full w-full object-contain" />
            ) : (
              <span className="font-mono text-[10px] uppercase text-muted">Belum ada</span>
            )}
          </span>
          {storageOn ? (
            <div className="flex flex-1 flex-wrap items-end gap-3">
              <form action={updateSchoolLogo} className="flex items-end gap-3">
                <FileField label="Pilih logo" name="logo" accept="image/*" required hint="PNG/JPG/SVG, maks 5 MB" />
                <Button type="submit" variant="primary" size="sm">Unggah</Button>
              </form>
              {school.logoUrl && (
                <form action={removeSchoolLogo}>
                  <RowAction danger>Hapus logo</RowAction>
                </form>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted">
              Penyimpanan (Vercel Blob) belum dikonfigurasi. Atur{" "}
              <code className="font-mono text-xs">BLOB_READ_WRITE_TOKEN</code> untuk mengunggah logo.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-paper p-6">
        <h2 className="mb-1 font-display text-lg font-medium text-ink">
          Tahun Ajaran
        </h2>
        <p className="mb-4 text-sm text-muted">
          Tahun ajaran aktif menjadi konteks untuk kelas, jadwal, dan penilaian.
        </p>

        <form action={addAcademicYear} className="mb-5 flex items-end gap-3">
          <div className="flex-1">
            <Field
              label="Tambah tahun ajaran"
              name="name"
              placeholder="cth. 2025/2026 Ganjil"
              required
            />
          </div>
          <Button type="submit" variant="accent" size="md">
            Tambah
          </Button>
        </form>

        <div className="space-y-2">
          {years.length === 0 ? (
            <p className="text-sm text-muted">Belum ada tahun ajaran.</p>
          ) : (
            years.map((y) => (
              <div
                key={y.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-line px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-ink">{y.name}</span>
                  {y.isActive && (
                    <span className="rounded-full bg-teal-700/10 px-2.5 py-0.5 font-mono text-[10px] uppercase text-teal-700">
                      Aktif
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-muted">
                    {formatDate(y.createdAt)}
                  </span>
                </div>
                <div className="flex gap-2">
                  {!y.isActive && (
                    <form action={setActiveYear}>
                      <input type="hidden" name="id" value={y.id} />
                      <RowAction>Jadikan Aktif</RowAction>
                    </form>
                  )}
                  <form action={deleteAcademicYear}>
                    <input type="hidden" name="id" value={y.id} />
                    <RowAction danger>Hapus</RowAction>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {years.length > 0 && (
        <div className="mt-8 rounded-xl border border-line bg-paper p-6">
          <h2 className="mb-1 font-display text-lg font-medium text-ink">
            Mulai Tahun Ajaran Baru
          </h2>
          <p className="mb-4 text-sm text-muted">
            Menyalin <strong>kelas, pengampu, dan jadwal</strong> dari tahun
            ajaran sumber ke tahun baru lalu menjadikannya aktif. Nilai dan kuis
            tahun lama tetap tersimpan (tidak ikut disalin).
          </p>

          <form action={rolloverAcademicYear} className="space-y-4">
            <div className="grid items-end gap-4 md:grid-cols-2">
              <SelectField
                label="Salin dari tahun ajaran"
                name="sourceYearId"
                defaultValue={activeYear?.id ?? years[0]?.id}
              >
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name}
                    {y.isActive ? " (aktif)" : ""}
                  </option>
                ))}
              </SelectField>
              <Field
                label="Nama tahun ajaran baru"
                name="name"
                placeholder="cth. 2026/2027 Ganjil"
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                name="includeStudents"
                className="h-4 w-4 rounded border-line text-teal-700 focus:ring-teal-700"
              />
              Naikkan siswa ke kelas yang sepadan (re-enroll otomatis)
            </label>
            <Button type="submit" variant="primary" size="sm">
              Buat &amp; Aktifkan
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
