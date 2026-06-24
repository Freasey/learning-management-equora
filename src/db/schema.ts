import {
  pgTable,
  uuid,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * Pricing plans — dikelola dari Super Admin page.
 * Harga disimpan dalam Rupiah (integer). Kuota null = unlimited / nego.
 */
export const pricingPlans = pgTable("pricing_plans", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // starting | basic | pro | custom
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  priceMonthly: integer("price_monthly").notNull().default(0), // IDR
  priceYearly: integer("price_yearly").notNull().default(0), // IDR
  quotaStudents: integer("quota_students"), // null = unlimited
  quotaTeachers: integer("quota_teachers"),
  quotaAdmins: integer("quota_admins"),
  storageGb: integer("storage_gb"),
  aiCredits: integer("ai_credits"), // kuota AI / bulan; null = nego
  isCustom: boolean("is_custom").notNull().default(false), // true = harga nego
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Schools = satu baris per sekolah (basis multi-tenancy).
 * (Dulu bernama "tenants" — diganti ke istilah domain yang lebih jelas.)
 */
export const schools = pgTable("schools", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // kode sekolah untuk pendaftaran
  slug: text("slug").notNull().unique(),
  planKey: text("plan_key")
    .notNull()
    .references(() => pricingPlans.key)
    .default("starting"),
  billingCycle: text("billing_cycle").notNull().default("monthly"), // monthly | yearly
  status: text("status").notNull().default("trial"), // trial | active | suspended
  // school = lembaga formal; personal = ruang kerja pribadi guru independen (les/freelance).
  type: text("type").notNull().default("school"), // school | personal
  level: text("level"), // jenjang: SD | SMP | SMA | SMK
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Users — semua peran dalam satu tabel, dibedakan `role`.
 * schoolId null = super_admin (lintas-sekolah). Selain itu wajib milik sekolah.
 * email: untuk super_admin/school_admin/guru. username: untuk siswa (NIS),
 * unik per sekolah.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id").references(() => schools.id, {
      onDelete: "cascade",
    }),
    role: text("role").notNull(), // super_admin | school_admin | teacher | student
    name: text("name").notNull(),
    email: text("email").unique(),
    username: text("username"),
    passwordHash: text("password_hash").notNull(),
    status: text("status").notNull().default("active"), // active | pending | suspended
    ttsEnabled: boolean("tts_enabled").notNull().default(false), // preferensi teks-ke-suara (siswa)
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // NIS/username unik per sekolah (bukan global).
    uniqueIndex("users_school_username_unq").on(t.schoolId, t.username),
  ],
);

/**
 * Keanggotaan: hubungkan SATU akun ke BANYAK workspace (sekolah/personal).
 *
 * `users.schoolId` tetap menjadi "workspace utama / home" (dipakai untuk
 * sinkron dengan alur lama & sebagai default aktif saat login). Tabel ini
 * ADITIF — hanya dibuat untuk user yang benar-benar lintas-workspace
 * (mis. guru yang mengajar di sekolah + punya kelas freelance sendiri).
 * Bila user tidak punya baris di sini, konteks aktif disintesis dari
 * users.schoolId + users.role (kompatibel mundur).
 *
 * `roles` = daftar peran dipisah koma dalam workspace itu, mis:
 *   "teacher"               → guru biasa di sebuah sekolah
 *   "school_admin,teacher"  → pemilik workspace personal (mengelola + mengajar)
 *   "student"               → siswa
 */
export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    roles: text("roles").notNull(), // daftar peran dipisah koma
    isOwner: boolean("is_owner").notNull().default(false),
    status: text("status").notNull().default("active"), // active | pending | suspended
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("memberships_user_school_unq").on(t.userId, t.schoolId)],
);

/**
 * Pengumuman global (banner) — dikelola Super Admin.
 */
export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  level: text("level").notNull().default("info"), // info | warning | critical
  isActive: boolean("is_active").notNull().default(true),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Lead dari halaman guest (request demo / kontak). Bisa ditindaklanjuti sales.
 */
