"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  Download,
  Eye,
  FileText,
  Link2,
  Palette,
  Pencil,
  Plus,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, SelectField, inputClass } from "@/components/admin/ui";
import { parseSlides, slideTypeLabel, type DesignSpec } from "@/lib/slides";
import {
  saveMaterial,
  generateSlides,
  generateAll,
  generateDesigns,
  exportPptx,
  deleteMaterial,
  type MaterialState,
} from "./actions";

export type MaterialRow = {
  id: string;
  title: string;
  topic: string | null;
  type: string;
  url: string | null;
  notes: string;
  subjectId: string | null;
  classId: string | null;
  subjectName: string | null;
  className: string | null;
  createdLabel: string;
};

type Option = { id: string; name: string | null };
type Source = "tulis" | "berkas" | "tautan";

const typeBadge: Record<string, { label: string; cls: string }> = {
  ai: { label: "AI", cls: "bg-accent/15 text-accent" },
  link: { label: "Tautan", cls: "bg-teal-700/10 text-teal-700" },
  file: { label: "Berkas", cls: "bg-coral/15 text-coral" },
  manual: { label: "Catatan", cls: "bg-sand-deep text-ink" },
};

function sourceOfType(type: string): Source {
  if (type === "file") return "berkas";
  if (type === "link") return "tautan";
  return "tulis";
}

