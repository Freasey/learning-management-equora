import { NextResponse } from "next/server";
import { resetDemoSchool } from "@/lib/demo";
import { logAudit } from "@/lib/audit";

// bcrypt + neon Pool (WebSocket) butuh runtime Node, bukan Edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Reset otomatis sekolah demo (kode DEMO01). Dipicu Vercel Cron tiap 6 jam
 * (lihat vercel.json). Dikunci dengan CRON_SECRET: Vercel mengirim header
 * `Authorization: Bearer <CRON_SECRET>` otomatis saat env itu diset.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET belum diatur." },
      { status: 500 },
    );
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const summary = await resetDemoSchool();
  await logAudit({
    action: "demo.reset",
    actorLabel: "cron",
    schoolId: summary.schoolId,
    meta: { via: "cron", students: summary.students, teachers: summary.teachers },
  });

  return NextResponse.json({ ok: true, resetAt: summary.resetAt, summary });
}
