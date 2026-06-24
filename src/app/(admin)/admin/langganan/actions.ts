"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schools, pricingPlans } from "@/db";
import { requireSchoolAdmin } from "@/lib/auth-guard";
import { isFreePlan, ownedFreeWorkspaceCount } from "@/lib/workspace";

/**
 * Aktivasi paket. NOTE: pembayaran nyata (Midtrans/Xendit) DI-BYPASS untuk
 * saat ini — klik Bayar = paket langsung aktif. Ganti bagian ini dengan
 * pembuatan transaksi gateway + verifikasi webhook saat go-live.
 */
export async function activatePlan(formData: FormData) {
  const { session, schoolId } = await requireSchoolAdmin();
  const planKey = z.string().min(1).parse(formData.get("planKey"));
  const cycleRaw = String(formData.get("cycle") || "monthly");
  const cycle = cycleRaw === "yearly" ? "yearly" : "monthly";

  const [plan] = await db
    .select()
    .from(pricingPlans)
    .where(eq(pricingPlans.key, planKey))
    .limit(1);
  if (!plan || !plan.isActive) throw new Error("Paket tidak tersedia.");
  if (plan.isCustom) redirect("/kontak");

  // Batas "1 workspace gratis per user": cegah turun ke paket gratis bila user
  // sudah memiliki workspace gratis lain.
  if (isFreePlan(plan) && session?.user?.id) {
    const otherFree = await ownedFreeWorkspaceCount(session.user.id, schoolId);
    if (otherFree >= 1) {
      throw new Error(
        "Anda sudah punya workspace gratis lain. Hanya satu workspace gratis diperbolehkan per akun.",
      );
    }
  }

  // === BYPASS PEMBAYARAN: aktifkan langsung ===
  await db
    .update(schools)
    .set({ planKey, billingCycle: cycle, status: "active", updatedAt: new Date() })
    .where(eq(schools.id, schoolId));

  redirect("/admin/langganan?activated=1");
}
