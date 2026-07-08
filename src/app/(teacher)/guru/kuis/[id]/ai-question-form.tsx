"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/admin/ui";
import {
  generateQuestionsAi,
  saveGeneratedQuestions,
  type DraftQuestion,
  type SaveGeneratedState,
} from "../actions";

/**
 * Panel "Buat Soal dengan AI" jalur cepat untuk guru yang tidak sempat
 * menyusun soal manual: isi topik (atau unggah bahan referensi), AI menyusun
 * draf, guru memeriksa/menyunting, lalu simpan semua sekali klik.
 */
export function AiQuestionForm({
  assessmentId,
  schoolLevel,
}: {
  assessmentId: string;
  schoolLevel: string | null;
}) {
  // Jenjang default mengikuti profil sekolah (SMK memakai kedalaman SMA).
  const defaultLevel =
    schoolLevel === "SMK"
      ? "SMA"
      : schoolLevel && ["SD", "SMP", "SMA"].includes(schoolLevel)
        ? schoolLevel
        : "SMP";

  const formRef = useRef<HTMLFormElement>(null);
  const [drafts, setDrafts] = useState<DraftQuestion[] | null>(null);
  const [fromKnowledge, setFromKnowledge] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPending, startAi] = useTransition();
  const [saveState, saveAction, savePending] = useActionState<SaveGeneratedState, FormData>(
    saveGeneratedQuestions,
    undefined,
  );

  // Setelah tersimpan, buang draf daftar soal di atas ter-refresh dari server.
  // (Penyesuaian state saat render, bukan useEffect sesuai anjuran React.)
  const [handledSave, setHandledSave] = useState<SaveGeneratedState>(undefined);
  if (saveState !== handledSave) {
    setHandledSave(saveState);
    if (saveState?.ok) setDrafts(null);
  }

  function runGenerate() {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    setAiError(null);
    startAi(async () => {
      const res = await generateQuestionsAi(fd);
      if (res.error) setAiError(res.error);
      else if (res.items) {
        setDrafts(res.items);
        setFromKnowledge(Boolean(res.fromKnowledge));
      }
    });
  }

  function update(i: number, patch: Partial<DraftQuestion>) {
    setDrafts((prev) => prev?.map((q, idx) => (idx === i ? { ...q, ...patch } : q)) ?? prev);
  }
  function updateOption(i: number, oi: number, value: string) {
    setDrafts(
      (prev) =>
        prev?.map((q, idx) =>
          idx === i && q.options
            ? { ...q, options: q.options.map((o, j) => (j === oi ? value : o)) }
            : q,
        ) ?? prev,
    );
  }
  function remove(i: number) {
    setDrafts((prev) => {
      const next = prev?.filter((_, idx) => idx !== i) ?? null;
      return next && next.length > 0 ? next : null;
    });
  }

  const totalPoints = drafts?.reduce((s, q) => s + (Number(q.points) || 0), 0) ?? 0;

  return (
    <section className="mb-8 rounded-xl border border-teal-700/25 bg-teal-700/4 p-5">
      <div className="mb-1 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-teal-700" />
        <h2 className="font-display text-lg font-medium text-ink">Buat Soal dengan AI</h2>
      </div>
      <p className="mb-4 text-sm text-muted">
        Tidak sempat menyusun soal? Cukup isi topik atau unggah bahan referensi (PDF, DOCX,
        gambar, atau teks) agar soal mengikuti bahan Anda. Hasilnya berupa draf yang bisa Anda
        periksa dan sunting dulu; belum ada yang tersimpan sebelum menekan Simpan.
      </p>

      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          runGenerate();
        }}
        className="space-y-4"
      >
        <input type="hidden" name="assessmentId" value={assessmentId} />

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink">
            Topik soal {" "}
            <span className="font-normal text-muted">(boleh kosong bila ada bahan referensi)</span>
          </span>
          <input
            name="topic"
            placeholder="cth: Fotosintesis, Perang Diponegoro, persamaan linear satu variabel…"
            className={inputClass}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink">Jumlah soal</span>
            <input name="count" type="number" min={1} max={20} defaultValue={5} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink">Jenis soal</span>
            <select name="kind" defaultValue="mc" className={inputClass}>
              <option value="mc">Pilihan ganda</option>
              <option value="essay">Esai</option>
              <option value="mix">Campuran (±⅓ esai)</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink">Kesulitan</span>
            <select name="difficulty" defaultValue="sedang" className={inputClass}>
              <option value="mudah">Mudah</option>
              <option value="sedang">Sedang</option>
              <option value="sulit">Sulit</option>
              <option value="campuran">Campuran</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink">Jenjang</span>
            <select name="level" defaultValue={defaultLevel} className={inputClass}>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ink">
            Bahan referensi <span className="font-normal text-muted">(opsional PDF, DOCX, gambar, atau teks; maks 15 MB)</span>
          </span>
          <input
            name="sourceFile"
            type="file"
            accept=".pdf,.docx,.txt,.md,image/*"
            className="block w-full text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-teal-700/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-teal-700 hover:file:bg-teal-700/15"
          />
        </label>

        <details>
          <summary className="cursor-pointer text-xs font-semibold text-teal-700">
            Atau tempel teks bahan (opsional)
          </summary>
          <textarea
            name="sourceText"
            rows={4}
            placeholder="Tempel ringkasan materi, catatan, atau kutipan buku di sini…"
            className={`${inputClass} mt-2`}
          />
        </details>

        {aiError && (
          <p className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {aiError}
          </p>
        )}

        <Button type="submit" variant="primary" size="md" disabled={aiPending}>
          {aiPending ? "Menyusun soal…" : drafts ? "Buat Ulang" : "Buatkan Soal"}
        </Button>
      </form>

      {saveState?.ok && !drafts && (
        <p className="mt-4 flex items-center gap-2 rounded-md bg-teal-700/10 px-3 py-2 text-sm text-teal-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {saveState.saved} soal tersimpan ke kuis. Anda bisa membuat lagi atau langsung menerbitkan kuis.
        </p>
      )}

      {drafts && drafts.length > 0 && (
        <div className="mt-6 border-t border-teal-700/15 pt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-base font-medium text-ink">
              Pratinjau {drafts.length} soal · {totalPoints} poin
            </h3>
            <p className="text-xs text-muted">Periksa & sunting seperlunya baru tersimpan setelah Anda menekan Simpan.</p>
          </div>
          {fromKnowledge && (
            <p className="mb-3 rounded-md bg-accent/10 px-3 py-2 text-xs text-accent">
              Soal disusun dari pengetahuan AI (tanpa bahan referensi) mohon cek kebenaran isi
              dan kunci jawabannya.
            </p>
          )}

          <div className="space-y-3">
            {drafts.map((q, i) => (
              <div key={i} className="rounded-xl border border-line bg-paper p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted">#{i + 1}</span>
                    <span className="rounded-full bg-sand-deep px-2 py-0.5 font-mono text-[10px] uppercase text-ink">
                      {q.type === "mc" ? "Pilihan Ganda" : "Esai"}
                    </span>
                    <label className="flex items-center gap-1.5 text-xs text-muted">
                      Poin
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={q.points}
                        onChange={(e) => update(i, { points: Math.trunc(Number(e.target.value)) || 1 })}
                        className="w-16 rounded-md border border-line bg-paper px-2 py-1 text-sm text-ink"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    aria-label={`Hapus soal ${i + 1}`}
                    className="rounded-md border border-line p-1.5 text-red-600 transition-colors hover:bg-red-600 hover:text-paper"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <textarea
                  value={q.text}
                  onChange={(e) => update(i, { text: e.target.value })}
                  rows={2}
                  aria-label={`Teks soal ${i + 1}`}
                  className={inputClass}
                />

                {q.type === "mc" && q.options && (
                  <div className="mt-2 space-y-1.5">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={q.correctIndex === oi}
                          onChange={() => update(i, { correctIndex: oi })}
                          aria-label={`Opsi ${String.fromCharCode(65 + oi)} benar`}
                          className="h-4 w-4 text-teal-700 focus:ring-teal-500/30"
                        />
                        <input
                          value={opt}
                          onChange={(e) => updateOption(i, oi, e.target.value)}
                          aria-label={`Teks opsi ${String.fromCharCode(65 + oi)}`}
                          className={inputClass}
                        />
                      </div>
                    ))}
                    <p className="text-[11px] text-muted">Tandai bulatan pada jawaban yang benar.</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {saveState?.error && (
            <p className="mt-3 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {saveState.error}
            </p>
          )}

          <form action={saveAction} className="mt-4 flex items-center gap-3">
            <input type="hidden" name="assessmentId" value={assessmentId} />
            <input type="hidden" name="items" value={JSON.stringify(drafts)} />
            <Button type="submit" variant="primary" size="md" disabled={savePending}>
              {savePending ? "Menyimpan…" : `Simpan ${drafts.length} Soal`}
            </Button>
            <button
              type="button"
              onClick={() => setDrafts(null)}
              className="text-sm text-muted underline-offset-2 hover:text-ink hover:underline"
            >
              Buang draf
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