export function MateriManager({
  rows,
  subjectOptions,
  classOptions,
  storageOn,
  aiConfigured,
  schoolLevel,
}: {
  rows: MaterialRow[];
  subjectOptions: Option[];
  classOptions: Option[];
  storageOn: boolean;
  aiConfigured: boolean;
  schoolLevel: string | null;
}) {
  // null = panel tertutup; "new" = tambah; row = ubah.
  const [target, setTarget] = useState<MaterialRow | "new" | null>(null);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium text-ink">Materi Ajar</h1>
          <p className="mt-1 text-sm text-muted">
            Satu tempat untuk menulis, mengunggah berkas, atau menautkan materi.
          </p>
        </div>
        {target === null && (
          <Button variant="primary" size="md" onClick={() => setTarget("new")}>
            <Plus className="h-4 w-4" /> Tambah Materi
          </Button>
        )}
      </div>

      {target !== null && (
        <MaterialPanel
          key={target === "new" ? "new" : target.id}
          row={target === "new" ? null : target}
          subjectOptions={subjectOptions}
          classOptions={classOptions}
          storageOn={storageOn}
          aiConfigured={aiConfigured}
          schoolLevel={schoolLevel}
          onClose={() => setTarget(null)}
        />
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-sand/40">
              <Th>Judul</Th>
              <Th>Mapel</Th>
              <Th>Kelas</Th>
              <Th>Tipe</Th>
              <Th>Dibuat</Th>
              <Th>Aksi</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  Belum ada materi. Klik <span className="font-semibold">Tambah Materi</span> untuk mulai.
                </td>
              </tr>
            ) : (
              rows.map((m) => {
                const b = typeBadge[m.type] ?? typeBadge.manual;
                return (
                  <tr key={m.id} className="border-b border-line align-top last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">
                      {m.url ? (
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-teal-700 hover:underline"
                        >
                          {m.title} <Link2 className="h-3 w-3" />
                        </a>
                      ) : (
                        m.title
                      )}
                      {m.notes.trim() && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-xs font-normal text-muted hover:text-teal-700">
                            Lihat isi
                          </summary>
                          <p className="mt-1 whitespace-pre-wrap text-xs font-normal text-ink/80">
                            {m.notes}
                          </p>
                        </details>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink">{m.subjectName ?? " "}</td>
                    <td className="px-4 py-3 text-ink">{m.className ?? "Umum"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase ${b.cls}`}>
                        {b.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{m.createdLabel}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setTarget(m)}
                          className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-700 hover:text-paper"
                        >
                          <Pencil className="h-3 w-3" /> Ubah
                        </button>
                        <form action={deleteMaterial}>
                          <input type="hidden" name="id" value={m.id} />
                          <button
                            type="submit"
                            className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-paper"
                          >
                            Hapus
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MaterialPanel({
  row,
  subjectOptions,
  classOptions,
  storageOn,
  aiConfigured,
  schoolLevel,
  onClose,
}: {
  row: MaterialRow | null;
  subjectOptions: Option[];
  classOptions: Option[];
  storageOn: boolean;
  aiConfigured: boolean;
  schoolLevel: string | null;
  onClose: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const sourceFileRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState<MaterialState, FormData>(
    saveMaterial,
    undefined,
  );
  const [source, setSource] = useState<Source>(row ? sourceOfType(row.type) : "tulis");
  const [content, setContent] = useState(row?.notes ?? "");
  const [aiAssisted, setAiAssisted] = useState(row?.type === "ai");
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPending, startAi] = useTransition();
  const [showPreview, setShowPreview] = useState(false);

  // Bahan untuk asisten AI (tak ikut tersimpan dipakai hanya untuk generate).
  // Jenjang default diambil dari profil sekolah (SMK memakai kedalaman SMA).
  const defaultLevel =
    schoolLevel === "SMK" ? "SMA" : schoolLevel && ["SD", "SMP", "SMA"].includes(schoolLevel) ? schoolLevel : "SMP";
  const [sourceText, setSourceText] = useState("");
  const [slideCount, setSlideCount] = useState("10");
  const [level, setLevel] = useState(defaultLevel);
  const [style, setStyle] = useState("ringkas");
  const [withExamples, setWithExamples] = useState(true);
  const [withDiscussion, setWithDiscussion] = useState(false);
  // Info non-error setelah generate (mis. "disusun dari pengetahuan umum AI").
  const [aiNote, setAiNote] = useState<string | null>(null);

  // Desain PPT: cetak biru dari AI + pilihan guru (tak ikut tersimpan ke DB).
  const [designDesc, setDesignDesc] = useState("");
  const [designs, setDesigns] = useState<DesignSpec[] | null>(null);
  const [designIdx, setDesignIdx] = useState<number | null>(null);
  const [designError, setDesignError] = useState<string | null>(null);
  const [designPending, startDesign] = useTransition();
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportPending, startExport] = useTransition();
  const selectedDesign = designs !== null && designIdx !== null ? designs[designIdx] : null;

  // Tutup panel setelah simpan berhasil.
  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  /** Rakit FormData generate dari isi form utama + kenop AI; null bila belum valid. */
  function buildAiFormData(): FormData | null {
    if (!formRef.current) return null;
    const main = new FormData(formRef.current);
    const subjectId = String(main.get("subjectId") ?? "");
    const topic = String(main.get("topic") ?? "").trim();
    const file = sourceFileRef.current?.files?.[0];
    if (!subjectId) {
      setAiError("Pilih mapel dulu.");
      return null;
    }
    if (!topic && !sourceText.trim() && !file) {
      setAiError("Isi Topik di atas atau beri bahan modul (teks/berkas) di pengaturan lanjutan.");
      return null;
    }
    // Judul otomatis dari topik bila guru belum mengisinya.
    const titleEl = formRef.current.elements.namedItem("title");
    if (titleEl instanceof HTMLInputElement && !titleEl.value.trim() && topic) {
      titleEl.value = topic;
    }
    const fd = new FormData();
    fd.set("subjectId", subjectId);
    fd.set("topic", topic);
    fd.set("sourceText", sourceText);
    if (file) fd.set("sourceFile", file);
    fd.set("slideCount", slideCount);
    fd.set("level", level);
    fd.set("style", style);
    fd.set("includeExamples", withExamples ? "1" : "");
    fd.set("includeDiscussion", withDiscussion ? "1" : "");
    fd.set("description", designDesc);
    setAiError(null);
    setAiNote(null);
    return fd;
  }

  function noteFromKnowledge(fromKnowledge?: boolean) {
    if (fromKnowledge) {
      setAiNote(
        "Disusun AI dari pengetahuan umum (tanpa bahan modul) periksa sekilas kebenaran isinya sebelum dipakai.",
      );
    }
  }

  /** Jalur kilat: slide + 3 desain sekaligus, desain pertama langsung dipasang. */
  function runAll() {
    const fd = buildAiFormData();
    if (!fd) return;
    setDesignError(null);
    startAi(async () => {
      const res = await generateAll(fd);
      if (res.error) {
        setAiError(res.error);
        return;
      }
      if (res.text) {
        setContent(res.text);
        setAiAssisted(true);
        setShowPreview(true);
        noteFromKnowledge(res.fromKnowledge);
      }
      if (res.designs) {
        setDesigns(res.designs);
        setDesignIdx(0);
      }
      if (res.designNote) setDesignError(res.designNote);
    });
  }

  /** Jalur lanjutan: hanya menyusun slide (desain diatur terpisah di bawah). */
  function runAi() {
    const fd = buildAiFormData();
    if (!fd) return;
    startAi(async () => {
      const res = await generateSlides(fd);
      if (res.error) setAiError(res.error);
      else if (res.text) {
        setContent(res.text);
        setAiAssisted(true);
        setShowPreview(true);
        noteFromKnowledge(res.fromKnowledge);
      }
    });
  }

  function runDesigns() {
    if (!formRef.current) return;
    const main = new FormData(formRef.current);
    const fd = new FormData();
    fd.set("description", designDesc);
    fd.set("topic", String(main.get("topic") ?? ""));
    fd.set("subjectId", String(main.get("subjectId") ?? ""));
    fd.set("level", level);
    setDesignError(null);
    startDesign(async () => {
      const res = await generateDesigns(fd);
      if (res.error) setDesignError(res.error);
      else if (res.designs) {
        setDesigns(res.designs);
        setDesignIdx(0);
      }
    });
  }

  function runExport() {
    if (!formRef.current) return;
    if (!selectedDesign) {
      setExportError("Buat & pilih desain dulu.");
      return;
    }
    const main = new FormData(formRef.current);
    const title = String(main.get("title") ?? "").trim();
    if (!title) {
      setExportError("Isi judul materi dulu (dipakai sebagai judul berkas).");
      return;
    }
    const fd = new FormData();
    fd.set("title", title);
    fd.set("subjectId", String(main.get("subjectId") ?? ""));
    fd.set("content", content);
    fd.set("design", JSON.stringify(selectedDesign));
    setExportError(null);
    startExport(async () => {
      const res = await exportPptx(fd);
      if (res.error) setExportError(res.error);
      else if (res.base64 && res.filename) downloadPptx(res.base64, res.filename);
    });
  }

  const sources: { key: Source; label: string; icon: typeof FileText }[] = [
    { key: "tulis", label: "Tulis / AI", icon: FileText },
    { key: "berkas", label: "Unggah berkas", icon: Upload },
    { key: "tautan", label: "Tautan", icon: Link2 },
  ];

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mb-8 rounded-xl border border-line bg-paper p-5"
    >
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="aiAssisted" value={aiAssisted ? "1" : ""} />
      {row && <input type="hidden" name="id" value={row.id} />}

      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-medium text-ink">
          {row ? "Ubah materi" : "Tambah materi"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="grid h-8 w-8 place-items-center rounded-md text-muted transition-colors hover:bg-sand-deep hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Konteks: diisi sekali */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Judul" name="title" required defaultValue={row?.title ?? ""} placeholder="cth. Ringkasan Bab 1" />
        <Field label="Topik (opsional)" name="topic" defaultValue={row?.topic ?? ""} placeholder="cth. Hukum Newton" />
        <SelectField label="Mapel" name="subjectId" required defaultValue={row?.subjectId ?? undefined}>
          {subjectOptions.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </SelectField>
        <SelectField label="Kelas" name="classId" defaultValue={row?.classId ?? ""}>
          <option value="">Umum</option>
          {classOptions.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </SelectField>
      </div>

      {/* Pilih sumber isi */}
      <div className="mt-5">
        <span className="mb-2 block text-xs font-semibold text-ink">Sumber isi materi</span>
        <div className="inline-flex flex-wrap gap-1 rounded-lg border border-line bg-sand/40 p-1">
          {sources.map((s) => {
            const active = source === s.key;
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSource(s.key)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active ? "bg-paper text-teal-700 shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bidang sesuai sumber */}
      <div className="mt-4">
        {source === "tulis" && (
          <div className="space-y-4">
            {/* Asisten AI jalur kilat: satu klik, slide + desain langsung jadi */}
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink">Buat materi kilat</h3>
                  <p className="text-xs text-muted">
                    Cukup pilih Mapel & isi Topik di atas, lalu satu klik slide + 3 desain langsung
                    jadi. Tanpa bahan modul, AI menyusun dari pengetahuannya.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={runAll}
                  disabled={aiPending}
                  className="inline-flex items-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-paper transition hover:brightness-95 disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  {aiPending ? "Menyiapkan materi & desain…" : "Buatkan semuanya"}
                </button>
                {!aiConfigured && (
                  <span className="text-xs text-muted">
                    Mode demo atur <code className="font-mono text-[11px]">GEMINI_API_KEY</code> untuk hasil nyata.
                  </span>
                )}
              </div>
              <div className="mt-2 space-y-1">
                <AiErrorNote message={aiError} />
                {aiNote && <p className="text-xs text-amber-700">{aiNote}</p>}
              </div>

              {/* Pengaturan lanjutan: bahan modul + kenop detail (opsional) */}
              <details className="mt-3 rounded-md border border-line/70 bg-paper/70">
                <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-muted hover:text-ink">
                  Pengaturan lanjutan & bahan modul (opsional)
                </summary>
                <div className="border-t border-line/70 p-3">
                  <textarea
                    rows={4}
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Tempel isi modul di sini (bab, catatan, ringkasan) AI akan berpegang pada bahan ini…"
                    className={inputClass}
                  />

                  <label className="mt-3 block">
                    <span className="mb-1.5 block text-xs font-semibold text-ink">
                      atau unggah berkas modul
                    </span>
                    <input
                      ref={sourceFileRef}
                      type="file"
                      accept=".pdf,.docx,.txt,.md,image/*"
                      className="block w-full text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-accent/15 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-accent hover:file:bg-accent/25"
                    />
                    <span className="mt-1 block text-xs text-muted">
                      PDF, DOCX, teks, atau foto halaman (maks 15 MB).
                    </span>
                  </label>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <MiniSelect label="Jumlah slide" value={slideCount} onChange={setSlideCount}
                      options={[["6", "± 6"], ["10", "± 10"], ["15", "± 15"], ["20", "± 20"]]} />
                    <MiniSelect label="Jenjang" value={level} onChange={setLevel}
                      options={[["SD", "SD"], ["SMP", "SMP"], ["SMA", "SMA"], ["Umum", "Umum"]]} />
                    <MiniSelect label="Gaya" value={style} onChange={setStyle}
                      options={[["ringkas", "Ringkas"], ["naratif", "Naratif"], ["interaktif", "Interaktif"]]} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <Check label="Sertakan contoh soal" checked={withExamples} onChange={setWithExamples} />
                    <Check label="Sertakan poin diskusi" checked={withDiscussion} onChange={setWithDiscussion} />
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={runAi}
                      disabled={aiPending}
                      className="inline-flex items-center gap-1.5 rounded-md border border-accent px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/10 disabled:opacity-50"
                    >
                      <Sparkles className="h-4 w-4" />
                      {aiPending ? "Menyusun slide…" : "Buat slide saja"}
                    </button>
                  </div>
                </div>
              </details>
            </div>

            {/* Hasil: slide markdown, bisa disunting & dipratinjau */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink">Isi materi (slide)</span>
                {content.trim() && (
                  <button
                    type="button"
                    onClick={() => setShowPreview((v) => !v)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline"
                  >
                    <Eye className="h-3.5 w-3.5" /> {showPreview ? "Sunting" : "Pratinjau"}
                  </button>
                )}
              </div>
              {showPreview && content.trim() ? (
                <SlidePreview markdown={content} design={selectedDesign} />
              ) : (
                <textarea
                  name="content"
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Slide muncul di sini setelah dibuat AI atau ketik sendiri. Pisahkan slide dengan baris ---, judul diawali '# ', kode/rumus diapit baris ```."
                  className={`${inputClass} font-mono text-xs`}
                />
              )}
              {/* Pastikan isi tetap terkirim walau sedang mode pratinjau */}
              {showPreview && <input type="hidden" name="content" value={content} />}
            </div>

            {/* Desain & unduh PowerPoint: AI mengisi cetak biru, mesin kami merakit .pptx */}
            {content.trim() && (
              <div className="rounded-lg border border-teal-700/25 bg-teal-700/5 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-700/10 text-teal-700">
                    <Palette className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">Desain & unduh PowerPoint</h3>
                    <p className="text-xs text-muted">
                      Tulis suasana yang diinginkan AI merancang desainnya, lalu unduh sebagai berkas .pptx.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={designDesc}
                    onChange={(e) => setDesignDesc(e.target.value)}
                    placeholder='cth. "nuansa bawah laut yang ceria" kosongkan agar AI menyesuaikan topik'
                    className={`${inputClass} min-w-0 flex-1`}
                  />
                  <button
                    type="button"
                    onClick={runDesigns}
                    disabled={designPending}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-paper transition hover:brightness-95 disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    {designPending ? "Merancang…" : designs ? "Rancang ulang" : "Buatkan 3 desain"}
                  </button>
                </div>
                <div className="mt-2">
                  <AiErrorNote message={designError} />
                </div>

                {designs && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {designs.map((d, i) => (
                      <DesignThumb
                        key={i}
                        design={d}
                        selected={designIdx === i}
                        onSelect={() => setDesignIdx(i)}
                      />
                    ))}
                  </div>
                )}

                {designs && (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={runExport}
                      disabled={exportPending || designIdx === null}
                      className="inline-flex items-center gap-1.5 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:brightness-110 disabled:opacity-50"
                    >
                      <Download className="h-4 w-4" />
                      {exportPending ? "Merakit berkas…" : "Unduh PPTX"}
                    </button>
                    <span className="text-xs text-muted">
                      Bisa dibuka di PowerPoint & Google Slides teks tetap bisa disunting.
                    </span>
                  </div>
                )}
                <div className="mt-2">
                  <AiErrorNote message={exportError} />
                </div>
              </div>
            )}
          </div>
        )}

        {source === "berkas" && (
          <div className="space-y-2">
            {storageOn ? (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-ink">
                    Berkas {row?.type === "file" ? "(kosongkan bila tak ingin ganti)" : ""}
                  </span>
                  <input
                    name="file"
                    type="file"
                    accept=".pdf,.ppt,.pptx,.doc,.docx,image/*"
                    className="block w-full text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-teal-700/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-teal-700 hover:file:bg-teal-700/15"
                  />
                </label>
                {row?.type === "file" && row.url && (
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-teal-700 hover:underline"
                  >
                    Berkas saat ini <Link2 className="h-3 w-3" />
                  </a>
                )}
                <p className="text-xs text-muted">PDF, PPT, DOCX, atau gambar (maks 25 MB).</p>
              </>
            ) : (
              <p className="rounded-md border border-dashed border-line bg-sand/40 px-3 py-2 text-xs text-muted">
                Unggah berkas nonaktif penyimpanan belum dikonfigurasi.
              </p>
            )}
          </div>
        )}

        {source === "tautan" && (
          <Field label="URL tautan" name="url" required defaultValue={row?.url ?? ""} placeholder="https://…" />
        )}
      </div>

      <ErrorNote message={state?.error} />

      <div className="mt-5 flex items-center gap-3">
        <Button type="submit" variant="primary" size="md" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan"}
        </Button>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-semibold text-muted hover:text-ink"
        >
          Batal
        </button>
      </div>
    </form>
  );
}

function ErrorNote({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-4 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {message}
    </p>
  );
}

function AiErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-2 text-xs text-red-700">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

function MiniSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold text-ink">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} py-1.5`}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-xs font-medium text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-line text-accent focus:ring-accent/30"
      />
      {label}
    </label>
  );
}

