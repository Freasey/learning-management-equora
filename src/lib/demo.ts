/**
 * Sekolah demo publik ("SMP Demo Equora", kode DEMO01).
 *
 * Satu sekolah yang SELALU tersedia untuk dicoba calon pelanggan. Isinya
 * di-reset berkala (Vercel Cron tiap 6 jam, lihat vercel.json) dan bisa
 * di-reset manual dari konsol Super Admin.
 *
 * Sumber kebenaran tunggal untuk:
 *  - konstanta isi sekolah demo (dipakai skrip seed & endpoint cron),
 *  - kredensial login instan (halaman /demo),
 *  - jadwal reset otomatis (hitung mundur di konsol super).
 */
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
// Impor relatif (bukan alias @/) agar bisa dipakai skrip tsx maupun app Next.
import * as schema from "../db/schema";

// ── Konstanta isi sekolah demo ────────────────────────────────────────────
export const DEMO_SCHOOL = {
  name: "SMP Demo Equora",
  code: "DEMO01",
  slug: "smp-demo-equora",
  level: "SMP",
  planKey: "pro",
} as const;

/** Semua akun demo memakai kata sandi yang sama (>= 8 char). */
export const DEMO_PASSWORD = "demo12345";
export const DEMO_ACADEMIC_YEAR = "2025/2026 Ganjil";
export const DEMO_ADMIN_EMAIL = "admin@demo.equora.id";

export const DEMO_SUBJECTS = [
  { name: "Matematika", code: "MAT" },
  { name: "Bahasa Indonesia", code: "BIN" },
  { name: "Ilmu Pengetahuan Alam (IPA)", code: "IPA" },
  { name: "Bahasa Inggris", code: "BIG" },
  { name: "Informatika", code: "INF" },
] as const;

export const DEMO_TEACHERS = [
  { name: "Andi Pratama", email: "andi.guru@demo.equora.id" },
  { name: "Siti Nurhaliza", email: "siti.guru@demo.equora.id" },
  { name: "Budi Santoso", email: "budi.guru@demo.equora.id" },
  { name: "Dewi Lestari", email: "dewi.guru@demo.equora.id" },
  { name: "Eko Wijaya", email: "eko.guru@demo.equora.id" },
] as const;

export const DEMO_STUDENT_NAMES = [
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
] as const;

export const DEMO_CLASSES = [
  { name: "VII-A", level: "VII" },
  { name: "VII-B", level: "VII" },
] as const;

/** NIS siswa demo pertama (dipakai untuk login instan sebagai siswa). */
export const DEMO_STUDENT_NIS = "2026001";

/**
 * Batas kuota KHUSUS sekolah demo — "boleh dipakai, tapi ada batasnya".
 * Fitur tetap bisa dicoba (AI, unggah, tambah akun) tapi dijepit kecil agar
 * sandbox publik tidak jadi celah biaya/penyalahgunaan. Diterapkan lewat
 * getSchoolPlan() sehingga menimpa kuota paket asli (mis. "pro") untuk DEMO01.
 * Nilai null = ikut paket (tak dibatasi demo).
 */
export const DEMO_LIMITS = {
  aiCredits: 25, // panggilan AI / bulan
  storageGb: 1, // GB
  quotaStudents: 40,
  quotaTeachers: 12,
} as const;

/**
 * Kredensial login instan per peran (halaman /demo). schoolCode hanya diisi
 * untuk siswa — jalur guru/admin login pakai email.
 */
export const DEMO_LOGINS = {
  admin: { identifier: DEMO_ADMIN_EMAIL, schoolCode: "" },
  teacher: { identifier: DEMO_TEACHERS[0].email, schoolCode: "" },
  student: { identifier: DEMO_STUDENT_NIS, schoolCode: DEMO_SCHOOL.code },
} as const;

export type DemoRole = keyof typeof DEMO_LOGINS;

// ── Jadwal reset ──────────────────────────────────────────────────────────
/** Isi sekolah demo dianggap "basi" setelah 6 jam sejak reset terakhir. */
export const DEMO_RESET_INTERVAL_MS = 6 * 60 * 60 * 1000;

