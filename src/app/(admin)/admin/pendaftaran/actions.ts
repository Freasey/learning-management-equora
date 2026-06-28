"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, withTenant, users, enrollments, memberships } from "@/db";
import { requireSchoolAdmin } from "@/lib/auth-guard";
import { assertQuota } from "@/lib/quota";
import { getClassYear } from "@/lib/academic";
import { ensureMembership } from "@/lib/membership";
import { notify } from "@/lib/notify";
import { sendEmail } from "@/lib/email";

export async function approveMember(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const classId = String(formData.get("classId") || "");

  const member = await withTenant(schoolId, async () => {
    const [m] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.schoolId, schoolId), eq(users.status, "pending")))
      .limit(1);
    if (!m) throw new Error("Pendaftar tidak ditemukan.");

    await assertQuota(schoolId, m.role === "teacher" ? "teacher" : "student");

    await db
      .update(users)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(users.id, id));
    await ensureMembership(id, schoolId, [m.role]);

    if (m.role === "student" && classId) {
      const academicYearId = await getClassYear(schoolId, classId);
      await db.insert(enrollments).values({ schoolId, classId, studentId: id, academicYearId });
    }
    return m;
  });

  await notify({
    userId: id,
    schoolId,
    type: "approval",
    title: "Pendaftaran disetujui",
    body: "Akun Anda telah diterima. Selamat datang!",
    href: member.role === "student" ? "/siswa" : "/guru",
  });
  if (member.email) {
    await sendEmail({
      to: member.email,
      subject: "Pendaftaran Anda disetujui — Equora",
      html: `<p>Halo ${member.name},</p><p>Akun Anda telah disetujui. Silakan masuk untuk mulai menggunakan Equora.</p>`,
    });
  }

  revalidatePath("/admin/pendaftaran");
}

export async function rejectMember(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  await db
    .delete(users)
    .where(and(eq(users.id, id), eq(users.schoolId, schoolId), eq(users.status, "pending")));
  revalidatePath("/admin/pendaftaran");
}

// ── Permintaan KEANGGOTAAN lintas-sekolah (guru dengan akun yang sudah ada,
// mis. pemilik kelas pribadi yang ingin mengajar di sekolah ini). ──────────

export async function approveMembership(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const id = z.string().uuid().parse(formData.get("id"));

  const [m] = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.id, id),
        eq(memberships.schoolId, schoolId),
        eq(memberships.status, "pending"),
      ),
    )
    .limit(1);
  if (!m) throw new Error("Permintaan tidak ditemukan.");

  await assertQuota(schoolId, "teacher");
  await db
    .update(memberships)
    .set({ status: "active" })
    .where(eq(memberships.id, id));
  await notify({
    userId: m.userId,
    schoolId,
    type: "approval",
    title: "Permintaan mengajar disetujui",
    body: "Anda kini anggota sekolah ini. Buka lewat Kelola workspace.",
    href: "/workspace",
  });
  revalidatePath("/admin/pendaftaran");
}

export async function rejectMembership(formData: FormData) {
  const { schoolId } = await requireSchoolAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  await db
    .delete(memberships)
    .where(
      and(
        eq(memberships.id, id),
        eq(memberships.schoolId, schoolId),
        eq(memberships.status, "pending"),
      ),
    );
  revalidatePath("/admin/pendaftaran");
}
