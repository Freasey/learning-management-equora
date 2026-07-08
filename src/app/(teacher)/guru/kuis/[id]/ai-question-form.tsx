"use client";

import { useRef, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/admin/ui";
import { generateQuestionsAi } from "../actions";

/**
 * Panel "Buat Soal dengan AI" — jalur cepat untuk guru yang tidak sempat
 * menyusun soal manual. Soal hasil AI LANGSUNG tersimpan ke kuis (kuis masih
 * draf sampai diterbitkan) dan generate berikutnya MENAMBAH soal, sehingga
 * guru bisa prompt berulang kali lalu menghapus soal yang tidak pas dari
 * daftar soal di atas.
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
  const [result, setResult] = useState<{ added: number; fromKnowledge: boolean } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPending, startAi] = useTransition();

  function runGenerate() {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    setAiError(null);
    setResult(null);
    startAi(async () => {
      const res = await generateQuestionsAi(fd);
      if (res.error) setAiError(res.error);
      else if (res.ok) {
        setResult({ added: res.added ?? 0, fromKnowledge: Boolean(res.fromKnowledge) });
      }
    });
  }

  return (
    <section className="mb-8 rounded-xl border border-teal-700/25 bg-teal-700/4 p-5">
      <div className="mb-1 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-teal-700" />
        <h2 className="font-display text-lg font-medium text-ink">Buat Soal dengan AI</h2>
      </div>
      <p className="mb-4 text-sm text-muted">
        Tidak sempat menyusun soal? Cukup isi topik — atau unggah bahan referensi (PDF, DOCX,
        gambar, atau teks) agar soal mengikuti bahan Anda. Soal langsung ditambahkan ke daftar di
        atas; ulangi kapan saja untuk menambah lagi, dan hapus soal yang tidak pas lewat tombol
        Hapus. Kuis baru dilihat siswa setelah Anda menekan Terbitkan.
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
            Topik soal{" "}
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
            Bahan referensi{" "}
            <span className="font-normal text-muted">(opsional — PDF, DOCX, gambar, atau teks; maks 15 MB)</span>
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

        {result && (
          <div className="space-y-2">
            <p className="flex items-center gap-2 rounded-md bg-teal-700/10 px-3 py-2 text-sm text-teal-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {result.added} soal ditambahkan ke daftar di atas. Klik lagi untuk menambah, atau
              hapus soal yang tidak pas.
            </p>
            {result.fromKnowledge && (
              <p className="rounded-md bg-accent/10 px-3 py-2 text-xs text-accent">
                Soal disusun dari pengetahuan AI (tanpa bahan referensi) — mohon cek kebenaran isi
                dan kunci jawabannya sebelum menerbitkan kuis.
              </p>
            )}
          </div>
        )}

        <Button type="submit" variant="primary" size="md" disabled={aiPending}>
          {aiPending ? "Menyusun soal…" : result ? "Buatkan Soal Lagi" : "Buatkan Soal"}
        </Button>
      </form>
    </section>
  );
}