export const contactRequests = pgTable("contact_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull().default("contact"), // demo | contact
  name: text("name").notNull(),
  schoolName: text("school_name"),
  email: text("email").notNull(),
  phone: text("phone"),
  planKey: text("plan_key"),
  message: text("message").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Tahun ajaran per sekolah. Konteks global untuk kelas/jadwal/dll. */
export const academicYears = pgTable("academic_years", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // cth. "2025/2026 Ganjil"
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft-delete
});

/**
 * Katalog mata pelajaran GLOBAL (bawaan platform, per jenjang).
 * Di-seed dari kurikulum nasional; jadi sumber AI generate materi.
 * Satu set baris bersama untuk semua sekolah (hemat DB).
 */
export const curriculumSubjects = pgTable(
  "curriculum_subjects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    level: text("level").notNull(), // SD | SMP | SMA | SMK
    name: text("name").notNull(),
    code: text("code"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("curriculum_subjects_level_name_unq").on(t.level, t.name)],
);

/** Mata pelajaran per sekolah (diadopsi dari katalog atau kustom). */
export const subjects = pgTable("subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  code: text("code"),
  kkm: integer("kkm").notNull().default(75),
  source: text("source").notNull().default("custom"), // catalog | custom
  catalogId: uuid("catalog_id").references(() => curriculumSubjects.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft-delete
});

/** Kelas/rombel, terikat tahun ajaran. */
export const classes = pgTable("classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  academicYearId: uuid("academic_year_id").references(() => academicYears.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(), // cth. "VII-A"
  level: text("level"), // cth. "VII"
  capacity: integer("capacity"),
  homeroomTeacherId: uuid("homeroom_teacher_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft-delete
});

/** Penempatan siswa ke kelas. */
export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    academicYearId: uuid("academic_year_id").references(() => academicYears.id, {
      onDelete: "set null",
    }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("enrollments_class_student_unq").on(t.classId, t.studentId)],
);

