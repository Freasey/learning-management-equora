"use client";

import { useActionState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateClassCredentials, type CredState } from "../actions";

export function KartuTool({
  classes,
  schoolCode,
  schoolName,
}: {
  classes: { id: string; name: string }[];
  schoolCode: string;
  schoolName: string;
}) {
  const [state, action, pending] = useActionState<CredState, FormData>(
    generateClassCredentials,
    undefined,
  );

  return (
    <div className="space-y-6">
      <form
        action={action}
        className="grid items-end gap-4 rounded-xl border border-line bg-paper p-5 md:grid-cols-[1.5fr_1fr_auto] print:hidden"
      >
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Kelas</span>
          <select
            name="classId"
            required
            defaultValue=""
            className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-teal-600"
          >
            <option value="" disabled>
              — Pilih kelas —
            </option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">
            Sandi sementara
          </span>
          <input
            name="password"
            required
            defaultValue="siswa12345"
            className="w-full rounded-lg border border-line bg-paper px-3 py-2 font-mono text-sm text-ink outline-none focus:border-teal-600"
          />
        </label>
        <Button type="submit" variant="primary" size="md" disabled={pending}>
          {pending ? "Memproses…" : "Setel ulang & buat kartu"}
        </Button>
      </form>

      {state && "error" in state && (
        <p className="rounded-lg border border-accent/40 bg-accent/5 px-4 py-3 text-sm text-accent print:hidden">
          {state.error}
        </p>
      )}

      <p className="rounded-lg border border-line bg-sand/40 px-4 py-3 text-xs text-muted print:hidden">
        Catatan: tindakan ini <strong>mengganti</strong> sandi semua siswa di
        kelas terpilih menjadi sandi sementara. Bagikan kartu, lalu minta siswa
        menjaganya.
      </p>

      {state && "ok" in state && (
        <div>
          <div className="mb-4 flex items-center justify-between print:hidden">
            <p className="text-sm text-ink">
              {state.students.length} kartu siap. Sandi:{" "}
              <span className="font-mono font-semibold">{state.password}</span>
            </p>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-md border border-line bg-paper px-3 py-1.5 text-sm font-semibold text-ink hover:bg-sand"
            >
              <Printer className="h-4 w-4" />
              Cetak
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {state.students.map((s, i) => (
              <div
                key={i}
                className="break-inside-avoid rounded-xl border border-line bg-paper p-4"
              >
                <div className="font-display text-base font-medium text-ink">
                  {s.name}
                </div>
                <div className="mt-2 space-y-1 font-mono text-xs text-ink">
                  <div>
                    <span className="text-muted">Sekolah:</span> {schoolName}
                  </div>
                  <div>
                    <span className="text-muted">Kode:</span> {schoolCode}
                  </div>
                  <div>
                    <span className="text-muted">NIS:</span> {s.username ?? "—"}
                  </div>
                  <div>
                    <span className="text-muted">Sandi:</span> {state.password}
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-muted">
                  Masuk di /masuk-siswa
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
