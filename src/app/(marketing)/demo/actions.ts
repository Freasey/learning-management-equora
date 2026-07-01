"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import {
  DEMO_LOGINS,
  DEMO_PASSWORD,
  ensureDemoFresh,
  type DemoRole,
} from "@/lib/demo";

/**
 * Login instan sebagai salah satu akun sekolah demo (halaman /demo).
 * signIn melempar sinyal redirect (NEXT_REDIRECT) saat sukses — dibiarkan
 * naik agar Next mengarahkan ke /dashboard.
 */
export async function loginAsDemo(role: DemoRole): Promise<string | undefined> {
  // Jaga-jaga bila login dipicu tanpa lewat halaman /demo: pastikan akun demo
  // sudah ada & segar sebelum autentikasi.
  await ensureDemoFresh();

  const creds = DEMO_LOGINS[role];
  try {
    await signIn("credentials", {
      identifier: creds.identifier,
      password: DEMO_PASSWORD,
      schoolCode: creds.schoolCode,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Akun demo belum siap. Coba lagi sebentar (sekolah demo mungkin sedang di-reset).";
    }
    throw error;
  }
  return undefined;
}