/** Ubah base64 dari server menjadi unduhan berkas .pptx di browser. */
function downloadPptx(base64: string, filename: string) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Kartu kandidat desain: thumbnail mini yang meniru gaya slide-nya. */
function DesignThumb({
  design,
  selected,
  onSelect,
}: {
  design: DesignSpec;
  selected: boolean;
  onSelect: () => void;
}) {
  const c = design.colors;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`overflow-hidden rounded-lg border text-left transition ${
        selected
          ? "border-teal-700 ring-2 ring-teal-700/30"
          : "border-line hover:border-teal-700/50"
      }`}
    >
      <div className="relative aspect-video p-3" style={{ background: `#${c.background}` }}>
        {/* hiasan mini ala dekorasi slide */}
        <span
          className="absolute -right-3 -top-3 h-10 w-10 rounded-full opacity-25"
          style={{ background: `#${c.accent2}` }}
        />
        <span className="mb-1.5 block h-1 w-8 rounded" style={{ background: `#${c.accent}` }} />
        <span
          className="block text-[11px] font-bold leading-tight"
          style={{ color: `#${c.title}`, fontFamily: `"${design.headingFont}", serif` }}
        >
          {design.titleUpper ? "JUDUL MATERI" : "Judul Materi"}
        </span>
        <span className="mt-1.5 block space-y-1">
          {["Poin pembahasan utama", "Penjelasan singkat"].map((t) => (
            <span key={t} className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full" style={{ background: `#${c.accent}` }} />
              <span
                className="text-[8px] leading-tight"
                style={{ color: `#${c.text}`, fontFamily: `"${design.bodyFont}", sans-serif` }}
              >
                {t}
              </span>
            </span>
          ))}
        </span>
      </div>
      <div className="border-t border-line bg-paper px-2.5 py-1.5">
        <span className="block truncate text-xs font-semibold text-ink">{design.name}</span>
        {design.vibe && <span className="block truncate text-[10px] text-muted">{design.vibe}</span>}
      </div>
    </button>
  );
}

