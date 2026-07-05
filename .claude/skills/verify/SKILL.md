---
name: verify
description: Resep menjalankan & memverifikasi app ini (login demo via curl, cek SSR HTML/CSS)
---

# Verifikasi runtime app ini

## Jalankan

- `npm run dev` (background) → http://localhost:3000, siap dalam ~2 detik.
- Build cek: `npm run build` (Turbopack + TypeScript).

## Login lewat HTTP (tanpa browser)

Akun demo selalu ada (sekolah DEMO01, password semua akun `demo12345`,
NIS siswa `2026001`, kredensial lain di `src/lib/demo.ts`). Alur Auth.js v5:

```bash
JAR=cookies.txt
csrf=$(curl -s -c $JAR http://localhost:3000/api/auth/csrf | sed 's/.*"csrfToken":"\([^"]*\)".*/\1/')
curl -s -b $JAR -c $JAR -X POST http://localhost:3000/api/auth/callback/credentials \
  -d "csrfToken=$csrf" -d "identifier=2026001" -d "password=demo12345" -d "schoolCode=DEMO01"
# sukses = 302 + cookie authjs.session-token di jar
curl -s -b $JAR http://localhost:3000/siswa
```

Guru/admin login pakai email tanpa `schoolCode` (lihat `DEMO_LOGINS`).

## Gotcha

- Halaman siswa semuanya SSR dinamis → markup client component (mis. widget
  TTS) ikut ter-render di HTML; grep HTML cukup untuk cek kondisional render.
- Teks JSX berinterpolasi disisipi `<!-- -->` oleh React SSR — jangan grep
  frasa utuh lintas interpolasi.
- Ubah data siswa demo lewat skrip tsx sementara di `scripts/`
  (`npx tsx --env-file=.env.local scripts/<file>.ts`), kolom siswa memakai
  `users.username` (bukan `nis`). Kembalikan datanya setelah selesai.
- CSS dev tersaji tak-minified di `/_next/static/chunks/*.css` (link ada di
  HTML) — bisa di-grep untuk aturan global.
