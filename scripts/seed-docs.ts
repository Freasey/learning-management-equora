/**
 * Seed konten DOKUMENTASI / Pusat Bantuan ke DB (tabel doc_articles).
 * Satu artikel per page per peran (fungsi + cara pakai). Konten ini bisa
 * diedit Super Admin dari /super/dokumentasi setelah di-seed.
 *
 * Idempotent: pakai onConflictDoNothing(slug) → re-run TIDAK menimpa
 * artikel yang sudah pernah disunting admin; hanya menambah yang belum ada.
 *
 * Jalankan: npm run seed:docs
 */
import { db, docArticles } from "../src/db/index";

type Seed = {
  audience: string;
  category: string;
  slug: string;
  title: string;
  summary: string;
  route?: string;
  icon?: string;
  body: string;
};

const articles: Seed[] = [
  // ─────────────────────────────── UMUM (guest) ───────────────────────────
  {
    audience: "guest",
    category: "Mengenal Equora",
    slug: "apa-itu-equora",
    title: "Apa itu Equora?",
    summary: "Platform manajemen pembelajaran untuk sekolah maupun guru mandiri.",
    icon: "Sparkles",
    body: `Equora adalah platform manajemen sekolah & pembelajaran. Satu tempat untuk mengelola kelas, mata pelajaran, jadwal, materi, kuis/ujian, dan nilai.

## Untuk siapa?
- **Sekolah** — admin menyiapkan struktur akademik, lalu guru & siswa memakainya.
- **Guru mandiri** — tutor/bimbel yang ingin punya kelas sendiri tanpa terikat sekolah.

## Tiga area utama
- **Admin Sekolah** menyiapkan & mengelola data sekolah.
- **Guru** mengajar, membuat materi & penilaian.
- **Siswa** belajar, mengerjakan kuis, dan melihat nilai.`,
  },
  {
    audience: "guest",
    category: "Mengenal Equora",
    slug: "cara-mulai",
    title: "Cara mulai memakai Equora",
    summary: "Daftarkan sekolah, gabung dengan kode, atau buat kelas pribadi.",
    icon: "Rocket",
    body: `Ada tiga jalur masuk, sesuaikan dengan kebutuhan Anda.

1. **Daftarkan sekolah** lewat halaman *Daftar* — cocok untuk admin/yayasan. Anda memilih jenjang & paket, lalu langsung mengelola sekolah.
2. **Gabung ke sekolah** lewat halaman *Gabung* memakai **kode sekolah** dari admin. Akun aktif setelah disetujui.
3. **Buat kelas pribadi** lewat *Daftar Guru Mandiri* — untuk les/bimbel, tanpa sekolah. Gratis.

Guru yang mengajar di sekolah **sekaligus** punya kelas pribadi bisa memiliki keduanya dan berpindah lewat **pemilih workspace** di pojok kanan atas.`,
  },
  {
    audience: "guest",
    category: "Mengenal Equora",
    slug: "workspace-ganda",
    title: "Satu akun, banyak workspace",
    summary: "Mengajar di sekolah dan punya kelas freelance dari akun yang sama.",
    icon: "Building2",
    body: `Equora memisahkan **akun** dari **workspace** (ruang kerja). Satu akun bisa menjadi anggota beberapa workspace sekaligus:

- Workspace **Sekolah** — tempat Anda diundang sebagai guru.
- Workspace **Pribadi** — kelas les/bimbel milik Anda sendiri.

Data tiap workspace terpisah penuh. Pindah konteks lewat **pemilih workspace** di header; semua menu (jadwal, materi, kuis, nilai) otomatis mengikuti workspace yang aktif.`,
  },

  // ──────────────────────────── ADMIN SEKOLAH ─────────────────────────────
  {
    audience: "school_admin",
    category: "Memulai",
    slug: "admin-ikhtisar",
    title: "Ikhtisar (Beranda Admin)",
    summary: "Ringkasan sekolah: paket, status, kode sekolah, dan pemakaian kuota.",
    route: "/admin",
    icon: "LayoutDashboard",
    body: `Halaman pertama setelah login. Menampilkan identitas sekolah, **paket & status langganan**, **kode sekolah** (untuk pendaftaran guru/siswa), dan **pemakaian kuota** (jumlah siswa/guru/admin dibanding batas paket).

## Cara pakai
- Bagikan **kode sekolah** ke guru & siswa agar mereka bisa mendaftar lewat *Gabung*.
- Pantau kuota di sini; bila mendekati batas, pertimbangkan upgrade di **Langganan**.`,
  },
  {
    audience: "school_admin",
    category: "Memulai",
    slug: "admin-pengaturan",
    title: "Pengaturan & Tahun Ajaran",
    summary: "Profil sekolah, jenjang, dan menetapkan tahun ajaran aktif.",
    route: "/admin/pengaturan",
    icon: "Settings2",
    body: `Tempat mengatur profil sekolah dan **tahun ajaran**. Tahun ajaran aktif menjadi konteks untuk kelas & jadwal.

## Cara pakai
1. Lengkapi nama sekolah & jenjang (SD/SMP/SMA/SMK).
2. Buat tahun ajaran (mis. *2025/2026 Ganjil*) lalu **tetapkan sebagai aktif**.
3. Seluruh kelas & jadwal yang Anda buat akan mengikuti tahun ajaran aktif ini.`,
  },
  {
    audience: "school_admin",
    category: "Akademik",
    slug: "admin-kelas",
    title: "Kelas",
    summary: "Membuat rombongan belajar, wali kelas, dan kapasitas.",
    route: "/admin/kelas",
    icon: "School",
    body: `Kelola **kelas/rombel** untuk tahun ajaran aktif.

## Cara pakai
- Tambah kelas (mis. *VII-A*), tentukan **wali kelas** dan **kapasitas**.
- Jumlah siswa per kelas terisi otomatis dari penempatan (enrolment).
- Siswa ditempatkan ke kelas saat impor, saat persetujuan pendaftaran, atau dari menu Siswa.`,
  },
  {
    audience: "school_admin",
    category: "Akademik",
    slug: "admin-mapel",
    title: "Mata Pelajaran",
    summary: "Pilih dari katalog kurikulum nasional atau tambah mapel kustom.",
    route: "/admin/mapel",
    icon: "BookOpen",
    body: `Tentukan mata pelajaran yang dipakai sekolah.

## Cara pakai
- **Pilih dari katalog** kurikulum sesuai jenjang (centang yang dipakai) — hemat dan terstandar.
- **Tambah kustom** untuk muatan lokal.
- Atur **kode** (boleh dikosongkan → dibuat otomatis dari nama) dan **KKM** tiap mapel.`,
  },
  {
    audience: "school_admin",
    category: "Akademik",
    slug: "admin-jadwal",
    title: "Jadwal",
    summary: "Susun slot pelajaran mingguan & tugaskan guru pengampu.",
    route: "/admin/jadwal",
    icon: "CalendarDays",
    body: `Rangkai **jadwal pelajaran** per kelas.

## Cara pakai
- Tambah slot: pilih **kelas, hari, jam, mata pelajaran, guru, dan ruang**.
- Penugasan guru di sini menentukan **"apa yang diajar guru"** — dari jadwal inilah guru melihat kelas & mapelnya, lalu bisa membuat materi/kuis/nilai.
- Tanpa jadwal, area Guru akan tampil kosong.`,
  },
  {
    audience: "school_admin",
    category: "Manajemen",
    slug: "admin-siswa",
    title: "Siswa",
    summary: "Buat akun siswa (NIS), impor massal, dan tempatkan ke kelas.",
    route: "/admin/siswa",
    icon: "Users",
    body: `Kelola akun siswa. Siswa login dengan **NIS/username** (bukan email) + kode sekolah.

## Cara pakai
- Tambah satu per satu, atau **impor massal** lewat textarea (format \`Nama,NIS\`).
- Tempatkan siswa ke kelas.
- Setiap akun aktif memakai **kuota siswa** paket Anda.`,
  },
  {
    audience: "school_admin",
    category: "Manajemen",
    slug: "admin-guru",
    title: "Guru",
    summary: "Buat & kelola akun guru beserta statusnya.",
    route: "/admin/guru",
    icon: "GraduationCap",
    body: `Kelola akun guru. Guru login memakai **email**.

## Cara pakai
- Tambah guru (nama + email); guru memakai **kuota guru** paket Anda.
- Tugaskan guru ke kelas/mapel lewat menu **Jadwal**.
- Guru juga bisa mendaftar sendiri lewat *Gabung* memakai kode sekolah, lalu Anda setujui di **Pendaftaran**.`,
  },
  {
    audience: "school_admin",
    category: "Manajemen",
    slug: "admin-pendaftaran",
    title: "Pendaftaran",
    summary: "Setujui/tolak guru & siswa yang mendaftar via kode sekolah.",
    route: "/admin/pendaftaran",
    icon: "Inbox",
    body: `Pusat persetujuan anggota baru.

## Cara pakai
- **Pendaftar baru** (lewat kode sekolah) muncul di tabel utama. Setujui untuk mengaktifkan akun; untuk siswa sekalian pilih kelas.
- **Permintaan guru lintas-sekolah** — guru yang sudah punya akun (mis. pemilik kelas pribadi) yang ingin mengajar di sekolah Anda. Menyetujui hanya menambah akses, tidak membuat akun baru.
- Persetujuan memakai kuota paket; bila penuh, lakukan upgrade dulu.`,
  },
  {
    audience: "school_admin",
    category: "Setelan",
    slug: "admin-pengumuman",
    title: "Pengumuman",
    summary: "Kirim kabar ke seluruh warga sekolah, guru, atau siswa saja.",
    route: "/admin/pengumuman",
    icon: "Megaphone",
    body: `Sebarkan pengumuman tingkat sekolah.

## Cara pakai
- Tulis judul & isi, pilih **audiens** (semua / guru / siswa).
- Aktif/nonaktifkan kapan saja tanpa menghapus.`,
  },
  {
    audience: "school_admin",
    category: "Setelan",
    slug: "admin-langganan",
    title: "Langganan",
    summary: "Lihat paket aktif, kuota, dan lakukan upgrade.",
    route: "/admin/langganan",
    icon: "CreditCard",
    body: `Kelola paket berlangganan sekolah.

## Cara pakai
- Lihat paket aktif beserta kuota (siswa/guru/admin/storage/AI).
- Pilih paket lain → menuju halaman **checkout** untuk mengaktifkan.
- Paket *Custom* (yayasan/multi-cabang) lewat halaman Kontak.`,
  },

  // ──────────────────────────────── GURU ──────────────────────────────────
  {
    audience: "teacher",
    category: "Mengajar",
    slug: "guru-ikhtisar",
    title: "Ikhtisar (Beranda Guru)",
    summary: "Kelas & mapel yang Anda ampu serta sesi hari ini.",
    route: "/guru",
    icon: "LayoutDashboard",
    body: `Beranda guru menampilkan kelas & mata pelajaran yang Anda ampu (diturunkan dari **Jadwal**) dan sesi hari ini.

## Cara pakai
- Jika kosong, berarti admin belum menugaskan Anda di Jadwal (untuk workspace pribadi, Anda yang menyusun jadwalnya sendiri lewat **Kelola**).
- Dari sini lompat ke materi, kuis, atau nilai kelas terkait.`,
  },
  {
    audience: "teacher",
    category: "Mengajar",
    slug: "guru-jadwal",
    title: "Jadwal Mengajar",
    summary: "Lihat jadwal mingguan kelas & mapel Anda.",
    route: "/guru/jadwal",
    icon: "CalendarDays",
    body: `Tampilan jadwal mingguan: kapan & di kelas mana Anda mengajar setiap mapel.

## Cara pakai
- Gunakan sebagai acuan menyiapkan materi & sesi.
- Jadwal disusun oleh admin sekolah; di workspace pribadi Anda mengaturnya sendiri.`,
  },
  {
    audience: "teacher",
    category: "Mengajar",
    slug: "guru-materi",
    title: "Materi",
    summary: "Unggah bahan ajar atau buat materi (termasuk bantuan AI).",
    route: "/guru/materi",
    icon: "FileText",
    body: `Kelola materi/bahan ajar per kelas & mapel.

## Cara pakai
- Tambah materi (unggahan, tautan, atau catatan) dengan topik per pertemuan.
- **Generate AI** membuat draf materi dari panduan kurikulum (aktif bila kunci AI dikonfigurasi).`,
  },
  {
    audience: "teacher",
    category: "Penilaian",
    slug: "guru-kuis",
    title: "Kuis & Ujian",
    summary: "Susun soal pilihan ganda/esai, terbitkan, dan koreksi esai.",
    route: "/guru/kuis",
    icon: "ListChecks",
    body: `Buat **kuis** (latihan) atau **ujian** (resmi) yang formal.

## Cara pakai
1. Buat kuis/ujian, lalu tambah soal **pilihan ganda** (terkoreksi otomatis) atau **esai**.
2. Bila ada minimal satu soal esai, nilai **tidak** terisi penuh otomatis — Anda perlu mengoreksi manual (sistem mengingatkan).
3. **Terbitkan** agar siswa bisa mengerjakan. Setelah siswa mengumpulkan, koreksi esai dari daftar "Pengerjaan siswa".
4. Kuis yang dihitung ke nilai otomatis membuat item nilai tertaut di **Nilai**.`,
  },
  {
    audience: "teacher",
    category: "Penilaian",
    slug: "guru-nilai",
    title: "Nilai (Gradebook)",
    summary: "Rekap nilai per item; tandai siswa di bawah KKM.",
    route: "/guru/nilai",
    icon: "ClipboardList",
    body: `Buku nilai per kelas & mapel.

## Cara pakai
- Buat **item nilai** manual atau biarkan terbentuk otomatis dari kuis.
- Isi/override skor per siswa.
- Sistem menandai siswa **"Perlu perhatian"** bila nilai di bawah KKM.`,
  },
  {
    audience: "teacher",
    category: "Mengajar",
    slug: "guru-meet-chat",
    title: "Meet & Obrolan",
    summary: "Kelas daring dan obrolan kelas (sedang disiapkan).",
    route: "/guru/meet",
    icon: "Video",
    body: `**Meet** (kelas daring) dan **Obrolan** kelas sedang dalam pengembangan (butuh server realtime). Saat ini berupa pratinjau. Fitur lain sudah bisa dipakai penuh.`,
  },
  {
    audience: "teacher",
    category: "Workspace",
    slug: "guru-workspace",
    title: "Kelas pribadi & pindah workspace",
    summary: "Punya kelas freelance sendiri di samping kelas sekolah.",
    icon: "Building2",
    body: `Selain mengajar di sekolah, Anda bisa memiliki **kelas pribadi** (les/bimbel).

## Cara pakai
- Daftar lewat *Daftar Guru Mandiri* untuk membuat workspace pribadi (Anda menjadi pemiliknya: mengelola **dan** mengajar).
- Berpindah antar workspace lewat **pemilih workspace** di pojok kanan atas header.
- Di workspace pribadi, tombol **Kelola** membuka panel admin untuk membuat kelas, siswa, mapel, dan jadwal Anda sendiri.`,
  },

  // ──────────────────────────────── SISWA ─────────────────────────────────
  {
    audience: "student",
    category: "Belajar",
    slug: "siswa-beranda",
    title: "Beranda",
    summary: "Kotak-kotak besar menuju kelas, jadwal, kuis, dan materi.",
    route: "/siswa",
    icon: "Home",
    body: `Beranda berbentuk kotak besar yang mudah diketuk. Dari sini kamu bisa membuka Jadwal, Materi, Kuis, dan Nilai. Tombol logo selalu membawamu kembali ke Beranda.`,
  },
  {
    audience: "student",
    category: "Belajar",
    slug: "siswa-jadwal",
    title: "Jadwal",
    summary: "Lihat pelajaran hari ini dan minggu ini.",
    route: "/siswa/jadwal",
    icon: "CalendarDays",
    body: `Menampilkan jadwal pelajaran kelasmu. Cek di sini pelajaran apa hari ini dan jam berapa.`,
  },
  {
    audience: "student",
    category: "Belajar",
    slug: "siswa-materi",
    title: "Materi",
    summary: "Bahan belajar dari guru untuk tiap mata pelajaran.",
    route: "/siswa/materi",
    icon: "FileText",
    body: `Kumpulan materi/bahan ajar dari gurumu, dikelompokkan per mata pelajaran. Buka untuk membaca atau mengunduh.`,
  },
  {
    audience: "student",
    category: "Belajar",
    slug: "siswa-kuis",
    title: "Kuis & Ujian",
    summary: "Kerjakan soal dari guru dan lihat hasilnya.",
    route: "/siswa/kuis",
    icon: "ListChecks",
    body: `Daftar kuis & ujian dari guru.

## Cara mengerjakan
1. Buka kuis yang berstatus menunggu.
2. Jawab soal pilihan ganda / esai, lalu **kumpulkan**.
3. Nilai pilihan ganda muncul otomatis. Jika ada esai, nilai keluar setelah guru mengoreksi. Setelah selesai kamu bisa melihat **hasil & pembahasan** per soal.`,
  },
  {
    audience: "student",
    category: "Belajar",
    slug: "siswa-nilai",
    title: "Nilai",
    summary: "Rekap nilaimu per item penilaian.",
    route: "/siswa/nilai",
    icon: "ClipboardList",
    body: `Menampilkan rekap nilaimu dari kuis, ujian, dan penilaian lain yang sudah dimasukkan guru.`,
  },
  {
    audience: "student",
    category: "Belajar",
    slug: "siswa-pengaturan",
    title: "Pengaturan & Aksesibilitas",
    summary: "Aktifkan bantuan baca teks (suara) dan bahasa isyarat.",
    route: "/siswa/pengaturan",
    icon: "Settings2",
    body: `Atur kenyamanan belajarmu.

## Cara pakai
- Nyalakan **baca teks (suara)** bila ingin teks dibacakan.
- Bantuan **bahasa isyarat** saat Meet (sedang disiapkan).`,
  },
];

async function main() {
  console.log(`Seeding ${articles.length} artikel dokumentasi...`);
  let added = 0;
  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    const res = await db
      .insert(docArticles)
      .values({
        audience: a.audience,
        category: a.category,
        slug: a.slug,
        title: a.title,
        summary: a.summary,
        body: a.body,
        route: a.route ?? null,
        icon: a.icon ?? null,
        sortOrder: i,
        status: "published",
      })
      .onConflictDoNothing({ target: docArticles.slug })
      .returning({ id: docArticles.id });
    if (res.length) added++;
  }
  console.log(`✓ Dokumentasi: ${added} baru, ${articles.length - added} sudah ada.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
