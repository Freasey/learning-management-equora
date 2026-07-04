"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  Eye,
  FileText,
  Link2,
  Pencil,
  Plus,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, SelectField, inputClass } from "@/components/admin/ui";
import { saveMaterial, generateSlides, deleteMaterial, type MaterialState } from "./actions";

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
}: {
  rows: MaterialRow[];
  subjectOptions: Option[];
  classOptions: Option[];
  storageOn: boolean;
  aiConfigured: boolean;
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
                    <td className="px-4 py-3 text-ink">{m.subjectName ?? "—"}</td>
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
  onClose,
}: {
  row: MaterialRow | null;
  subjectOptions: Option[];
  classOptions: Option[];
  storageOn: boolean;
  aiConfigured: boolean;
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

  // Bahan untuk asisten AI (tak ikut tersimpan — dipakai hanya untuk generate).
  const [sourceText, setSourceText] = useState("");
  const [slideCount, setSlideCount] = useState("10");
  const [level, setLevel] = useState("SMP");
  const [style, setStyle] = useState("ringkas");
  const [withExamples, setWithExamples] = useState(true);
  const [withDiscussion, setWithDiscussion] = useState(false);

  // Tutup panel setelah simpan berhasil.
  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  function runAi() {
    if (!formRef.current) return;
    const main = new FormData(formRef.current);
    const subjectId = String(main.get("subjectId") ?? "");
    const file = sourceFileRef.current?.files?.[0];
    if (!subjectId) {
      setAiError("Pilih mapel dulu.");
      return;
    }
    if (!sourceText.trim() && !file) {
      setAiError("Tempel isi modul atau unggah berkas modul dulu.");
      return;
    }
    const fd = new FormData();
    fd.set("subjectId", subjectId);
    fd.set("topic", String(main.get("topic") ?? ""));
    fd.set("sourceText", sourceText);
    if (file) fd.set("sourceFile", file);
    fd.set("slideCount", slideCount);
    fd.set("level", level);
    fd.set("style", style);
    fd.set("includeExamples", withExamples ? "1" : "");
    fd.set("includeDiscussion", withDiscussion ? "1" : "");
    setAiError(null);
    startAi(async () => {
      const res = await generateSlides(fd);
      if (res.error) setAiError(res.error);
      else if (res.text) {
        setContent(res.text);
        setAiAssisted(true);
        setShowPreview(true);
      }
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
          <option value="">— Umum —</option>
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
            {/* Asisten AI: rangkum modul jadi slide */}
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink">Buat slide dari modul</h3>
                  <p className="text-xs text-muted">
                    Tempel isi modul atau unggah berkasnya — AI merangkum jadi presentasi.
                  </p>
                </div>
              </div>

              <textarea
                rows={4}
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Tempel isi modul di sini (bab, catatan, ringkasan)…"
                className={inputClass}
              />

              <label className="mt-3 block">
                <span className="mb-1.5 block text-xs font-semibold text-ink">
                  atau unggah berkas modul (opsional)
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

              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={runAi}
                  disabled={aiPending}
                  className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-paper transition hover:brightness-95 disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  {aiPending ? "Menyusun slide…" : "Buat slide"}
                </button>
                {!aiConfigured && (
                  <span className="text-xs text-muted">
                    Mode demo — atur <code className="font-mono text-[11px]">GEMINI_API_KEY</code> untuk hasil nyata.
                  </span>
                )}
              </div>
              <div className="mt-2">
                <AiErrorNote message={aiError} />
              </div>
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
                <SlidePreview markdown={content} />
              ) : (
                <textarea
                  name="content"
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Slide muncul di sini setelah dibuat AI — atau ketik sendiri. Pisahkan slide dengan baris ---, judul diawali '# '."
                  className={`${inputClass} font-mono text-xs`}
                />
              )}
              {/* Pastikan isi tetap terkirim walau sedang mode pratinjau */}
              {showPreview && <input type="hidden" name="content" value={content} />}
            </div>
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
                Unggah berkas nonaktif — penyimpanan belum dikonfigurasi.
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

type Slide = { title: string; bullets: string[]; body: string[] };

/** Pisah markdown slide (dipisah '---', judul '# ', butir '- '). */
function parseSlides(markdown: string): Slide[] {
  return markdown
    .split(/^\s*---\s*$/m)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
      let title = "";
      const bullets: string[] = [];
      const body: string[] = [];
      for (const line of lines) {
        if (!title && line.startsWith("#")) {
          title = line.replace(/^#+\s*/, "");
        } else if (line.startsWith("- ") || line.startsWith("* ")) {
          bullets.push(line.slice(2));
        } else if (!title) {
          title = line;
        } else {
          body.push(line);
        }
      }
      return { title: title || "(tanpa judul)", bullets, body };
    });
}

function SlidePreview({ markdown }: { markdown: string }) {
  const slides = parseSlides(markdown);
  if (slides.length === 0) {
    return <p className="text-xs text-muted">Belum ada slide untuk dipratinjau.</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {slides.map((s, i) => (
        <div
          key={i}
          className="aspect-video overflow-auto rounded-lg border border-line bg-white p-4 shadow-sm"
        >
          <div className="mb-1 font-mono text-[10px] text-muted">Slide {i + 1}</div>
          <h4 className="font-display text-sm font-semibold text-ink">{s.title}</h4>
          {s.body.length > 0 && (
            <p className="mt-1 text-xs text-ink/70">{s.body.join(" ")}</p>
          )}
          {s.bullets.length > 0 && (
            <ul className="mt-2 space-y-1">
              {s.bullets.map((b, j) => (
                <li key={j} className="flex gap-1.5 text-xs text-ink/80">
                  <span className="text-accent">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
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
