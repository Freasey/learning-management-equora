"use server";

import { revalidatePath } from "next/cache";
import { signOut } from "@/auth";
import { requireSuperAdmin } from "@/lib/auth-guard";
import { resetDemoSchool, DEMO_RESET_INTERVAL_MS } from "@/lib/demo";
import { logAudit } from "@/lib/audit";

export async function doSignOut() {
  await signOut({ redirectTo: "/masuk" });
}

/**
 * Reset MANUAL sekolah demo (kode DEMO01) dari konsol Super Admin. Hanya
 * menyentuh sekolah demo — sekolah pelanggan lain tidak tersentuh.
 * Mengembalikan waktu reset & jatuh tempo reset berikutnya (untuk hitung mundur).
 */
export async function resetDemoNow(): Promise<{
  ok: true;
  at: string;
  nextAt: string;
}> {
  const session = await requireSuperAdmin();

  const summary = await resetDemoSchool();
  await logAudit({
    action: "demo.reset",
    actorId: session?.user?.id,
    actorLabel: session?.user?.email ?? "super_admin",
    schoolId: summary.schoolId,
    meta: { via: "manual", students: summary.students, teachers: summary.teachers },
  });

  revalidatePath("/super");
  return {
    ok: true,
    at: summary.resetAt.toISOString(),
    nextAt: new Date(
      summary.resetAt.getTime() + DEMO_RESET_INTERVAL_MS,
    ).toISOString(),
  };
}
