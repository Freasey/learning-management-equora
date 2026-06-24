import { and, eq, sql } from "drizzle-orm";
import { db, files } from "@/db";
import { getSchoolPlan } from "@/lib/quota";

/** True bila kredensial Cloudflare R2 lengkap. */
export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET,
  );
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

/** Catat metadata berkas (dipanggil setelah unggah ke R2 berhasil). */
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

/**
 * Unggah objek ke R2. Saat kredensial belum diatur, melempar error ramah
 * (UI memakai isStorageConfigured() untuk menyembunyikan tombol unggah).
 * Implementasi PUT S3 nyata ditambahkan saat kredensial tersedia.
 */
export async function uploadObject(): Promise<never> {
  throw new Error(
    "Penyimpanan (Cloudflare R2) belum dikonfigurasi. Atur R2_* di environment.",
  );
}
