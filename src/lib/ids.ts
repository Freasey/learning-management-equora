/** Ubah teks jadi slug url-friendly. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Kode acak (huruf/angka tanpa karakter ambigu) — untuk kode sekolah. */
export function randomCode(len = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: len },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

/**
 * Kode mapel otomatis dari nama. Satu kata → 3 huruf awal; banyak kata →
 * inisial tiap kata (maks 4). Mengabaikan "dan" & tanda kurung.
 * cth. "Matematika" → MAT, "Pendidikan Pancasila" → PP, "IPAS" → IPA.
 */
export function subjectCode(name: string): string {
  const words = name
    .replace(/[()]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w && w.toLowerCase() !== "dan");
  if (words.length === 0) return "MP";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 4);
}
