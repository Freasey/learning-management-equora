/**
 * Seed pricing plans default (Starting/Basic/Pro/Custom).
 * Jalankan: npm run db:seed
 * Idempotent — re-run akan meng-update berdasarkan `key`.
 */
import { db } from "./index";
import { pricingPlans, curriculumSubjects } from "./schema";

// Katalog mapel global per jenjang (starter; nanti diperkaya dari ingest PDF Kemendikdasmen).
const catalog: Record<string, string[]> = {
  SD: [
    "Pendidikan Agama dan Budi Pekerti",
    "Pendidikan Pancasila",
    "Bahasa Indonesia",
    "Matematika",
    "Ilmu Pengetahuan Alam dan Sosial (IPAS)",
    "Bahasa Inggris",
    "Seni Budaya",
    "Pendidikan Jasmani, Olahraga, dan Kesehatan",
  ],
  SMP: [
    "Pendidikan Agama dan Budi Pekerti",
    "Pendidikan Pancasila",
    "Bahasa Indonesia",
    "Matematika",
    "Ilmu Pengetahuan Alam (IPA)",
    "Ilmu Pengetahuan Sosial (IPS)",
    "Bahasa Inggris",
    "Informatika",
    "Seni Budaya",
    "Prakarya",
    "Pendidikan Jasmani, Olahraga, dan Kesehatan",
  ],
  SMA: [
    "Pendidikan Agama dan Budi Pekerti",
    "Pendidikan Pancasila",
    "Bahasa Indonesia",
    "Matematika",
    "Bahasa Inggris",
    "Fisika",
    "Kimia",
    "Biologi",
    "Ekonomi",
    "Sosiologi",
    "Geografi",
    "Sejarah",
    "Informatika",
    "Seni Budaya",
    "Pendidikan Jasmani, Olahraga, dan Kesehatan",
  ],
  SMK: [
    "Pendidikan Agama dan Budi Pekerti",
    "Pendidikan Pancasila",
    "Bahasa Indonesia",
    "Matematika",
    "Bahasa Inggris",
    "Informatika",
    "Sejarah",
    "Seni Budaya",
    "Projek Kreatif dan Kewirausahaan",
    "Pendidikan Jasmani, Olahraga, dan Kesehatan",
  ],
};

const plans = [
  {
    key: "starting",
    name: "Starting",
    description: "Untuk sekolah kecil yang baru mulai.",
    priceMonthly: 0,
    priceYearly: 0,
    quotaStudents: 50,
    quotaTeachers: 10,
    quotaAdmins: 1,
    storageGb: 1,
    aiCredits: 50,
    isCustom: false,
    sortOrder: 1,
  },
  {
    key: "basic",
    name: "Basic",
    description: "Untuk sekolah menengah yang sedang bertumbuh.",
    priceMonthly: 499_000,
    priceYearly: 4_990_000,
    quotaStudents: 300,
    quotaTeachers: 50,
    quotaAdmins: 3,
    storageGb: 20,
    aiCredits: 500,
    isCustom: false,
    sortOrder: 2,
  },
  {
    key: "pro",
    name: "Pro",
    description: "Untuk sekolah besar dengan kebutuhan lengkap.",
    priceMonthly: 1_499_000,
    priceYearly: 14_990_000,
    quotaStudents: 1500,
    quotaTeachers: 200,
    quotaAdmins: 10,
    storageGb: 100,
    aiCredits: 2500,
    isCustom: false,
    sortOrder: 3,
  },
  {
    key: "custom",
    name: "Custom",
    description: "Untuk yayasan / multi-cabang. Hubungi kami.",
    priceMonthly: 0,
    priceYearly: 0,
    quotaStudents: null,
    quotaTeachers: null,
    quotaAdmins: null,
    storageGb: null,
    aiCredits: null,
    isCustom: true,
    sortOrder: 4,
  },
] as const;

async function main() {
  console.log("Seeding pricing plans...");
  for (const plan of plans) {
    await db
      .insert(pricingPlans)
      .values(plan)
      .onConflictDoUpdate({
        target: pricingPlans.key,
        set: { ...plan, updatedAt: new Date() },
      });
    console.log(`  ✓ ${plan.name}`);
  }
  console.log("Seeding curriculum subjects (katalog global)...");
  for (const [level, names] of Object.entries(catalog)) {
    for (const name of names) {
      await db
        .insert(curriculumSubjects)
        .values({ level, name })
        .onConflictDoNothing({
          target: [curriculumSubjects.level, curriculumSubjects.name],
        });
    }
    console.log(`  ✓ ${level} (${names.length})`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
