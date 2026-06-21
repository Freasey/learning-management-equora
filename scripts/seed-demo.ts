/**
 * Seed DATA DEMO: satu sekolah lengkap berisi 1 admin sekolah, 5 guru, dan
 * 10 siswa (plus tahun ajaran, kelas, mapel, penempatan & pengampu).
 *
 * Aman di-run berulang: sekolah demo (kode DEMO01) dihapus dulu (CASCADE)
 * lalu dibuat ulang. Tidak menyentuh sekolah lain.
 *
 * Setelah selesai, menulis kredensial ke ./DEMO_ACCOUNTS.md.
 *
 * Jalankan: npm run seed:demo   (butuh pricing plans & curriculum sudah di-seed)
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import {
  db,
  schools,
  users,
  academicYears,
  subjects,
  classes,
  enrollments,
  classSubjects,
} from "../src/db/index";

// ── Konstanta sekolah demo ────────────────────────────────────────────────
const SCHOOL = {
  name: "SMP Demo Equora",
  code: "DEMO01",
  slug: "smp-demo-equora",
  level: "SMP",
  planKey: "pro",
};
const ACADEMIC_YEAR = "2025/2026 Ganjil";
const PASSWORD = "demo12345"; // dipakai semua akun demo (>=8 char)

// Mapel + guru pengampu (5 guru, 5 mapel).
const SUBJECTS = [
  { name: "Matematika", code: "MAT" },
  { name: "Bahasa Indonesia", code: "BIN" },
  { name: "Ilmu Pengetahuan Alam (IPA)", code: "IPA" },
  { name: "Bahasa Inggris", code: "BIG" },
  { name: "Informatika", code: "INF" },
];

const TEACHERS = [
  { name: "Andi Pratama", email: "andi.guru@demo.equora.id" },
  { name: "Siti Nurhaliza", email: "siti.guru@demo.equora.id" },
  { name: "Budi Santoso", email: "budi.guru@demo.equora.id" },
  { name: "Dewi Lestari", email: "dewi.guru@demo.equora.id" },
  { name: "Eko Wijaya", email: "eko.guru@demo.equora.id" },
];

const STUDENT_NAMES = [
  "Agus Setiawan",
  "Bella Putri",
  "Citra Maharani",
  "Dimas Aditya",
  "Eka Saputra",
  "Fani Rahmawati",
  "Galih Permana",
  "Hana Safira",
  "Ivan Maulana",
  "Joko Susilo",
];

// 2 kelas, 5 siswa masing-masing.
const CLASSES = [
  { name: "VII-A", level: "VII" },
  { name: "VII-B", level: "VII" },
];

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // Bersihkan sekolah demo lama (CASCADE menghapus user/kelas/mapel terkait).
  await db.delete(schools).where(eq(schools.code, SCHOOL.code));
  console.log(`Sekolah demo lama (${SCHOOL.code}) dibersihkan.`);

  // 1) Sekolah
  const [school] = await db
    .insert(schools)
    .values({
      name: SCHOOL.name,
      code: SCHOOL.code,
      slug: SCHOOL.slug,
      level: SCHOOL.level,
      planKey: SCHOOL.planKey,
      status: "active",
      contactEmail: "admin@demo.equora.id",
    })
    .returning({ id: schools.id });
  const schoolId = school.id;
  console.log(`✓ Sekolah: ${SCHOOL.name} (kode ${SCHOOL.code})`);

  // 2) Tahun ajaran aktif
  await db
    .insert(academicYears)
    .values({ schoolId, name: ACADEMIC_YEAR, isActive: true });
  console.log(`✓ Tahun ajaran: ${ACADEMIC_YEAR}`);

  // 3) Admin sekolah
  const adminEmail = "admin@demo.equora.id";
  await db.insert(users).values({
    schoolId,
    role: "school_admin",
    name: "Admin Demo",
    email: adminEmail,
    passwordHash,
    status: "active",
  });
  console.log(`✓ Admin sekolah: ${adminEmail}`);

  // 4) Guru
  const teacherIds: string[] = [];
  for (const t of TEACHERS) {
    const [row] = await db
      .insert(users)
      .values({
        schoolId,
        role: "teacher",
        name: t.name,
        email: t.email,
        passwordHash,
        status: "active",
      })
      .returning({ id: users.id });
    teacherIds.push(row.id);
  }
  console.log(`✓ ${TEACHERS.length} guru`);

  // 5) Mapel (guru pertama jadi wali kelas referensi tidak wajib)
  const subjectIds: string[] = [];
  for (const s of SUBJECTS) {
    const [row] = await db
      .insert(subjects)
      .values({ schoolId, name: s.name, code: s.code, source: "catalog" })
      .returning({ id: subjects.id });
    subjectIds.push(row.id);
  }
  console.log(`✓ ${SUBJECTS.length} mapel`);

  // 6) Kelas (wali kelas = guru ke-i)
  const classIds: string[] = [];
  for (let i = 0; i < CLASSES.length; i++) {
    const c = CLASSES[i];
    const [row] = await db
      .insert(classes)
      .values({
        schoolId,
        name: c.name,
        level: c.level,
        capacity: 30,
        homeroomTeacherId: teacherIds[i],
      })
      .returning({ id: classes.id });
    classIds.push(row.id);
  }
  console.log(`✓ ${CLASSES.length} kelas`);

  // 7) Pengampu: tiap kelas diajar 5 guru utk 5 mapel.
  for (const classId of classIds) {
    for (let i = 0; i < subjectIds.length; i++) {
      await db.insert(classSubjects).values({
        schoolId,
        classId,
        subjectId: subjectIds[i],
        teacherId: teacherIds[i],
      });
    }
  }
  console.log(`✓ Pengampu kelas terpasang`);

  // 8) Siswa (NIS 2026001..2026010), 5 per kelas, langsung di-enroll.
  const students: { name: string; nis: string }[] = [];
  for (let i = 0; i < STUDENT_NAMES.length; i++) {
    const nis = `2026${String(i + 1).padStart(3, "0")}`;
    const [row] = await db
      .insert(users)
      .values({
        schoolId,
        role: "student",
        name: STUDENT_NAMES[i],
        username: nis,
        passwordHash,
        status: "active",
      })
      .returning({ id: users.id });
    const classId = classIds[Math.floor(i / 5)]; // 0-4 -> kelas A, 5-9 -> kelas B
    await db.insert(enrollments).values({ schoolId, classId, studentId: row.id });
    students.push({ name: STUDENT_NAMES[i], nis });
  }
  console.log(`✓ ${STUDENT_NAMES.length} siswa (ter-enroll ke kelas)`);

  // ── Tulis berkas kredensial ─────────────────────────────────────────────
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const md = renderCredentials(students);
  writeFileSync(join(root, "DEMO_ACCOUNTS.md"), md, "utf8");
  console.log("\n✓ Kredensial ditulis ke DEMO_ACCOUNTS.md");
}

function renderCredentials(students: { name: string; nis: string }[]): string {
  const teacherRows = TEACHERS.map(
    (t, i) => `| Guru ${i + 1} | ${t.name} | \`${t.email}\` | \`${PASSWORD}\` |`,
  ).join("\n");
  const studentRows = students
    .map(
      (s, i) =>
        `| Siswa ${i + 1} | ${s.name} | \`${s.nis}\` | \`${PASSWORD}\` | ${i < 5 ? "VII-A" : "VII-B"} |`,
    )
    .join("\n");

  return `# Akun Demo — ${SCHOOL.name}

> Dibuat otomatis oleh \`npm run seed:demo\`. **Jangan dipakai di produksi.**
> Semua akun memakai kata sandi yang sama: \`${PASSWORD}\`

- **Sekolah:** ${SCHOOL.name} (jenjang ${SCHOOL.level})
- **Kode sekolah:** \`${SCHOOL.code}\`
- **Tahun ajaran aktif:** ${ACADEMIC_YEAR}

## 1. Admin Sekolah (login via \`/masuk\` — pakai email)

| Peran | Nama | Email | Kata sandi |
| --- | --- | --- | --- |
| Admin Sekolah | Admin Demo | \`admin@demo.equora.id\` | \`${PASSWORD}\` |

→ Setelah login diarahkan ke **/admin**.

## 2. Guru (login via \`/masuk\` — pakai email)

| # | Nama | Email | Kata sandi |
| --- | --- | --- | --- |
${teacherRows}

→ Setelah login diarahkan ke **/guru**.

## 3. Siswa (login via \`/masuk-siswa\` — pakai **kode sekolah** + NIS/username)

> Saat masuk, siswa wajib mengisi **kode sekolah** (\`DEMO01\`) lebih dulu, lalu NIS dan kata sandi.

| # | Nama | NIS (username) | Kata sandi | Kelas |
| --- | --- | --- | --- | --- |
${studentRows}

→ Setelah login diarahkan ke **/siswa**.

---

_Untuk membuat ulang semua akun ini dari nol, jalankan \`npm run demo:reset\`._
`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
