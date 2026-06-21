"use server";

import { z } from "zod";
import { db, contactRequests } from "@/db";

export type LeadState = { ok: boolean; message: string } | undefined;

const schema = z.object({
  type: z.enum(["demo", "contact"]),
  name: z.string().min(2, "Nama wajib diisi"),
  schoolName: z.string().optional().or(z.literal("")),
  email: z.string().email("Email tidak valid"),
  phone: z.string().optional().or(z.literal("")),
  planKey: z.string().optional().or(z.literal("")),
  message: z.string().optional().or(z.literal("")),
});

export async function submitLead(
  _prev: LeadState,
  formData: FormData,
): Promise<LeadState> {
  const parsed = schema.safeParse({
    type: formData.get("type"),
    name: formData.get("name"),
    schoolName: formData.get("schoolName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    planKey: formData.get("planKey"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const d = parsed.data;
  await db.insert(contactRequests).values({
    type: d.type,
    name: d.name,
    schoolName: d.schoolName || null,
    email: d.email,
    phone: d.phone || null,
    planKey: d.planKey || null,
    message: d.message || "",
  });

  return {
    ok: true,
    message:
      d.type === "demo"
        ? "Terima kasih! Tim kami akan menghubungi Anda untuk menjadwalkan demo."
        : "Pesan terkirim! Kami akan membalas secepatnya.",
  };
}
