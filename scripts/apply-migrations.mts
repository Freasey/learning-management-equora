/**
 * Terapkan migrasi drizzle (folder ./drizzle/*.sql) langsung lewat driver
 * Neon HTTP. Dipakai sebagai pengganti `drizzle-kit migrate` yang kurang andal
 * di atas driver serverless (kadang hang). Non-interaktif & aman untuk script.
 *
 * Jalankan: node --env-file=.env.local --experimental-strip-types scripts/apply-migrations.mts
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL belum diatur di .env.local");

const sql = neon(url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "drizzle");

async function main() {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  if (files.length === 0) throw new Error("Tidak ada file migrasi di ./drizzle.");

  for (const file of files) {
    const raw = readFileSync(join(dir, file), "utf8");
    const statements = raw
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
    console.log(`Menerapkan ${file} (${statements.length} statement)...`);
    for (const stmt of statements) {
      await sql.query(stmt);
    }
  }
  console.log("✓ Semua migrasi diterapkan.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
