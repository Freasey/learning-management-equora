/**
 * A1 — Terapkan Row-Level Security (RLS) untuk isolasi tenant.
 *
 * Dijalankan sebagai role OWNER (DATABASE_URL). Idempoten — aman diulang.
 * Karena reset-db.mts MENGHAPUS folder ./drizzle tiap reset, policy RLS TIDAK
 * disimpan sebagai migrasi statis melainkan diturunkan ulang oleh script ini.
 *
 * Yang dilakukan:
 *  1. (Bila APP_DB_PASSWORD ada) buat/update role NON-OWNER `app_tenant` +
 *     beri hak DML. App runtime konek sebagai role ini → RLS DITEGAKKAN
 *     (owner mem-bypass, jadi seed/migrasi/super-admin tetap lintas-sekolah).
 *  2. ENABLE RLS + policy `tenant_isolation` pada tiap tabel ber-school_id.
 *     Policy: baris terlihat/boleh-tulis hanya bila
 *       school_id = current_setting('app.current_school_id')  (di-set withTenant).
 *     GUC belum di-set → NULL → default DENY (aman).
 *
 * Jalankan: npm run db:rls   (atau bagian dari npm run demo:reset)
 */
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL belum diatur di .env.local");

const sql = neon(url);

const APP_ROLE = process.env.APP_DB_USER || "app_tenant";
const APP_PASSWORD = process.env.APP_DB_PASSWORD || "";

/** Tabel ber-`school_id NOT NULL` yang diisolasi per tenant. */
const TENANT_TABLES = [
  "academic_years",
  "subjects",
  "classes",
  "enrollments",
  "class_subjects",
  "schedules",
  "school_announcements",
  "materials",
  "assessments",
  "questions",
  "grade_items",
  "grades",
  "attempts",
  "answers",
  "files",
  "ai_usage",
  "chat_messages",
  "chat_reads",
];

async function q(text: string) {
  await sql.query(text);
}

async function roleExists(name: string): Promise<boolean> {
  const res: unknown = await sql.query(
    `SELECT 1 AS ok FROM pg_roles WHERE rolname = $1`,
    [name],
  );
  const rows = Array.isArray(res)
    ? res
    : ((res as { rows?: unknown[] }).rows ?? []);
  return rows.length > 0;
}

async function ensureAppRole() {
  const exists = await roleExists(APP_ROLE);

  if (APP_PASSWORD) {
    const pw = APP_PASSWORD.replace(/'/g, "''"); // escape untuk literal SQL
    if (exists) {
      await q(`ALTER ROLE "${APP_ROLE}" WITH LOGIN PASSWORD '${pw}'`);
      console.log(`  ✓ role ${APP_ROLE}: password diperbarui`);
    } else {
      await q(`CREATE ROLE "${APP_ROLE}" WITH LOGIN PASSWORD '${pw}'`);
      console.log(`  ✓ role ${APP_ROLE}: dibuat`);
    }
  } else if (!exists) {
    console.warn(
      `  ! APP_DB_PASSWORD kosong & role ${APP_ROLE} belum ada → lewati pembuatan role.\n` +
        `    Policy RLS tetap dibuat (owner mem-bypass, app jalan mode owner).\n` +
        `    Isi APP_DB_PASSWORD lalu jalankan ulang 'npm run db:rls' untuk menyalakan enforcement.`,
    );
    return false;
  }

  // Hak akses (idempoten). app_tenant butuh baca/tulis SEMUA tabel; tabel
  // non-tenant (users/schools/dll) tanpa RLS → akses penuh. Tabel tenant
  // dibatasi policy.
  await q(`GRANT USAGE ON SCHEMA public TO "${APP_ROLE}"`);
  await q(
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "${APP_ROLE}"`,
  );
  await q(
    `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "${APP_ROLE}"`,
  );
  // Tabel/sequence yang dibuat owner di masa depan otomatis ter-grant.
  await q(
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "${APP_ROLE}"`,
  );
  await q(
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO "${APP_ROLE}"`,
  );
  console.log(`  ✓ grant DML untuk ${APP_ROLE}`);
  return true;
}

async function applyPolicies() {
  for (const t of TENANT_TABLES) {
    await q(`ALTER TABLE public."${t}" ENABLE ROW LEVEL SECURITY`);
    await q(`DROP POLICY IF EXISTS tenant_isolation ON public."${t}"`);
    await q(
      `CREATE POLICY tenant_isolation ON public."${t}"
         USING (school_id = current_setting('app.current_school_id', true)::uuid)
         WITH CHECK (school_id = current_setting('app.current_school_id', true)::uuid)`,
    );
    console.log(`  ✓ RLS + policy: ${t}`);
  }
}

async function main() {
  console.log("Menyiapkan role app_tenant...");
  await ensureAppRole();
  console.log("Menerapkan policy RLS pada tabel tenant...");
  await applyPolicies();
  console.log("✓ RLS selesai diterapkan.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
