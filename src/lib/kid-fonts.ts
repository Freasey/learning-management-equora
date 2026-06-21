import { Baloo_2, Nunito } from "next/font/google";

// Font "Bright Campus" untuk area siswa.
export const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

/** className gabungan untuk wrapper area siswa (mengaktifkan var font). */
export const kidFontVars = `${baloo.variable} ${nunito.variable}`;
