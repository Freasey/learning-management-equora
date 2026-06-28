import { NextResponse, type NextRequest } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { auth } from "@/auth";
import { withTenant } from "@/db";
import { isGroupMemberInTx } from "@/lib/chat";

// Token realtime untuk Obrolan (LiveKit data channel — TANPA audio/video).
// Setiap grup (= classSubjects.id) memetakan ke satu room `chat__<groupId>`.
// Hanya anggota grup yang dapat token. Bila LiveKit belum dikonfigurasi,
// balas 204 → klien jalan mode non-realtime (pesan tetap persist & optimistik).
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  const u = session?.user;
  const roles = u?.roles ?? [];
  const role: "teacher" | "student" | null = roles.includes("teacher")
    ? "teacher"
    : roles.includes("student")
      ? "student"
      : null;
  if (!u?.id || !u.schoolId || !role) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  const groupId = req.nextUrl.searchParams.get("group");
  if (!groupId) {
    return NextResponse.json({ error: "Parameter 'group' wajib." }, { status: 400 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    // Realtime tidak tersedia — bukan error fatal.
    return new NextResponse(null, { status: 204 });
  }

  const isMember = await withTenant(u.schoolId, () =>
    isGroupMemberInTx(groupId, u.id, role),
  );
  if (!isMember) {
    return NextResponse.json({ error: "Bukan anggota grup ini." }, { status: 403 });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: u.id,
    name: u.name ?? "Pengguna",
  });
  at.addGrant({
    room: `chat__${groupId}`,
    roomJoin: true,
    canPublish: false, // tanpa media
    canSubscribe: true,
    canPublishData: true, // hanya pesan teks via data channel
  });

  const token = await at.toJwt();
  return NextResponse.json({ token });
}
