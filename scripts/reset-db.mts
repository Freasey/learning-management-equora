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

// Tabel milik project (urutan apa pun — pakai CASCADE). Harus mencakup SEMUA
// tabel di src/db/schema.ts agar baseline `CREATE TABLE` tidak bentrok.
const projectTables = [
  // konten & penilaian
  "answers",
  "attempts",
  "grades",
  "grade_items",
  "questions",
  "assessments",
  "materials",
  // akademik
  "school_announcements",
  "schedules",
  "class_subjects",
  "enrollments",
  "classes",
  "subjects",
  "curriculum_subjects",
  "academic_years",
  // dokumentasi
  "doc_revisions",
  "doc_articles",
  // inti
  "memberships",
  "contact_requests",
  "announcements",
  "users",
  "schools",
  "tenants", // nama lama, jaga-jaga bila masih ada
  "pricing_plans",
];

async function main() {
  console.log("Menghapus tabel project (scoped)...");
  for (const t of projectTables) {
    await sql.query(`DROP TABLE IF EXISTS "${t}" CASCADE`);
    console.log(`  ✓ drop ${t}`);
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