// ── Reset isi sekolah demo ────────────────────────────────────────────────
export type DemoResetSummary = {
  schoolId: string;
  teachers: number;
  students: number;
  classes: number;
  subjects: number;
  resetAt: Date;
};

/**
 * Hapus-lalu-buat-ulang HANYA sekolah demo (kode DEMO01). CASCADE menghapus
 * seluruh user/kelas/mapel terkait; sekolah lain tidak tersentuh.
 *
 * Menggunakan koneksi OWNER (DATABASE_URL apa adanya) agar mem-bypass RLS —
 * operasi ini lintas-tenant (menyentuh tabel `schools`), sama seperti seed.
 */
export async function resetDemoSchool(): Promise<DemoResetSummary> {
  const ownerUrl = process.env.DATABASE_URL;
  if (!ownerUrl) throw new Error("DATABASE_URL belum diatur.");

  const pool = new Pool({ connectionString: ownerUrl });
  const db = drizzle(pool, { schema });
  const {
    schools,
    users,
    academicYears,
    subjects,
    classes,
    enrollments,
    classSubjects,
    schedules,
    materials,
    schoolAnnouncements,
    assessments,
    questions,
    gradeItems,
    grades,
    attempts,
    answers,
  } = schema;

  try {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

    // Bersihkan sekolah demo lama (CASCADE).
    await db.delete(schools).where(eq(schools.code, DEMO_SCHOOL.code));

    // 1) Sekolah
    const [school] = await db
      .insert(schools)
      .values({
        name: DEMO_SCHOOL.name,
        code: DEMO_SCHOOL.code,
        slug: DEMO_SCHOOL.slug,
        level: DEMO_SCHOOL.level,
        planKey: DEMO_SCHOOL.planKey,
        status: "active",
        contactEmail: DEMO_ADMIN_EMAIL,
      })
      .returning({ id: schools.id });
    const schoolId = school.id;

    // 2) Tahun ajaran aktif
    const [year] = await db
      .insert(academicYears)
      .values({ schoolId, name: DEMO_ACADEMIC_YEAR, isActive: true })
      .returning({ id: academicYears.id });
    const academicYearId = year.id;

    // 3) Admin sekolah
    await db.insert(users).values({
      schoolId,
      role: "school_admin",
      name: "Admin Demo",
      email: DEMO_ADMIN_EMAIL,
      passwordHash,
      status: "active",
    });

    // 4) Guru (bulk) — guru ke-i mengampu mapel ke-i.
    const teacherRows = await db
      .insert(users)
      .values(
        DEMO_TEACHERS.map((t) => ({
          schoolId,
          role: "teacher",
          name: t.name,
          email: t.email,
          passwordHash,
          status: "active",
        })),
      )
      .returning({ id: users.id });
    const teacherIds = teacherRows.map((r) => r.id);

    // 5) Mapel (bulk)
    const subjectRows = await db
      .insert(subjects)
      .values(
        DEMO_SUBJECTS.map((s) => ({
          schoolId,
          name: s.name,
          code: s.code,
          kkm: 75,
          source: "catalog",
        })),
      )
      .returning({ id: subjects.id });
    const subjectIds = subjectRows.map((r) => r.id);

    // 6) Kelas (bulk) — wali kelas = guru ke-i
    const classRows = await db
      .insert(classes)
      .values(
        DEMO_CLASSES.map((c, i) => ({
          schoolId,
          academicYearId,
          name: c.name,
          level: c.level,
          capacity: 30,
          homeroomTeacherId: teacherIds[i],
        })),
      )
      .returning({ id: classes.id });
    const classIds = classRows.map((r) => r.id);

    // 7) Pengampu (bulk): tiap kelas diajar 5 guru utk 5 mapel.
    await db.insert(classSubjects).values(
      classIds.flatMap((classId) =>
        subjectIds.map((subjectId, i) => ({
          schoolId,
          classId,
          subjectId,
          teacherId: teacherIds[i],
        })),
      ),
    );

    // 8) Siswa (bulk, NIS 2026001..), 5 per kelas, langsung di-enroll.
    const studentRows = await db
      .insert(users)
      .values(
        DEMO_STUDENT_NAMES.map((name, i) => ({
          schoolId,
          role: "student",
          name,
          username: `2026${String(i + 1).padStart(3, "0")}`,
          passwordHash,
          status: "active",
        })),
      )
      .returning({ id: users.id });
    const studentIds = studentRows.map((r) => r.id);
    await db.insert(enrollments).values(
      studentIds.map((studentId, i) => ({
        schoolId,
        academicYearId,
        classId: classIds[Math.floor(i / 5)],
        studentId,
      })),
    );
    // Siswa per kelas: VII-A = indeks 0..4, VII-B = 5..9.
    const studentsByClass = [studentIds.slice(0, 5), studentIds.slice(5, 10)];

    // ── 9) Isi konten agar demo langsung "hidup" ───────────────────────────
    // Metadata konten per mapel (selaras urutan DEMO_SUBJECTS).
    const CONTENT = [
      { topic: "Bilangan Bulat", material: "Operasi Bilangan Bulat" },
      { topic: "Teks Deskripsi", material: "Menulis Teks Deskripsi" },
      { topic: "Klasifikasi Makhluk Hidup", material: "Ciri-ciri Makhluk Hidup" },
      { topic: "Greetings & Introductions", material: "Perkenalan dalam Bahasa Inggris" },
      { topic: "Berpikir Komputasional", material: "Pengantar Algoritma" },
    ];
    const OPTS = ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"];

    // Jadwal: VII-A semua mapel (Sen–Jum), VII-B slot Matematika (mapel demo guru).
    await db.insert(schedules).values([
      ...subjectIds.map((subjectId, i) => ({
        schoolId,
        classId: classIds[0],
        subjectId,
        teacherId: teacherIds[i],
        dayOfWeek: i + 1, // 1=Senin .. 5=Jumat
        startTime: "07:30",
        endTime: "09:00",
        room: "R-7A",
      })),
      {
        schoolId,
        classId: classIds[1],
        subjectId: subjectIds[0],
        teacherId: teacherIds[0],
        dayOfWeek: 2,
        startTime: "09:15",
        endTime: "10:45",
        room: "R-7B",
      },
    ]);

    // Materi: VII-A tiap mapel (+1 ekstra MAT), VII-B materi MAT.
    await db.insert(materials).values([
      ...subjectIds.map((subjectId, i) => ({
        schoolId,
        teacherId: teacherIds[i],
        subjectId,
        classId: classIds[0],
        title: CONTENT[i].material,
        topic: CONTENT[i].topic,
        type: "manual",
        notes: `Ringkasan materi ${CONTENT[i].topic} untuk kelas VII.`,
      })),
      {
        schoolId,
        teacherId: teacherIds[0],
        subjectId: subjectIds[0],
        classId: classIds[0],
        title: "Latihan Soal Bilangan Bulat",
        topic: CONTENT[0].topic,
        type: "manual",
        notes: "Kumpulan soal latihan untuk dikerjakan di rumah.",
      },
      {
        schoolId,
        teacherId: teacherIds[0],
        subjectId: subjectIds[0],
        classId: classIds[1],
        title: CONTENT[0].material,
        topic: CONTENT[0].topic,
        type: "manual",
        notes: `Ringkasan materi ${CONTENT[0].topic} untuk kelas VII.`,
      },
    ]);

    // Pengumuman sekolah.
    await db.insert(schoolAnnouncements).values([
      {
        schoolId,
        title: "Selamat datang di Semester Ganjil 2025/2026",
        body: "Semangat belajar untuk seluruh siswa dan guru!",
        audience: "all",
      },
      {
        schoolId,
        title: "Penilaian Tengah Semester",
        body: "PTS dilaksanakan mulai pekan depan. Cek jadwal di kelas masing-masing.",
        audience: "all",
      },
    ]);

    // Helper: item nilai manual + skor tiap siswa.
    const seedManualGrade = async (
      teacherId: string,
      classId: string,
      subjectId: string,
      title: string,
      sIds: string[],
      scores: number[],
    ) => {
      const [gi] = await db
        .insert(gradeItems)
        .values({ schoolId, academicYearId, teacherId, classId, subjectId, title, maxScore: 100, source: "manual" })
        .returning({ id: gradeItems.id });
      await db.insert(grades).values(
        sIds.map((studentId, i) => ({ schoolId, academicYearId, gradeItemId: gi.id, studentId, score: scores[i] })),
      );
    };

    // Helper: kuis PG yang SUDAH dinilai + pengerjaan siswa (masuk ke nilai).
    const seedGradedQuiz = async (
      teacherId: string,
      classId: string,
      subjectId: string,
      title: string,
      topic: string,
      sIds: string[],
      correctCounts: number[],
    ) => {
      const POINTS = 20;
      const N = 5;
      const MAX = POINTS * N;
      const [a] = await db
        .insert(assessments)
        .values({ schoolId, academicYearId, teacherId, subjectId, classId, title, type: "quiz", description: `Kuis pilihan ganda: ${topic}.`, durationMin: 30, countToGrade: true, status: "published" })
        .returning({ id: assessments.id });
      const qRows = await db
        .insert(questions)
        .values(
          Array.from({ length: N }, (_, i) => ({ schoolId, assessmentId: a.id, type: "mc", text: `Soal ${i + 1} tentang ${topic}.`, options: OPTS, correctIndex: 0, points: POINTS, sortOrder: i })),
        )
        .returning({ id: questions.id });
      const [gi] = await db
        .insert(gradeItems)
        .values({ schoolId, academicYearId, teacherId, classId, subjectId, title, maxScore: MAX, source: "assessment", assessmentId: a.id })
        .returning({ id: gradeItems.id });
      const gradeRows: { schoolId: string; academicYearId: string; gradeItemId: string; studentId: string; score: number }[] = [];
      for (let s = 0; s < sIds.length; s++) {
        const correct = Math.max(0, Math.min(N, correctCounts[s]));
        const score = correct * POINTS;
        const [att] = await db
          .insert(attempts)
          .values({ schoolId, academicYearId, assessmentId: a.id, studentId: sIds[s], status: "graded", autoScore: score, totalScore: score, maxScore: MAX })
          .returning({ id: attempts.id });
        await db.insert(answers).values(
          qRows.map((q, i) => ({ schoolId, attemptId: att.id, questionId: q.id, choiceIndex: i < correct ? 0 : 1, isCorrect: i < correct, awardedPoints: i < correct ? POINTS : 0 })),
        );
        gradeRows.push({ schoolId, academicYearId, gradeItemId: gi.id, studentId: sIds[s], score });
      }
      await db.insert(grades).values(gradeRows);
    };

    // Helper: kuis PG "siap dicoba" (terbit, belum dikerjakan) → siswa bisa langsung mencoba.
    const seedOpenQuiz = async (
      teacherId: string,
      classId: string,
      subjectId: string,
      title: string,
      topic: string,
    ) => {
      const POINTS = 20;
      const N = 5;
      const [a] = await db
        .insert(assessments)
        .values({ schoolId, academicYearId, teacherId, subjectId, classId, title, type: "quiz", description: `Kuis latihan ${topic} — silakan coba!`, durationMin: 20, countToGrade: true, status: "published" })
        .returning({ id: assessments.id });
      await db.insert(questions).values(
        Array.from({ length: N }, (_, i) => ({ schoolId, assessmentId: a.id, type: "mc", text: `Latihan ${i + 1} tentang ${topic}.`, options: OPTS, correctIndex: i % 4, points: POINTS, sortOrder: i })),
      );
    };

    // VII-A (kelas siswa demo): nilai + kuis lintas mapel + kuis siap dicoba.
    const clsA = classIds[0];
    const stA = studentsByClass[0];
    await seedManualGrade(teacherIds[0], clsA, subjectIds[0], "Tugas Harian: Bilangan Bulat", stA, [88, 76, 92, 64, 70]);
    await seedManualGrade(teacherIds[1], clsA, subjectIds[1], "Tugas Harian: Teks Deskripsi", stA, [80, 85, 78, 90, 72]);
    await seedManualGrade(teacherIds[2], clsA, subjectIds[2], "Tugas Harian: Makhluk Hidup", stA, [75, 68, 82, 60, 79]);
    await seedGradedQuiz(teacherIds[0], clsA, subjectIds[0], "Ulangan Harian: Bilangan Bulat", CONTENT[0].topic, stA, [5, 4, 5, 2, 3]);
    await seedGradedQuiz(teacherIds[1], clsA, subjectIds[1], "Ulangan Harian: Teks Deskripsi", CONTENT[1].topic, stA, [4, 5, 3, 4, 2]);
    await seedOpenQuiz(teacherIds[0], clsA, subjectIds[0], "Latihan: Bilangan Bulat", CONTENT[0].topic);

    // VII-B (kelas kedua guru Matematika demo).
    const clsB = classIds[1];
    const stB = studentsByClass[1];
    await seedManualGrade(teacherIds[0], clsB, subjectIds[0], "Tugas Harian: Bilangan Bulat", stB, [82, 74, 90, 66, 71]);
    await seedGradedQuiz(teacherIds[0], clsB, subjectIds[0], "Ulangan Harian: Bilangan Bulat", CONTENT[0].topic, stB, [3, 5, 4, 2, 4]);
    await seedOpenQuiz(teacherIds[0], clsB, subjectIds[0], "Latihan: Bilangan Bulat", CONTENT[0].topic);

    return {
      schoolId,
      teachers: DEMO_TEACHERS.length,
      students: DEMO_STUDENT_NAMES.length,
      classes: DEMO_CLASSES.length,
      subjects: DEMO_SUBJECTS.length,
      resetAt: new Date(),
    };
  } finally {
    await pool.end();
  }
}

