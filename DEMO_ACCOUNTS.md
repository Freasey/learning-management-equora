# Akun Demo — SMP Demo Equora

> Dibuat otomatis oleh `npm run seed:demo`. **Jangan dipakai di produksi.**
> Semua akun memakai kata sandi yang sama: `demo12345`

- **Sekolah:** SMP Demo Equora (jenjang SMP)
- **Kode sekolah:** `DEMO01`
- **Tahun ajaran aktif:** 2025/2026 Ganjil

## 1. Admin Sekolah (login via `/masuk` — pakai email)

| Peran | Nama | Email | Kata sandi |
| --- | --- | --- | --- |
| Admin Sekolah | Admin Demo | `admin@demo.equora.id` | `demo12345` |

→ Setelah login diarahkan ke **/admin**.

## 2. Guru (login via `/masuk` — pakai email)

| # | Nama | Email | Kata sandi |
| --- | --- | --- | --- |
| Guru 1 | Andi Pratama | `andi.guru@demo.equora.id` | `demo12345` |
| Guru 2 | Siti Nurhaliza | `siti.guru@demo.equora.id` | `demo12345` |
| Guru 3 | Budi Santoso | `budi.guru@demo.equora.id` | `demo12345` |
| Guru 4 | Dewi Lestari | `dewi.guru@demo.equora.id` | `demo12345` |
| Guru 5 | Eko Wijaya | `eko.guru@demo.equora.id` | `demo12345` |

→ Setelah login diarahkan ke **/guru**.

## 3. Siswa (login via `/masuk-siswa` — pakai **kode sekolah** + NIS/username)

> Saat masuk, siswa wajib mengisi **kode sekolah** (`DEMO01`) lebih dulu, lalu NIS dan kata sandi.

| # | Nama | NIS (username) | Kata sandi | Kelas |
| --- | --- | --- | --- | --- |
| Siswa 1 | Agus Setiawan | `2026001` | `demo12345` | VII-A |
| Siswa 2 | Bella Putri | `2026002` | `demo12345` | VII-A |
| Siswa 3 | Citra Maharani | `2026003` | `demo12345` | VII-A |
| Siswa 4 | Dimas Aditya | `2026004` | `demo12345` | VII-A |
| Siswa 5 | Eka Saputra | `2026005` | `demo12345` | VII-A |
| Siswa 6 | Fani Rahmawati | `2026006` | `demo12345` | VII-B |
| Siswa 7 | Galih Permana | `2026007` | `demo12345` | VII-B |
| Siswa 8 | Hana Safira | `2026008` | `demo12345` | VII-B |
| Siswa 9 | Ivan Maulana | `2026009` | `demo12345` | VII-B |
| Siswa 10 | Joko Susilo | `2026010` | `demo12345` | VII-B |

→ Setelah login diarahkan ke **/siswa**.

---

_Cara tercepat mencoba: buka halaman **/demo** lalu klik tombol peran yang diinginkan (login instan)._
