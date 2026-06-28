import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import { AsyncLocalStorage } from "node:async_hooks";
import * as schema from "./schema";

/**
 * RLS (A1) — isolasi tenant di lapisan database.
 *
 * Driver: neon-serverless (Pool/WebSocket) — mendukung transaksi interaktif
 * yang DIBUTUHKAN untuk `SET LOCAL app.current_school_id` per-request. Driver
 * lama neon-http stateless tak bisa menahan GUC antar-statement.
 *
 * Dua mode koneksi:
 *  - APP_DB_PASSWORD diisi → app konek sebagai role NON-OWNER `app_tenant`
 *    → policy RLS DITEGAKKAN (lihat scripts/apply-rls.mts).
 *  - Kosong → fallback ke role owner (DATABASE_URL apa adanya). Owner
 *    mem-bypass RLS, jadi perilaku = app-level scoping seperti sebelumnya
 *    (nol risiko). Set env-nya untuk "menyalakan" enforcement.
 *
 * Semua `db.*` di dalam withTenant() otomatis dialihkan ke transaksi yang
 * sudah menyetel GUC (via AsyncLocalStorage) — call-site tak perlu meneruskan
 * objek transaksi.
 */

// Node 22 menyediakan global WebSocket; neon-serverless butuh konstruktornya.
if (!neonConfig.webSocketConstructor && typeof WebSocket !== "undefined") {
  neonConfig.webSocketConstructor =
    WebSocket as unknown as typeof neonConfig.webSocketConstructor;
}

const ownerUrl = process.env.DATABASE_URL;
if (!ownerUrl) {
  throw new Error(
    "DATABASE_URL belum diatur. Isi di .env.local (connection string Neon).",
  );
}

/** Bangun connection string runtime: tukar kredensial ke app_tenant bila ada. */
function runtimeConnString(): string {
  const password = process.env.APP_DB_PASSWORD;
  if (!password) return ownerUrl as string;
  const url = new URL(ownerUrl as string);
  url.username = process.env.APP_DB_USER || "app_tenant";
  url.password = password;
  return url.toString();
}

type TenantDb = NeonDatabase<typeof schema>;

const pool = new Pool({ connectionString: runtimeConnString() });
const baseDb = drizzle(pool, { schema });

// Menyimpan koneksi transaksi ber-tenant yang aktif untuk request berjalan.
const tenantStore = new AsyncLocalStorage<TenantDb>();

/**
 * `db` ber-konteks: di dalam withTenant() mengarah ke transaksi ber-GUC;
 * di luar (super-admin, login, seed, job non-tenant) ke pool dasar.
 */
export const db = new Proxy(baseDb, {
  get(target, prop, receiver) {
    const active = (tenantStore.getStore() ?? target) as object;
    const value = Reflect.get(active, prop, receiver);
    return typeof value === "function" ? value.bind(active) : value;
  },
}) as TenantDb;

/** Sinyal kontrol-alur Next (redirect/notFound) — bukan error sungguhan. */
function isControlFlowSignal(e: unknown): boolean {
  const digest = (e as { digest?: unknown } | null)?.digest;
  return (
    typeof digest === "string" &&
    (digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND")
  );
}

/**
 * Jalankan `fn` dalam konteks SATU sekolah. Membuka transaksi, menyetel GUC
 * `app.current_school_id` (dibaca policy RLS), lalu mengarahkan semua `db` di
 * dalamnya ke transaksi itu.
 *
 * redirect()/notFound() Next melempar sinyal — diperlakukan sebagai SUKSES
 * (COMMIT) agar tulisan sebelum redirect tidak ikut ter-rollback.
 */
export async function withTenant<T>(
  schoolId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  const tdb = drizzle(client, { schema });
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.current_school_id', $1, true)", [
      schoolId,
    ]);
    let result: T;
    try {
      result = await tenantStore.run(tdb, fn);
    } catch (e) {
      if (isControlFlowSignal(e)) {
        await client.query("COMMIT");
      } else {
        await client.query("ROLLBACK");
      }
      throw e;
    }
    await client.query("COMMIT");
    return result;
  } finally {
    client.release();
  }
}

export * from "./schema";
