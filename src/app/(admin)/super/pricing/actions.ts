"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, pricingPlans } from "@/db";
import { requireSuperAdmin } from "@/lib/auth-guard";

// "" → null, selain itu → integer
const nullableInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : v),
  z.coerce.number().int().min(0).nullable(),
);

const schema = z.object({
  id: z.coerce.number().int(),
  name: z.string().min(1, "Nama wajib diisi"),
  description: z.string().optional().default(""),
  priceMonthly: z.coerce.number().int().min(0),
  priceYearly: z.coerce.number().int().min(0),
  quotaStudents: nullableInt,
  quotaTeachers: nullableInt,
  quotaAdmins: nullableInt,
  storageGb: nullableInt,
  aiCredits: nullableInt,
  isCustom: z.boolean(),
  isActive: z.boolean(),
});

export async function updatePlan(formData: FormData) {
  await requireSuperAdmin();
  const parsed = schema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description"),
    priceMonthly: formData.get("priceMonthly"),
    priceYearly: formData.get("priceYearly"),
    quotaStudents: formData.get("quotaStudents"),
    quotaTeachers: formData.get("quotaTeachers"),
    quotaAdmins: formData.get("quotaAdmins"),
    storageGb: formData.get("storageGb"),
    aiCredits: formData.get("aiCredits"),
    isCustom: formData.get("isCustom") === "on",
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid");
  }

  const { id, ...values } = parsed.data;

  await db
    .update(pricingPlans)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(pricingPlans.id, id));

  revalidatePath("/super/pricing");
}
