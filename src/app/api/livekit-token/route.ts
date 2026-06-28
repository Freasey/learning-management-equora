import { NextResponse, type NextRequest } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { auth } from "@/auth";

// Endpoint "tukang cetak tiket" untuk Meet (LiveKit Cloud).
//
// Beda penting dari prototipe: di sini IDENTITAS & OTORISASI diambil dari sesi
// login Gedung A — bukan dari input bebas browser. Jadi tidak ada penyamaran:
//  - identity peserta = id user yang sedang login (bukan nama ketikan),
//  - nama room di-namespace per sekolah → siswa sekolah lain tak bisa nyasar
//    ke ruang yang sama walau kode ruangnya kebetulan sama,
//  - API Secret tak pernah dikirim ke browser; hanya dipakai menandatangani.
export const dynamic = "force-dynamic";

// Ubah kode ruang bebas → token aman (huruf/angka/strip), batasi panjang.
function slugRoom(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "kelas"
  );
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.schoolId) {
    return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Server belum dikonfigurasi (LIVEKIT_API_KEY/SECRET kosong)." },
      { status: 500 },
    );
  }

  // Kode ruang dari klien hanya menentukan SUB-ruang; sekolah selalu dipaksa
  // dari sesi agar antar-sekolah terisolasi.
  const sub = slugRoom(req.nextUrl.searchParams.get("room") ?? "kelas");
  const room = `s_${user.schoolId}__${sub}`;

  // Guru = admin ruang (boleh mute/kick peserta lewat UI VideoConference).
  const isTeacher = user.role === "teacher";

  const at = new AccessToken(apiKey, apiSecret, {
    identity: user.id,
    name: user.name ?? "Peserta",
  });
  at.addGrant({
    room,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: isTeacher,
  });

  const token = await at.toJwt();
  return NextResponse.json({ token, room });
}
