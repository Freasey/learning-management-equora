/**
 * Seed SKENARIO GURU LINTAS-WORKSPACE.
 *
 * Membuat SATU akun guru ("Bu Sari") yang menjadi anggota DUA workspace:
 *   1. Sekolah  — "SMA Cendekia Equora" (kode SEKOLAH), ia mengajar Matematika.
 *   2. Personal — "Bimbel Sari" (kode BIMBEL), ia PEMILIK (kelola + mengajar).
 *
 * Tiap workspace diisi data lengkap (kelas, siswa, jadwal, materi, kuis, nilai,
 * pengerjaan siswa) supaya tampak "sudah dipakai" — memudahkan testing.
 *
 * Aman di-run berulang: kedua sekolah (by kode) dihapus dulu (CASCADE).
 * Butuh pricing plans sudah di-seed (npm run db:seed).
 *
 * Jalankan: npm run seed:teacher
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import bcrypt from "bcryptjs";
import { inArray } from "drizzle-orm";
import {
  db,
  schools,
  users,
  memberships,
  academicYears,
  subjects,
  classes,
  enrollments,
  classSubjects,
  schedules,
  materials,
  assessments,
  questions,
  gradeItems,
  grades,
  attempts,
  answers,
} from "../src/db/index";

const PASSWORD = "guru12345";
const TEACHER = { name: "Sari Wijaya", email: "guru.dual@equora.id" };
const SCHOOL = { name: "SMA Cendekia Equora", code: "SEKOLAH", slug: "sma-cendekia-equora" };
const BIMBEL = { name: "Bimbel Sari", code: "BIMBEL", slug: "bimbel-sari" };
const YEAR = "2025/2026 Ganjil";

async function newUser(v: typeof users.$inferInsert) {
  const [row] = await db.insert(users).values(v).returning({ id: users.id });
  return row.id;
}

/**
 * Bangun satu kuis PG + jadikan item nilai + isi pengerjaan beberapa siswa.
 * Mengembalikan id assessment.
 */