/** Pratinjau slide bila `design` dipilih, kartu mengikuti warna & font desainnya. */
function SlidePreview({ markdown, design }: { markdown: string; design?: DesignSpec | null }) {
  const slides = parseSlides(markdown);
  if (slides.length === 0) {
    return <p className="text-xs text-muted">Belum ada slide untuk dipratinjau.</p>;
  }
  const c = design?.colors;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {slides.map((s, i) => (
        <div
          key={i}
          className="aspect-video overflow-auto rounded-lg border border-line p-4 shadow-sm"
          style={{ background: c ? `#${c.background}` : "#ffffff" }}
        >
          <div className="mb-1 flex items-center justify-between gap-2 font-mono text-[10px]">
            <span style={{ color: c ? `#${c.text}` : undefined }} className={c ? "opacity-70" : "text-muted"}>
              Slide {i + 1}
            </span>
            <span
              className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
              style={
                c
                  ? { background: `#${c.accent}22`, color: `#${c.title}` }
                  : { background: "rgba(0,0,0,0.05)" }
              }
            >
              {slideTypeLabel[s.type]}
            </span>
          </div>
          <h4
            className={`text-sm font-semibold ${c ? "" : "font-display text-ink"}`}
            style={
              c
                ? { color: `#${c.title}`, fontFamily: `"${design.headingFont}", serif` }
                : undefined
            }
          >
            {design?.titleUpper ? s.title.toUpperCase() : s.title}
          </h4>
          {s.body.length > 0 && (
            <p
              className={`mt-1 text-xs ${c ? "" : "text-ink/70"}`}
              style={c ? { color: `#${c.text}` } : undefined}
            >
              {s.body.join(" ")}
            </p>
          )}
          {s.bullets.length > 0 && (
            <ul className="mt-2 space-y-1">
              {s.bullets.map((b, j) => (
                <li
                  key={j}
                  className={`flex gap-1.5 text-xs ${c ? "" : "text-ink/80"}`}
                  style={c ? { color: `#${c.text}` } : undefined}
                >
                  <span style={{ color: c ? `#${c.accent}` : undefined }} className={c ? "" : "text-accent"}>
                    •
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
          {s.code.length > 0 && (
            <pre
              className="mt-2 overflow-x-auto rounded-md border p-2 font-mono text-[9px] leading-relaxed"
              style={
                c
                  ? { background: `#${c.surface}`, borderColor: `#${c.accent2}`, color: `#${c.text}` }
                  : { background: "rgba(0,0,0,0.04)", borderColor: "rgba(0,0,0,0.12)" }
              }
            >
              {s.code.join("\n")}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-muted">
      {children}
    </th>
  );
}
