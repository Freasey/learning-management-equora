/** Daftar game yang tersedia — sumber kebenaran untuk pilihan `gameType`. */
export const GAME_CATALOG = [
  {
    id: "snake",
    label: "Ular",
    description:
      "Arahkan ular memakan buah berlabel A–D sesuai jawaban. Nabrak tembok atau badan sendiri = salah.",
    available: true,
  },
  {
    id: "pacman",
    label: "Pacman",
    description:
      "Susuri labirin menuju buah jawaban sambil menghindari hantu. Tertangkap hantu = salah.",
    available: true,
  },
] as const;

export type GameTypeId = (typeof GAME_CATALOG)[number]["id"];
