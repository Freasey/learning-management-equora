/**
 * Buat / perbarui super admin pertama. Tidak ada form publik untuk ini —
 * sengaja hanya lewat script (pola industri: staff dibuat internal).
 *
 * Jalankan: npm run seed:superadmin
 * Kredensial diambil dari .env.local (SUPERADMIN_EMAIL / _PASSWORD / _NAME).
 */
import bcrypt from "bcryptjs";
import { db, users } from "../src/db/index";

const email = process.env.SUPERADMIN_EMAIL ?? "admin@equora.id";
const password = process.env.SUPERADMIN_PASSWORD ?? "superadmin123";
const name = process.env.SUPERADMIN_NAME ?? "Super Admin";

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);

  await db
    .insert(users)
    .values({
      email,
      name,
      passwordHash,
      role: "super_admin",
      schoolId: null,
      status: "active",
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { passwordHash, name, role: "super_admin", status: "active", updatedAt: new Date() },
    });

  console.log(`✓ Super admin siap: ${email}`);
  console.log("  (Ganti password default sesegera mungkin.)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