async function seedQuizWithGrades(opts: {
  schoolId: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  title: string;
  students: { id: string; correct: number }[]; // jumlah jawaban benar (dari 5)
}) {
  const { schoolId, teacherId, classId, subjectId, title, students } = opts;
  const POINTS = 20;
  const N = 5;
  const MAX = POINTS * N;

  const [a] = await db
    .insert(assessments)
    .values({
      schoolId,
      teacherId,
      subjectId,
      classId,
      title,
      type: "quiz",
      description: "Kuis pilihan ganda.",
      durationMin: 30,
      countToGrade: true,
      status: "published",
    })
    .returning({ id: assessments.id });

  const qIds: string[] = [];
  for (let i = 0; i < N; i++) {
    const [q] = await db
      .insert(questions)
      .values({
        schoolId,
        assessmentId: a.id,
        type: "mc",
        text: `Soal ${i + 1}: pilih jawaban yang benar.`,
        options: ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
        correctIndex: 0,
        points: POINTS,
        sortOrder: i,
      })
      .returning({ id: questions.id });
    qIds.push(q.id);
  }

  // Item nilai tertaut (otomatis, dari kuis).
  const [gi] = await db
    .insert(gradeItems)
    .values({
      schoolId,
      teacherId,
      classId,
      subjectId,
      title,
      maxScore: MAX,
      source: "assessment",
      assessmentId: a.id,
    })
    .returning({ id: gradeItems.id });

  // Pengerjaan tiap siswa + nilai.
  for (const s of students) {
    const correct = Math.max(0, Math.min(N, s.correct));
    const score = correct * POINTS;
    const [att] = await db
      .insert(attempts)
      .values({
        schoolId,
        assessmentId: a.id,
        studentId: s.id,
        status: "graded",
        autoScore: score,
        totalScore: score,
        maxScore: MAX,
      })
      .returning({ id: attempts.id });

    for (let i = 0; i < N; i++) {
      const isCorrect = i < correct; // anggap `correct` soal pertama benar
      await db.insert(answers).values({
        schoolId,
        attemptId: att.id,
        questionId: qIds[i],
        choiceIndex: isCorrect ? 0 : 1,
        isCorrect,
        awardedPoints: isCorrect ? POINTS : 0,
      });
    }

    await db
      .insert(grades)
      .values({ schoolId, gradeItemId: gi.id, studentId: s.id, score });
  }

  return a.id;
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // ── Bersihkan skenario lama ────────────────────────────────────────────
  const old = await db
    .select({ id: schools.id })
    .from(schools)
    .where(inArray(schools.code, [SCHOOL.code, BIMBEL.code]));
  if (old.length) {
    await db.delete(schools).where(inArray(schools.code, [SCHOOL.code, BIMBEL.code]));
    console.log("Skenario lama dibersihkan.");
  }

  // ══════════════════════ 1) WORKSPACE SEKOLAH ══════════════════════════
  const [school] = await db
    .insert(schools)
    .values({
      name: SCHOOL.name,
      code: SCHOOL.code,
      slug: SCHOOL.slug,
      type: "school",
      level: "SMA",
      planKey: "pro",
      status: "active",
      contactEmail: "admin@cendekia.equora.id",
    })
    .returning({ id: schools.id });
  const schoolId = school.id;
  await db.insert(academicYears).values({ schoolId, name: YEAR, isActive: true });

  // Admin sekolah (untuk menguji area /admin sekolah ini).
  await newUser({
    schoolId,
    role: "school_admin",
    name: "Admin Cendekia",
    email: "admin.sekolah@equora.id",
    passwordHash,
    status: "active",
  });

  // GURU (akun utama). Home = sekolah ini.
  const teacherId = await newUser({
    schoolId,
    role: "teacher",
    name: TEACHER.name,
    email: TEACHER.email,
    passwordHash,
    status: "active",
  });
  await db.insert(memberships).values({
    userId: teacherId,
    schoolId,
    roles: "teacher",
    isOwner: false,
    status: "active",
  });

  // Mapel + kelas + siswa sekolah.
  const [mtkSchool] = await db
    .insert(subjects)
    .values({ schoolId, name: "Matematika", code: "MAT", kkm: 75, source: "catalog" })
    .returning({ id: subjects.id });
  const [classSchool] = await db
    .insert(classes)
    .values({ schoolId, name: "XI IPA 1", level: "XI", capacity: 32, homeroomTeacherId: teacherId })
    .returning({ id: classes.id });

  const schoolStudentNames = [
    "Adinda Maharani",
    "Bagas Pratama",
    "Cinta Lestari",
    "Dimas Nugroho",
    "Elang Saputra",
    "Fitri Handayani",
  ];
  const schoolStudents: { id: string; name: string; nis: string }[] = [];
  for (let i = 0; i < schoolStudentNames.length; i++) {
    const nis = `2025${String(i + 1).padStart(3, "0")}`;
    const id = await newUser({
      schoolId,
      role: "student",
      name: schoolStudentNames[i],
      username: nis,
      passwordHash,
      status: "active",
    });
    await db.insert(enrollments).values({ schoolId, classId: classSchool.id, studentId: id });
    schoolStudents.push({ id, name: schoolStudentNames[i], nis });
  }

  // Pengampu + jadwal (2 slot) — dasar "apa yang diajar guru".
  await db.insert(classSubjects).values({
    schoolId,
    classId: classSchool.id,
    subjectId: mtkSchool.id,
    teacherId,
  });
  await db.insert(schedules).values([
    { schoolId, classId: classSchool.id, subjectId: mtkSchool.id, teacherId, dayOfWeek: 1, startTime: "07:30", endTime: "09:00", room: "R-11" },
    { schoolId, classId: classSchool.id, subjectId: mtkSchool.id, teacherId, dayOfWeek: 4, startTime: "09:15", endTime: "10:45", room: "R-11" },
  ]);

  // Materi.
  await db.insert(materials).values([
    { schoolId, teacherId, subjectId: mtkSchool.id, classId: classSchool.id, title: "Pengantar Limit Fungsi", topic: "Limit", type: "manual", notes: "Ringkasan konsep limit & contoh." },
    { schoolId, teacherId, subjectId: mtkSchool.id, classId: classSchool.id, title: "Turunan Fungsi Aljabar", topic: "Turunan", type: "manual", notes: "Aturan turunan dasar." },
  ]);

  // Item nilai manual + kuis ber-nilai.
  const [tugasGi] = await db
    .insert(gradeItems)
    .values({ schoolId, teacherId, classId: classSchool.id, subjectId: mtkSchool.id, title: "Tugas Kelompok 1", maxScore: 100, source: "manual" })
    .returning({ id: gradeItems.id });
  const tugasScores = [88, 76, 92, 64, 70, 81];
  for (let i = 0; i < schoolStudents.length; i++) {
    await db.insert(grades).values({
      schoolId,
      gradeItemId: tugasGi.id,
      studentId: schoolStudents[i].id,
      score: tugasScores[i],
    });
  }
  await seedQuizWithGrades({
    schoolId,
    teacherId,
    classId: classSchool.id,
    subjectId: mtkSchool.id,
    title: "Ulangan Harian: Limit Fungsi",
    students: [
      { id: schoolStudents[0].id, correct: 5 },
      { id: schoolStudents[1].id, correct: 4 },
      { id: schoolStudents[2].id, correct: 5 },
      { id: schoolStudents[3].id, correct: 2 }, // di bawah KKM → "perlu perhatian"
      { id: schoolStudents[4].id, correct: 3 },
      { id: schoolStudents[5].id, correct: 4 },
    ],
  });

  console.log(`✓ Workspace sekolah: ${SCHOOL.name} (kode ${SCHOOL.code})`);

  // ══════════════════════ 2) WORKSPACE PERSONAL ═════════════════════════
  const [bimbel] = await db
    .insert(schools)
    .values({
      name: BIMBEL.name,
      code: BIMBEL.code,
      slug: BIMBEL.slug,
      type: "personal",
      level: "SMA",
      planKey: "starting",
      status: "active",
      contactEmail: TEACHER.email,
    })
    .returning({ id: schools.id });
  const bimbelId = bimbel.id;
  await db.insert(academicYears).values({ schoolId: bimbelId, name: YEAR, isActive: true });

  // Guru = PEMILIK workspace ini (kelola + mengajar). Akun sama dgn di sekolah.
  await db.insert(memberships).values({
    userId: teacherId,
    schoolId: bimbelId,
    roles: "school_admin,teacher",
    isOwner: true,
    status: "active",
  });

  const [mtkBimbel] = await db
    .insert(subjects)
    .values({ schoolId: bimbelId, name: "Matematika UTBK", code: "MTK", kkm: 70, source: "custom" })
    .returning({ id: subjects.id });
  const [classBimbel] = await db
    .insert(classes)
    .values({ schoolId: bimbelId, name: "Kelas Intensif UTBK", level: "SMA", capacity: 12, homeroomTeacherId: teacherId })
    .returning({ id: classes.id });

  const bimbelStudentNames = ["Gilang Ramadhan", "Hasna Aulia", "Irfan Maulana", "Jihan Salsabila"];
  const bimbelStudents: { id: string; name: string; nis: string }[] = [];
  for (let i = 0; i < bimbelStudentNames.length; i++) {
    const nis = `B${String(i + 1).padStart(3, "0")}`;
    const id = await newUser({
      schoolId: bimbelId,
      role: "student",
      name: bimbelStudentNames[i],
      username: nis,
      passwordHash,
      status: "active",
    });
    await db.insert(enrollments).values({ schoolId: bimbelId, classId: classBimbel.id, studentId: id });
    bimbelStudents.push({ id, name: bimbelStudentNames[i], nis });
  }

  await db.insert(classSubjects).values({
    schoolId: bimbelId,
    classId: classBimbel.id,
    subjectId: mtkBimbel.id,
    teacherId,
  });
  await db.insert(schedules).values([
    { schoolId: bimbelId, classId: classBimbel.id, subjectId: mtkBimbel.id, teacherId, dayOfWeek: 6, startTime: "13:00", endTime: "15:00", room: "Daring" },
  ]);
  await db.insert(materials).values({
    schoolId: bimbelId,
    teacherId,
    subjectId: mtkBimbel.id,
    classId: classBimbel.id,
    title: "Strategi Mengerjakan UTBK Matematika",
    topic: "Strategi",
    type: "manual",
    notes: "Tips manajemen waktu & pola soal.",
  });
  await seedQuizWithGrades({
    schoolId: bimbelId,
    teacherId,
    classId: classBimbel.id,
    subjectId: mtkBimbel.id,
    title: "Try Out UTBK #1",
    students: [
      { id: bimbelStudents[0].id, correct: 4 },
      { id: bimbelStudents[1].id, correct: 5 },
      { id: bimbelStudents[2].id, correct: 3 },
      { id: bimbelStudents[3].id, correct: 2 },
    ],
  });

  console.log(`✓ Workspace personal: ${BIMBEL.name} (kode ${BIMBEL.code})`);

  // ── Tulis berkas kredensial ────────────────────────────────────────────
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  writeFileSync(
    join(root, "TEACHER_DUAL_ACCOUNT.md"),
    render(schoolStudents, bimbelStudents),
    "utf8",
  );
  console.log("\n✓ Kredensial ditulis ke TEACHER_DUAL_ACCOUNT.md");
}

