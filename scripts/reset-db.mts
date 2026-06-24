/**
 * Reset DB (AMAN / scoped): hanya menghapus tabel milik project ini +
 * riwayat migrasi drizzle. TIDAK menyentuh tabel lain di schema public.
 * Dipakai saat tahap awal (data hanya seed yang bisa dibuat ulang).
 *
 * Jalankan: node --env-file=.env.local --experimental-strip-types scripts/reset-db.mts
 */
import { neon } from "@neondatabase/serverless";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL belum diatur di .env.local");

const sql = neon(url);

async function main() {
  // Drop SEMUA tabel di schema public (generik) — robust terhadap penambahan
  // tabel baru di src/db/schema.ts tanpa harus memperbarui daftar manual.
  console.log("Menghapus semua tabel di schema public...");
  const res = await sql.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
  );
  const rows = (Array.isArray(res) ? res : res.rows) as { tablename: string }[];
  for (const { tablename } of rows) {
    await sql.query(`DROP TABLE IF EXISTS "public"."${tablename}" CASCADE`);
    console.log(`  ✓ drop ${tablename}`);
  }

  // Riwayat migrasi drizzle disimpan di schema "drizzle".
  await sql.query(`DROP SCHEMA IF EXISTS drizzle CASCADE`);
  console.log("  ✓ drop schema drizzle (riwayat migrasi)");

  // Hapus folder migrasi lokal agar generate menghasilkan baseline baru.
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  rmSync(join(root, "drizzle"), { recursive: true, force: true });
  console.log("  ✓ hapus folder ./drizzle lokal");

  console.log("Selesai. Lanjut: db:generate -> db:migrate -> db:seed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
