# Row-Level Security (RLS) — Isolasi Tenant (A1)

Isolasi data antar-sekolah ditegakkan **di lapisan database** (Postgres RLS),
bukan hanya di aplikasi. Ini jaring pengaman: meski ada bug query yang lupa
`WHERE school_id = ...`, database tetap menolak kebocoran lintas-sekolah.

## Cara kerja

- **Driver:** `neon-serverless` (Pool/WebSocket) — mendukung transaksi
  interaktif yang dibutuhkan untuk `SET LOCAL app.current_school_id`. (Driver
  lama `neon-http` stateless tak bisa.) Lihat [src/db/index.ts](src/db/index.ts).
- **Dua role:**
  - **owner** (`DATABASE_URL`) → migrasi, seed, script, super-admin. Mem-**bypass** RLS.
  - **`app_tenant`** (non-owner) → dipakai app runtime. RLS **ditegakkan**.
- **`withTenant(schoolId, fn)`** membuka transaksi, menyetel GUC
  `app.current_school_id`, dan mengarahkan semua `db.*` di dalam `fn` ke
  transaksi itu (via AsyncLocalStorage). Policy:
  `school_id = current_setting('app.current_school_id')`. GUC belum di-set →
  NULL → **default DENY**.
- **`redirect()`/`notFound()`** Next (yang melempar sinyal) diperlakukan sebagai
  COMMIT, jadi tulisan sebelum redirect tidak ter-rollback.

## Mode operasi (gated)

| `APP_DB_PASSWORD` | Koneksi app | RLS |
|---|---|---|
| kosong (default) | owner | TIDAK ditegakkan (scoping app-level seperti biasa) |
| diisi | app_tenant | **DITEGAKKAN** |

Default kosong = **nol risiko**: app berjalan persis seperti sebelumnya.

## Menyalakan enforcement

1. Set `APP_DB_PASSWORD` (password apa saja) di `.env.local`.
2. `npm run db:rls` — membuat role `app_tenant` + policy (idempoten).
   Sudah otomatis dijalankan di akhir `npm run demo:reset`.
3. Restart app. App konek sebagai `app_tenant`; isolasi aktif.

Verifikasi cepat (terbukti saat implementasi): sebagai `app_tenant`, tanpa GUC →
0 baris; dengan GUC sekolah A → hanya data A; INSERT untuk sekolah lain →
ditolak `WITH CHECK`.

## Tabel ber-RLS

academic_years, subjects, classes, enrollments, class_subjects, schedules,
school_announcements, materials, assessments, questions, grade_items, grades,
attempts, answers, files, ai_usage. (Lihat `TENANT_TABLES` di
[scripts/apply-rls.mts](scripts/apply-rls.mts).)

Tabel **lintas-sekolah / auth** sengaja TIDAK ber-RLS (diandalkan app-level):
users, schools, memberships, notifications, audit_logs, parent_links,
pricing_plans, contact_requests, doc_articles, curriculum_subjects.

## Status pembungkusan call-site

`withTenant` wajib membungkus tiap entry-point (action/page) yang menyentuh
tabel RLS. Helper (academic.ts, teaching.ts, student.ts, dll.) otomatis ikut
karena `db` dialihkan via ALS selama berada di dalam `withTenant`.

- ✅ **Semua server action tulisan** (guru: nilai/kuis/materi; siswa: kuis;
  admin: actions/kelas/mapel/jadwal/pengumuman/siswa/pengaturan/pendaftaran).
  Action yang hanya menyentuh tabel non-RLS (guru, langganan, ortu, sebagian
  siswa/pengaturan) sengaja tidak dibungkus.
- ⏳ **Page loader read-only** — BELUM dibungkus. Sebelum enforcement
  dinyalakan, bungkus loader yang menyentuh tabel RLS (lewat tabel langsung
  ATAU helper) di area (admin)/admin, (teacher)/guru, (student)/siswa,
  (parent)/ortu dengan pola yang sama:

  ```ts
  export default async function Page(props) {
    const { schoolId } = await requireSchoolAdmin();
    return withTenant(schoolId, async () => {
      // ...badan loader yang mengembalikan JSX...
    });
  }
  ```

Selama page loader belum dibungkus, biarkan `APP_DB_PASSWORD` kosong (mode
owner) supaya halaman read tetap menampilkan data.
