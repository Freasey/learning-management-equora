"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Textarea, inputClass } from "@/components/admin/ui";
import { addQuestion, type QuestionState } from "../actions";

export function QuestionForms({ assessmentId }: { assessmentId: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <McForm assessmentId={assessmentId} />
      <EssayForm assessmentId={assessmentId} />
    </div>
  );
}

function ErrorNote({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {message}
    </p>
  );
}

function McForm({ assessmentId }: { assessmentId: string }) {
  const [state, formAction, pending] = useActionState<QuestionState, FormData>(
    addQuestion,
    undefined,
  );
  return (
    <form action={formAction} className="rounded-xl border border-line bg-paper p-5">
      <input type="hidden" name="assessmentId" value={assessmentId} />
      <input type="hidden" name="type" value="mc" />
      <h2 className="mb-4 font-display text-lg font-medium text-ink">Soal pilihan ganda</h2>
      <div className="space-y-4">
        <Textarea label="Pertanyaan" name="text" rows={2} required placeholder="Tulis pertanyaan…" />
        <div className="space-y-2">
          <span className="block text-xs font-semibold text-ink">
            Opsi (tandai jawaban benar)
          </span>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correctIndex"
                value={i}
                defaultChecked={i === 0}
                aria-label={`Opsi ${String.fromCharCode(65 + i)} benar`}
                className="h-4 w-4 text-teal-700 focus:ring-teal-500/30"
              />
              <input
                name={`option_${i}`}
                placeholder={`Opsi ${String.fromCharCode(65 + i)}`}
                className={inputClass}
              />
            </div>
          ))}
        </div>
        <div className="max-w-[8rem]">
          <Field label="Poin" name="points" type="number" defaultValue={1} required />
        </div>
        <ErrorNote message={state?.error} />
        <Button type="submit" variant="primary" size="md" disabled={pending}>
          {pending ? "Menyimpan…" : "Tambah Soal"}
        </Button>
      </div>
    </form>
  );
}

function EssayForm({ assessmentId }: { assessmentId: string }) {
  const [state, formAction, pending] = useActionState<QuestionState, FormData>(
    addQuestion,
    undefined,
  );
  return (
    <form action={formAction} className="rounded-xl border border-line bg-paper p-5">
      <input type="hidden" name="assessmentId" value={assessmentId} />
      <input type="hidden" name="type" value="essay" />
      <h2 className="mb-4 font-display text-lg font-medium text-ink">Soal esai</h2>
      <div className="space-y-4">
        <Textarea label="Pertanyaan" name="text" rows={4} required placeholder="Tulis pertanyaan esai…" />
        <div className="max-w-[8rem]">
          <Field label="Poin" name="points" type="number" defaultValue={5} required />
        </div>
        <p className="text-xs text-muted">
          Soal esai dikoreksi manual setelah siswa mengerjakan.
        </p>
        <ErrorNote message={state?.error} />
        <Button type="submit" variant="primary" size="md" disabled={pending}>
          {pending ? "Menyimpan…" : "Tambah Soal"}
        </Button>
      </div>
    </form>
  );
}