function render(
  schoolStudents: { name: string; nis: string }[],
  bimbelStudents: { name: string; nis: string }[],
): string {
  const rows = (arr: { name: string; nis: string }[], code: string) =>
    arr.map((s) => `| ${s.name} | \`${s.nis}\` | \`${code}\` | \`${PASSWORD}\` |`).join("\n");
  return `# Skenario Guru Lintas-Workspace

> Dibuat \`npm run seed:teacher\`. Semua kata sandi: \`${PASSWORD}\`

## Akun guru (login via /masuk — email)

| Nama | Email | Kata sandi |
| --- | --- | --- |
| ${TEACHER.name} | \`${TEACHER.email}\` | \`${PASSWORD}\` |

Setelah login → /guru (workspace **${SCHOOL.name}**). Gunakan **pemilih workspace**
di pojok kanan atas untuk berpindah ke **${BIMBEL.name}** (kelas pribadi). Di
workspace pribadi, tombol **Kelola** membuka panel admin kelasnya.

## Admin sekolah (login via /masuk — email)

| Nama | Email | Kata sandi |
| --- | --- | --- |
| Admin Cendekia | \`admin.sekolah@equora.id\` | \`${PASSWORD}\` |

## Siswa SEKOLAH — ${SCHOOL.name} (login via /masuk-siswa)

> Kode sekolah: \`${SCHOOL.code}\`

| Nama | NIS | Kode | Kata sandi |
| --- | --- | --- | --- |
${rows(schoolStudents, SCHOOL.code)}

## Siswa BIMBEL — ${BIMBEL.name} (login via /masuk-siswa)

> Kode sekolah: \`${BIMBEL.code}\`

| Nama | NIS | Kode | Kata sandi |
| --- | --- | --- | --- |
${rows(bimbelStudents, BIMBEL.code)}
`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
