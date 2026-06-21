"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function authenticateStudent(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      identifier: formData.get("identifier"),
      password: formData.get("password"),
      schoolCode: formData.get("schoolCode"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Kode sekolah, NIS, atau kata sandi salah.";
    }
    throw error;
  }
  return undefined;
}
