"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schools, pricingPlans } from "@/db";
import { requireSchoolAdmin } from "@/lib/auth-guard";

/**
 * Aktivasi paket. NOTE: pembayaran nyata (Midtrans/Xendit) DI-BYPASS untuk
 * saat ini — klik Bayar = paket langsung aktif. Ganti bagian ini dengan
 * pembuatan transaksi gateway + verifikasi webhook saat go-live.
 */
export async function activatePlan(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
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

  // === BYPASS PEMBAYARAN: aktifkan langsung ===
  await db
    .update(schools)
    .set({ planKey, billingCycle: cycle, status: "active", updatedAt: new Date() })
    .where(eq(schools.id, schoolId));

  redirect("/admin/langganan?activated=1");
}
