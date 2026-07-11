/**
 * Kontrak "rangka ↔ kulit" gamifikasi kuis.
 *
 * Setiap game (kulit) menerima SATU soal pilihan ganda dan wajib melapor
 * tepat SATU hasil lewat `onOutcome`. Game tidak tahu apa-apa di luar itu:
 * bukan urusannya soal benar/salah, nilai, jaringan, atau siapa pemainnya  
 * semuanya ditangani rangka kuis yang memasang game ini.
 *
 * Waktu habis juga urusan rangka: rangka menghentikan game (unmount/pause)
 * dan mencatat hasilnya sendiri, game tidak melaporkan timeout.
 */

export type GameQuestion = {
  text: string;
  /** Teks opsi jawaban, urut sebagai A, B, C, D. */
  options: string[];
};

export type GameOutcome =
  /** Siswa memilih jawaban (memakan buah berlabel huruf). */
  | { kind: "answer"; choiceIndex: number }
  /** Siswa kalah di dalam game (nabrak tembok, kena hantu, dst) = dianggap salah. */
  | { kind: "death" };
