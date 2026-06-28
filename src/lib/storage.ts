import { put, del } from "@vercel/blob";
import { eq, sql } from "drizzle-orm";
import { db, files } from "@/db";
import { getSchoolPlan } from "@/lib/quota";

/** True bila token Vercel Blob tersedia (penyimpanan aktif). */
export function isStorageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Total byte terpakai sebuah sekolah (dasar kuota storage). */
export async function storageUsedBytes(schoolId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${files.sizeBytes}), 0)` })
    .from(files)
    .where(eq(files.schoolId, schoolId));
  return Number(row?.total ?? 0);
}

/** Lempar bila menambah `addBytes` melampaui kuota (storageGb null = tak terbatas). */
export async function assertStorageQuota(schoolId: string, addBytes: number) {
  const plan = await getSchoolPlan(schoolId);
  const gb = plan?.storageGb;
  if (gb === null || gb === undefined) return;
  const limit = gb * 1_000_000_000;
  const used = await storageUsedBytes(schoolId);
  if (used + addBytes > limit) {
    throw new Error(
      `Kuota penyimpanan paket Anda penuh (${(used / 1e9).toFixed(2)}/${gb} GB). Upgrade paket untuk menambah.`,
    );
  }
}

/** Catat metadata berkas (dipanggil setelah unggah ke Blob berhasil). */
export async function recordFile(input: {
  schoolId: string;
  ownerId?: string | null;
  key: string;
  url?: string | null;
  sizeBytes: number;
  contentType?: string | null;
  kind?: string;
}) {
  const [row] = await db
    .insert(files)
    .values({
      schoolId: input.schoolId,
      ownerId: input.ownerId ?? null,
      key: input.key,
      url: input.url ?? null,
      sizeBytes: input.sizeBytes,
      contentType: input.contentType ?? null,
      kind: input.kind ?? "material",
    })
    .returning();
  return row;
}

/** Bersihkan nama berkas agar aman dipakai sebagai bagian path objek. */
function safeName(name: string): string {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return cleaned.slice(0, 80) || "berkas";
}

export type StoredFile = {
  url: string;
  key: string;
  sizeBytes: number;
  contentType: string | null;
};

/**
 * Unggah sebuah `File` (dari FormData) ke Vercel Blob, lalu catat metadatanya
 * (untuk akuntansi kuota) di tabel `files`. Menegakkan kuota penyimpanan paket
 * sekolah sebelum mengunggah.
 *
 * UI menyembunyikan tombol unggah saat isStorageConfigured() false; bila tetap
 * dipanggil tanpa token, melempar error ramah.
 */
export async function uploadFile(input: {
  schoolId: string;
  file: File;
  kind?: string; // material | attachment | avatar | logo | image
  prefix?: string; // segmen folder objek, mis. "materials"
  ownerId?: string | null;
  maxBytes?: number; // batas ukuran per-unggahan (opsional)
}): Promise<StoredFile> {
  if (!isStorageConfigured()) {
    throw new Error(
      "Penyimpanan (Vercel Blob) belum dikonfigurasi. Atur BLOB_READ_WRITE_TOKEN di environment.",
    );
  }
  const { file, schoolId } = input;
  if (!file || typeof file.size !== "number" || file.size === 0) {
    throw new Error("Tidak ada berkas untuk diunggah.");
  }
  if (input.maxBytes && file.size > input.maxBytes) {
    const mb = (input.maxBytes / 1_000_000).toFixed(0);
    throw new Error(`Ukuran berkas melebihi batas ${mb} MB.`);
  }

  await assertStorageQuota(schoolId, file.size);

  const folder = input.prefix ?? input.kind ?? "uploads";
  const pathname = `${schoolId}/${folder}/${safeName(file.name)}`;

  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type || undefined,
  });

  await recordFile({
    schoolId,
    ownerId: input.ownerId,
    key: blob.pathname,
    url: blob.url,
    sizeBytes: file.size,
    contentType: file.type || null,
    kind: input.kind ?? "material",
  });

  return {
    url: blob.url,
    key: blob.pathname,
    sizeBytes: file.size,
    contentType: file.type || null,
  };
}

/**
 * Hapus sebuah objek dari Blob berdasarkan URL-nya & lepaskan kuota yang
 * terpakai (hapus baris di tabel `files`). Aman dipanggil dengan url kosong.
 */
export async function deleteFile(url: string | null | undefined): Promise<void> {
  if (!url) return;
  try {
    await del(url);
  } catch {
    // Objek mungkin sudah tidak ada — tetap bersihkan metadatanya.
  }
  await db.delete(files).where(eq(files.url, url));
}
