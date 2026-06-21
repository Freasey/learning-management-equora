"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authenticate } from "./actions";

export function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink">
          Email / Username
        </span>
        <input
          name="identifier"
          type="text"
          required
          autoComplete="username"
          placeholder="admin@equora.id"
          className="w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-muted/50 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-ink">
          Kata sandi
        </span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-muted/50 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
        />
      </label>

      {errorMessage && (
        <p className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMessage}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={isPending}
      >
        {isPending ? "Memproses…" : "Masuk"}
      </Button>
    </form>
  );
}
