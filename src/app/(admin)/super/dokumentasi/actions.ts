"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, docArticles, docRevisions } from "@/db";
import { requireSuperAdmin } from "@/lib/auth-guard";

const schema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  audience: z.enum(["guest", "school_admin", "teacher", "student"]),
  category: z.string().min(1, "Kategori wajib diisi"),
  slug: z
    .string()
    .min(2, "Slug minimal 2 karakter")
    .regex(/^[a-z0-9-]+$/, "Slug hanya huruf kecil, angka, dan tanda hubung"),
  title: z.string().min(2, "Judul minimal 2 karakter"),
  summary: z.string().optional().default(""),
  route: z.string().optional().default(""),
  icon: z.string().optional().default(""),
  sortOrder: z.coerce.number().int().default(0),
  status: z.enum(["draft", "published"]),
  body: z.string().optional().default(""),
});

export async function saveArticle(formData: FormData) {
  const session = await requireSuperAdmin();
  const editorId = session?.user?.id ?? null;

  const parsed = schema.safeParse({
    id: formData.get("id") ?? "",
    audience: formData.get("audience"),
    category: formData.get("category"),
    slug: formData.get("slug"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    route: formData.get("route"),
    icon: formData.get("icon"),
    sortOrder: formData.get("sortOrder") ?? 0,
    status: formData.get("status"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  const d = parsed.data;
  const values = {
    audience: d.audience,
    category: d.category,
    slug: d.slug,
    title: d.title,
    summary: d.summary ?? "",
    route: d.route ? d.route : null,
    icon: d.icon ? d.icon : null,
    sortOrder: d.sortOrder,
    status: d.status,
    updatedBy: editorId,
  };

  if (d.id) {
    // Simpan snapshot lama ke riwayat sebelum menimpa.
    const [old] = await db
      .select({ title: docArticles.title, body: docArticles.body })
      .from(docArticles)
      .where(eq(docArticles.id, d.id))
      .limit(1);
    if (old) {
      await db.insert(docRevisions).values({
        articleId: d.id,
        title: old.title,
        body: old.body,
        editedBy: editorId,
      });
    }
    await db
      .update(docArticles)
      .set({ ...values, body: d.body ?? "", updatedAt: new Date() })
      .where(eq(docArticles.id, d.id));
  } else {
    await db.insert(docArticles).values({ ...values, body: d.body ?? "" });
  }

  revalidatePath("/super/dokumentasi");
  redirect("/super/dokumentasi");
}

export async function deleteArticle(formData: FormData) {
  await requireSuperAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  await db.delete(docArticles).where(eq(docArticles.id, id));
  revalidatePath("/super/dokumentasi");
}
