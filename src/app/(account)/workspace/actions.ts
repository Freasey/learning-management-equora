"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schools, users, memberships, academicYears, pricingPlans } from "@/db";
import { auth, signOut, unstable_update } from "@/auth";
import { roleHome } from "@/lib/roles";
import { slugify, randomCode } from "@/lib/ids";
import { ensureMembership } from "@/lib/membership";
import {
  isFreePlan,
  assertCanCreateFreeWorkspace,
  buildActiveUpdate,
} from "@/lib/workspace";

export async function doSignOut() {
  await signOut({ redirectTo: "/masuk" });
}

const createSchema = z.object({
  name: z.string().min(2, "Nama workspace minimal 2 karakter"),
  type: z.enum(["school", "personal"]),
  level: z.enum(["SD", "SMP", "SMA", "SMK"]),
  planKey: z.string().min(1, "Pilih paket"),
});

/**
 * Buat workspace BARU yang dimiliki user saat ini. Menegakkan batas
 * "1 workspace gratis per user": paket gratis ditolak bila sudah punya satu.
 */
export async function createWorkspace(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/masuk");

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    level: formData.get("level"),
    planKey: formData.get("planKey"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }
  const { name, type, level, planKey } = parsed.data;

  const [plan] = await db
    .select()
    .from(pricingPlans)
    .where(eq(pricingPlans.key, planKey))
    .limit(1);
  if (!plan || !plan.isActive) throw new Error("Paket tidak tersedia.");
  if (plan.isCustom) redirect("/kontak");

  const free = isFreePlan(plan);
  if (free) await assertCanCreateFreeWorkspace(userId);

  // Materialkan keanggotaan workspace HOME (akun lama hasil seed mungkin belum
  // punya baris) supaya tak hilang saat user kini punya >1 workspace.
  const [me] = await db
    .select({ schoolId: users.schoolId, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (me?.schoolId) {
    await ensureMembership(userId, me.schoolId, [me.role]);
  }

  const baseSlug = slugify(name) || (type === "personal" ? "kelas" : "sekolah");
  const [ws] = await db
    .insert(schools)
    .values({
      name,
      type,
      level,
      planKey,
      slug: `${baseSlug}-${randomCode(4).toLowerCase()}`,
      code: randomCode(),
      status: free ? "active" : "trial",
      contactEmail: session?.user?.email ?? null,
    })
    .returning({ id: schools.id });

  // Pemilik: workspace personal → kelola + mengajar; sekolah → admin saja.
  await db.insert(memberships).values({
    userId,
    schoolId: ws.id,
    roles: type === "personal" ? "school_admin,teacher" : "school_admin",
    isOwner: true,
    status: "active",
  });

  const y = new Date().getFullYear();
  await db.insert(academicYears).values({
    schoolId: ws.id,
    name: `${y}/${y + 1} Ganjil`,
    isActive: true,
  });

  // Jadikan workspace baru sebagai aktif.
  const upd = await buildActiveUpdate(userId, ws.id);
  if (upd) await unstable_update(upd as never);

  // Gratis → langsung ke beranda peran. Berbayar → checkout (bypass gateway).
  if (free) {
    redirect(roleHome(upd?.activeRoles ?? ["school_admin"]));
  }
  redirect(`/admin/langganan/checkout?plan=${planKey}`);
}

/** Keluar dari sebuah workspace (hanya yang BUKAN milik sendiri / bukan home). */
export async function leaveWorkspace(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/masuk");

  const schoolId = z.string().uuid().parse(formData.get("schoolId"));

  const [me] = await db
    .select({ schoolId: users.schoolId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (schoolId === me?.schoolId) {
    throw new Error("Tidak bisa keluar dari workspace utama Anda.");
  }

  const [m] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.schoolId, schoolId)))
    .limit(1);
  if (!m) throw new Error("Keanggotaan tidak ditemukan.");
  if (m.isOwner) {
    throw new Error("Pemilik tidak bisa keluar. Hapus atau alihkan workspace dulu.");
  }

  await db.delete(memberships).where(eq(memberships.id, m.id));
  revalidatePath("/workspace");
}
