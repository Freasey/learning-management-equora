/**
 * Seed DATA DEMO: satu sekolah lengkap (kode DEMO01) — 1 admin, 5 guru,
 * 10 siswa, 1 orang tua, plus tahun ajaran, kelas, mapel & penempatan.
 *
 * Logika reset kini tinggal di `src/lib/demo.ts` (dipakai bersama oleh endpoint
 * cron & tombol reset di konsol Super Admin). Skrip ini membungkusnya untuk
 * pemakaian lokal + menulis kredensial ke ./DEMO_ACCOUNTS.md.
 *
 * Aman di-run berulang: sekolah DEMO01 dihapus dulu (CASCADE) lalu dibuat
 * ulang. Sekolah lain tidak tersentuh.
 *
 * Jalankan: npm run seed:demo   (butuh pricing plans sudah di-seed)
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  resetDemoSchool,
  DEMO_SCHOOL,
  DEMO_PASSWORD,
  DEMO_ACADEMIC_YEAR,
  DEMO_ADMIN_EMAIL,
  DEMO_TEACHERS,
  DEMO_STUDENT_NAMES,
} from "../src/lib/demo";

async function main() {
  const summary = await resetDemoSchool();
  console.log(`✓ Sekolah demo ${DEMO_SCHOOL.name} (kode ${DEMO_SCHOOL.code}) dibuat ulang.`);
  console.log(
    `  ${summary.teachers} guru · ${summary.students} siswa · ${summary.classes} kelas · ${summary.subjects} mapel`,
  );

  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  writeFileSync(join(root, "DEMO_ACCOUNTS.md"), renderCredentials(), "utf8");
  console.log("✓ Kredensial ditulis ke DEMO_ACCOUNTS.md");
}

function renderCredentials(): string {
  const teacherRows = DEMO_TEACHERS.map(
    (t, i) => `| Guru ${i + 1} | ${t.name} | \`${t.email}\` | \`${DEMO_PASSWORD}\` |`,
  ).join("\n");
  const studentRows = DEMO_STUDENT_NAMES.map((name, i) => {
    const nis = `2026${String(i + 1).padStart(3, "0")}`;
    return `| Siswa ${i + 1} | ${name} | \`${nis}\` | \`${DEMO_PASSWORD}\` | ${i < 5 ? "VII-A" : "VII-B"} |`;
  }).join("\n");

  return `# Akun Demo — ${DEMO_SCHOOL.name}

> Dibuat otomatis oleh \`npm run seed:demo\`. **Jangan dipakai di produksi.**
> Semua akun memakai kata sandi yang sama: \`${DEMO_PASSWORD}\`

- **Sekolah:** ${DEMO_SCHOOL.name} (jenjang ${DEMO_SCHOOL.level})
- **Kode sekolah:** \`${DEMO_SCHOOL.code}\`
- **Tahun ajaran aktif:** ${DEMO_ACADEMIC_YEAR}

## 1. Admin Sekolah (login via \`/masuk\` — pakai email)

| Peran | Nama | Email | Kata sandi |
| --- | --- | --- | --- |
| Admin Sekolah | Admin Demo | \`${DEMO_ADMIN_EMAIL}\` | \`${DEMO_PASSWORD}\` |

→ Setelah login diarahkan ke **/admin**.

## 2. Guru (login via \`/masuk\` — pakai email)

| # | Nama | Email | Kata sandi |
| --- | --- | --- | --- |
${teacherRows}

→ Setelah login diarahkan ke **/guru**.

## 3. Siswa (login via \`/masuk-siswa\` — pakai **kode sekolah** + NIS/username)

> Saat masuk, siswa wajib mengisi **kode sekolah** (\`${DEMO_SCHOOL.code}\`) lebih dulu, lalu NIS dan kata sandi.

| # | Nama | NIS (username) | Kata sandi | Kelas |
| --- | --- | --- | --- | --- |
${studentRows}

→ Setelah login diarahkan ke **/siswa**.

---

_Cara tercepat mencoba: buka halaman **/coba** lalu klik tombol peran yang diinginkan (login instan)._
`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