// ── Reset "malas" (lazy) — tanpa penjadwal, ramah Vercel Hobby ─────────────
// Karena reset menghapus & membuat ulang sekolah demo, `schools.createdAt`
// DEMO01 = waktu reset terakhir. Tak perlu kolom/tabel penanda tambahan.

/** Waktu reset terakhir sekolah demo (createdAt DEMO01), atau null bila belum ada. */
export async function getDemoLastReset(): Promise<Date | null> {
  const ownerUrl = process.env.DATABASE_URL;
  if (!ownerUrl) return null;
  const pool = new Pool({ connectionString: ownerUrl });
  const db = drizzle(pool, { schema });
  try {
    const [row] = await db
      .select({ createdAt: schema.schools.createdAt })
      .from(schema.schools)
      .where(eq(schema.schools.code, DEMO_SCHOOL.code))
      .limit(1);
    return row?.createdAt ?? null;
  } finally {
    await pool.end();
  }
}

/** Kunci advisory Postgres agar dua request bersamaan tak me-reset berbarengan. */
const DEMO_RESET_LOCK_KEY = 4823917;

/**
 * Pastikan isi sekolah demo masih segar: bila belum ada atau usianya sudah
 * melewati DEMO_RESET_INTERVAL_MS, reset. Dipanggil saat sekolah demo diakses
 * (halaman /demo & aksi login demo) — pengganti cron presisi yang butuh Pro.
 *
 * Mengembalikan waktu reset terakhir yang berlaku (untuk hitung mundur).
 */
