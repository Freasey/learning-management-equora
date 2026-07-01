/**
 * Sekolah demo publik ("SMP Demo Equora", kode DEMO01).
 *
 * Satu sekolah yang SELALU tersedia untuk dicoba calon pelanggan. Isinya
 * di-reset berkala (Vercel Cron tiap 6 jam, lihat vercel.json) dan bisa
 * di-reset manual dari konsol Super Admin.
 *
 * Sumber kebenaran tunggal untuk:
 *  - konstanta isi sekolah demo (dipakai skrip seed & endpoint cron),
 *  - kredensial login instan (halaman /coba),
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
export const DEMO_PARENT_EMAIL = "ortu@demo.equora.id";

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
 * Kredensial login instan per peran (halaman /coba). schoolCode hanya diisi
 * untuk siswa — jalur guru/admin/ortu login pakai email.
 */
export const DEMO_LOGINS = {
  admin: { identifier: DEMO_ADMIN_EMAIL, schoolCode: "" },
  teacher: { identifier: DEMO_TEACHERS[0].email, schoolCode: "" },
  student: { identifier: DEMO_STUDENT_NIS, schoolCode: DEMO_SCHOOL.code },
  parent: { identifier: DEMO_PARENT_EMAIL, schoolCode: "" },
} as const;

export type DemoRole = keyof typeof DEMO_LOGINS;

// ── Jadwal reset otomatis ─────────────────────────────────────────────────
/**
 * Cron berjalan tiap 6 jam pada jam UTC 0/6/12/18 (lihat vercel.json).
 * Kembalikan waktu reset otomatis BERIKUTNYA relatif terhadap `now`.
 */
export function nextDemoResetAt(now: Date = new Date()): Date {
  const next = new Date(now);
  next.setUTCMinutes(0, 0, 0);
  const nextHour = (Math.floor(now.getUTCHours() / 6) + 1) * 6; // 6|12|18|24
  next.setUTCHours(nextHour); // 24 otomatis menggulung ke hari berikutnya 00:00
  return next;
}

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
    parentLinks,
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

    // 4) Guru
    const teacherIds: string[] = [];
    for (const t of DEMO_TEACHERS) {
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

    // 5) Mapel
    const subjectIds: string[] = [];
    for (const s of DEMO_SUBJECTS) {
      const [row] = await db
        .insert(subjects)
        .values({ schoolId, name: s.name, code: s.code, source: "catalog" })
        .returning({ id: subjects.id });
      subjectIds.push(row.id);
    }

    // 6) Kelas (wali kelas = guru ke-i)
    const classIds: string[] = [];
    for (let i = 0; i < DEMO_CLASSES.length; i++) {
      const c = DEMO_CLASSES[i];
      const [row] = await db
        .insert(classes)
        .values({
          schoolId,
          academicYearId,
          name: c.name,
          level: c.level,
          capacity: 30,
          homeroomTeacherId: teacherIds[i],
        })
        .returning({ id: classes.id });
      classIds.push(row.id);
    }

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

    // 8) Siswa (NIS 2026001..), 5 per kelas, langsung di-enroll.
    let firstStudentId = "";
    for (let i = 0; i < DEMO_STUDENT_NAMES.length; i++) {
      const nis = `2026${String(i + 1).padStart(3, "0")}`;
      const [row] = await db
        .insert(users)
        .values({
          schoolId,
          role: "student",
          name: DEMO_STUDENT_NAMES[i],
          username: nis,
          passwordHash,
          status: "active",
        })
        .returning({ id: users.id });
      if (i === 0) firstStudentId = row.id;
      const classId = classIds[Math.floor(i / 5)];
      await db
        .insert(enrollments)
        .values({ schoolId, academicYearId, classId, studentId: row.id });
    }

    // 9) Orang tua contoh — tertaut ke siswa pertama (B8).
    const [parent] = await db
      .insert(users)
      .values({
        schoolId,
        role: "parent",
        name: "Orang Tua Demo",
        email: DEMO_PARENT_EMAIL,
        passwordHash,
        status: "active",
      })
      .returning({ id: users.id });
    await db
      .insert(parentLinks)
      .values({ schoolId, parentId: parent.id, studentId: firstStudentId });

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
