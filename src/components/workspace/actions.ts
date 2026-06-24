"use server";

import { redirect } from "next/navigation";
import { auth, unstable_update } from "@/auth";
import { roleHome } from "@/lib/roles";
import { buildActiveUpdate } from "@/lib/workspace";

/**
 * Pindah workspace aktif. Validasi & data peran diambil dari DB (bukan token),
 * supaya tetap jalan untuk workspace yang baru dibuat/di-join. jwt callback
 * menangani trigger "update".
 */
export async function switchWorkspace(formData: FormData) {
  const schoolId = String(formData.get("schoolId") || "");
  const session = await auth();
  if (!session?.user?.id) redirect("/masuk");

  const upd = await buildActiveUpdate(session.user.id, schoolId);
  if (!upd) throw new Error("Workspace tidak ditemukan untuk akun ini.");

  await unstable_update(upd as never);
  redirect(roleHome(upd.activeRoles));
}