/** Mapel yang diajarkan di sebuah kelas oleh guru tertentu. */
export const classSubjects = pgTable("class_subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  teacherId: uuid("teacher_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Jadwal pelajaran (slot waktu per kelas). */
export const schedules = pgTable("schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  subjectId: uuid("subject_id").references(() => subjects.id, {
    onDelete: "set null",
  }),
  teacherId: uuid("teacher_id").references(() => users.id, {
    onDelete: "set null",
  }),
  dayOfWeek: integer("day_of_week").notNull(), // 1=Senin .. 7=Minggu
  startTime: text("start_time").notNull(), // "07:00"
  endTime: text("end_time").notNull(),
  room: text("room"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Pengumuman tingkat sekolah (dibuat Admin Sekolah). */
export const schoolAnnouncements = pgTable("school_announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  audience: text("audience").notNull().default("all"), // all | teachers | students
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Materi/modul ajar (upload, tautan, atau hasil generate AI). */
export const materials = pgTable("materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  teacherId: uuid("teacher_id").references(() => users.id, { onDelete: "set null" }),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  classId: uuid("class_id").references(() => classes.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  topic: text("topic"),
  type: text("type").notNull().default("manual"), // manual | link | ai
  url: text("url"),
  notes: text("notes").notNull().default(""),
  status: text("status").notNull().default("ready"), // ready | generating
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Kuis / Ujian (formal). */
export const assessments = pgTable("assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  academicYearId: uuid("academic_year_id").references(() => academicYears.id, {
    onDelete: "set null",
  }),
  teacherId: uuid("teacher_id").references(() => users.id, { onDelete: "set null" }),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  classId: uuid("class_id").references(() => classes.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  type: text("type").notNull().default("quiz"), // quiz | exam
  description: text("description").notNull().default(""),
  durationMin: integer("duration_min"),
  countToGrade: boolean("count_to_grade").notNull().default(true), // masuk ke penilaian?
  status: text("status").notNull().default("draft"), // draft | published
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Soal di sebuah kuis/ujian. */
export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  assessmentId: uuid("assessment_id")
    .notNull()
    .references(() => assessments.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("mc"), // mc | essay
  text: text("text").notNull(),
  options: jsonb("options").$type<string[]>(),
  correctIndex: integer("correct_index"),
  points: integer("points").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Item penilaian (kolom nilai) per kelas+mapel. */
export const gradeItems = pgTable("grade_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  academicYearId: uuid("academic_year_id").references(() => academicYears.id, {
    onDelete: "set null",
  }),
  teacherId: uuid("teacher_id").references(() => users.id, { onDelete: "set null" }),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  maxScore: integer("max_score").notNull().default(100),
  source: text("source").notNull().default("manual"), // manual | assessment
  assessmentId: uuid("assessment_id").references(() => assessments.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Nilai per siswa per item penilaian. */
export const grades = pgTable(
  "grades",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    academicYearId: uuid("academic_year_id").references(() => academicYears.id, {
      onDelete: "set null",
    }),
    gradeItemId: uuid("grade_item_id")
      .notNull()
      .references(() => gradeItems.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    score: integer("score"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("grades_item_student_unq").on(t.gradeItemId, t.studentId)],
);

// Group chat per Kelas+Mapel: ditunda — dibangun bareng WebSocket & server Meet
// (lihat [[meet-architecture]]). Tabel chat_messages/chat_reads ditambahkan
// saat transport realtime siap. Sekarang hanya stub UI.

/** Pengerjaan kuis/ujian oleh siswa (satu per assessment per siswa). */
export const attempts = pgTable(
  "attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    academicYearId: uuid("academic_year_id").references(() => academicYears.id, {
      onDelete: "set null",
    }),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("submitted"), // submitted | graded
    autoScore: integer("auto_score").notNull().default(0), // poin PG
    totalScore: integer("total_score"), // final (incl esai); null jika menunggu koreksi
    maxScore: integer("max_score").notNull().default(0), // total poin snapshot
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("attempts_assessment_student_unq").on(t.assessmentId, t.studentId)],
);

/** Jawaban siswa per soal. */
export const answers = pgTable("answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  attemptId: uuid("attempt_id")
    .notNull()
    .references(() => attempts.id, { onDelete: "cascade" }),
  questionId: uuid("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  choiceIndex: integer("choice_index"), // jawaban PG
  essayText: text("essay_text"), // jawaban esai
  awardedPoints: integer("awarded_points"), // null = belum dinilai (esai)
  isCorrect: boolean("is_correct"), // PG
});

/**
 * Knowledge Base / Pusat Bantuan — konten dokumentasi dikelola dari DB
 * (bukan hardcode), bisa diedit Super Admin. Satu sumber konten dipakai
 * untuk help center publik + contextual help di dalam aplikasi.
 */
export const docArticles = pgTable("doc_articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Untuk peran mana: guest | student | teacher | school_admin (super_admin baca semua).
  audience: text("audience").notNull().default("guest"),
  category: text("category").notNull().default("Umum"), // pengelompokan dalam satu audience
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary").notNull().default(""),
  body: text("body").notNull().default(""), // markdown
  // Route in-app yang artikel ini jelaskan (mis "/guru/kuis") → contextual help.
  route: text("route"),
  icon: text("icon"), // nama ikon lucide opsional
  sortOrder: integer("sort_order").notNull().default(0),
  status: text("status").notNull().default("published"), // draft | published
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Riwayat revisi artikel dokumentasi (snapshot tiap simpan). */
export const docRevisions = pgTable("doc_revisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  articleId: uuid("article_id")
    .notNull()
    .references(() => docArticles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  editedBy: uuid("edited_by").references(() => users.id, { onDelete: "set null" }),
  editedAt: timestamp("edited_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PricingPlan = typeof pricingPlans.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type DocArticle = typeof docArticles.$inferSelect;
export type DocRevision = typeof docRevisions.$inferSelect;
export type ContactRequest = typeof contactRequests.$inferSelect;
export type School = typeof schools.$inferSelect;
export type User = typeof users.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type AcademicYear = typeof academicYears.$inferSelect;
export type CurriculumSubject = typeof curriculumSubjects.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type ClassSubject = typeof classSubjects.$inferSelect;
export type Schedule = typeof schedules.$inferSelect;
export type SchoolAnnouncement = typeof schoolAnnouncements.$inferSelect;
export type Material = typeof materials.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type GradeItem = typeof gradeItems.$inferSelect;
export type Grade = typeof grades.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type Answer = typeof answers.$inferSelect;