export async function ensureDemoFresh(): Promise<Date> {
  const last = await getDemoLastReset();
  if (last && Date.now() - last.getTime() < DEMO_RESET_INTERVAL_MS) return last;

  // Basi / belum ada → reset, dijaga advisory lock terhadap request bersamaan.
  const ownerUrl = process.env.DATABASE_URL;
  if (!ownerUrl) throw new Error("DATABASE_URL belum diatur.");
  const pool = new Pool({ connectionString: ownerUrl });
  const client = await pool.connect();
  let locked = false;
  try {
    const res = await client.query("SELECT pg_try_advisory_lock($1) AS locked", [
      DEMO_RESET_LOCK_KEY,
    ]);
    locked = res.rows[0]?.locked === true;
    if (!locked) {
      // Request lain sedang me-reset — pakai info terbaik yang ada.
      return (await getDemoLastReset()) ?? new Date();
    }
    // Cek ulang di dalam lock (mungkin sudah di-reset request lain barusan).
    const current = await getDemoLastReset();
    if (current && Date.now() - current.getTime() < DEMO_RESET_INTERVAL_MS) {
      return current;
    }
    const summary = await resetDemoSchool();
    return summary.resetAt;
  } finally {
    if (locked) {
      await client
        .query("SELECT pg_advisory_unlock($1)", [DEMO_RESET_LOCK_KEY])
        .catch(() => {});
    }
    client.release();
    await pool.end();
  }
}
