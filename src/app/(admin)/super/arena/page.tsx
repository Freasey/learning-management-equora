import { ArenaClient } from "./arena-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "Arena Game · Super Admin" };

export default function ArenaPage() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl font-medium text-ink">
          Arena Game
        </h1>
        <p className="mt-1 text-sm text-muted">
          Tempat uji coba game kuis dengan soal dummy  tidak menyentuh data
          sekolah mana pun. Di aplikasi siswa nanti, kunci jawaban dicek server;
          di arena ini kunci ada di browser karena soalnya bohongan.
        </p>
      </header>
      <ArenaClient />
    </div>
  );
}
