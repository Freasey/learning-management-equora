import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { Building2, User, Check, Crown, Plus, ExternalLink } from "lucide-react";
import { auth } from "@/auth";
import { db, pricingPlans, users } from "@/db";
import { roleHome } from "@/lib/roles";
import { formatRupiah } from "@/lib/format";
import { isStorageConfigured } from "@/lib/storage";
import {
  listMyWorkspaces,
  ownedFreeWorkspaceCount,
  isFreePlan,
} from "@/lib/workspace";
import { switchWorkspace } from "@/components/workspace/actions";
import { createWorkspace, leaveWorkspace } from "./actions";
import { updateAvatar, removeAvatar } from "../account-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kelola Workspace · Equora" };

const roleLabel: Record<string, string> = {
  school_admin: "Admin",
  teacher: "Guru",
  student: "Siswa",
  super_admin: "Super Admin",
};

export default async function WorkspacePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/masuk");

  const activeSchoolId = session.user.activeSchoolId ?? session.user.schoolId ?? null;
  const canCreate = !session.user.roles?.includes("student"); // siswa murni tak bikin workspace

  const [list, ownedFree, plans, me] = await Promise.all([
    listMyWorkspaces(session.user.id),
    ownedFreeWorkspaceCount(session.user.id),
    db
      .select()
      .from(pricingPlans)
      .where(eq(pricingPlans.isActive, true))
      .orderBy(asc(pricingPlans.sortOrder)),
    db
      .select({ name: users.name, avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1),
  ]);

  const hasFree = ownedFree >= 1;
  const profile = me[0];
  const storageOn = isStorageConfigured();

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl font-medium text-ink">Workspace Saya</h1>
        <p className="mt-1 text-sm text-muted">
          Semua sekolah & kelas pribadi yang Anda ikuti. Pindah, buka, atau buat
          yang baru.
        </p>
      </header>

      {/* Profil saya — foto profil */}
      <div className="mb-8 rounded-xl border border-line bg-paper p-6">
        <h2 className="mb-4 font-display text-lg font-medium text-ink">Profil Saya</h2>
        <div className="flex flex-wrap items-center gap-5">
          <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-sand/40 text-muted">
            {profile?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt="Foto profil" className="h-full w-full object-cover" />
            ) : (
              <User className="h-8 w-8" />
            )}
          </span>
          <div className="flex flex-1 flex-col gap-1">
            <span className="font-display text-lg font-medium text-ink">{profile?.name}</span>
            {storageOn ? (
              <div className="flex flex-wrap items-end gap-3">
                <form action={updateAvatar} className="flex items-end gap-3">
                  <input
                    name="avatar"
                    type="file"
                    accept="image/*"
                    required
                    className="block text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-teal-700/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-teal-700 hover:file:bg-teal-700/15"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-teal-700 px-3 py-1.5 text-xs font-semibold text-paper transition-colors hover:opacity-90"
                  >
                    Unggah
                  </button>
                </form>
                {profile?.avatarUrl && (
                  <form action={removeAvatar}>
                    <button
                      type="submit"
                      className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-paper"
                    >
                      Hapus
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted">
                Unggah foto nonaktif — atur{" "}
                <code className="font-mono">BLOB_READ_WRITE_TOKEN</code>.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Daftar workspace */}
      <div className="space-y-3">
        {list.map((w) => {
          const active = w.schoolId === activeSchoolId;
          return (
            <div
              key={w.schoolId}
              className={`flex flex-wrap items-center gap-4 rounded-xl border bg-paper p-5 ${
                active ? "border-teal-700 ring-1 ring-teal-500/20" : "border-line"
              }`}
            >
              <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${
                  w.type === "personal"
                    ? "bg-coral/15 text-coral"
                    : "bg-teal-700/10 text-teal-700"
                }`}
              >
                {w.type === "personal" ? (
                  <User className="h-5 w-5" />
                ) : (
                  <Building2 className="h-5 w-5" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-lg font-medium text-ink">
                    {w.name}
                  </span>
                  {active && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-700/10 px-2 py-0.5 text-[11px] font-semibold text-teal-700">
                      <Check className="h-3 w-3" /> Aktif
                    </span>
                  )}
                  {w.isOwner && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
                      <Crown className="h-3 w-3" /> Pemilik
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span>{w.type === "personal" ? "Kelas pribadi" : "Sekolah"}</span>
                  <span>·</span>
                  <span>
                    {w.roles.map((r) => roleLabel[r] ?? r).join(" + ") || "—"}
                  </span>
                  <span>·</span>
                  <span>
                    {w.planName ?? w.planKey}
                    {w.free ? " (gratis)" : ""}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {active ? (
                  <a
                    href={roleHome(w.roles)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-teal-700 px-3 py-1.5 text-xs font-semibold text-paper transition-colors hover:opacity-90"
                  >
                    Buka <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <form action={switchWorkspace}>
                    <input type="hidden" name="schoolId" value={w.schoolId} />
                    <button
                      type="submit"
                      className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-700 hover:text-paper"
                    >
                      Jadikan aktif & buka
                    </button>
                  </form>
                )}
                {!w.isOwner && !w.isHome && (
                  <form action={leaveWorkspace}>
                    <input type="hidden" name="schoolId" value={w.schoolId} />
                    <button
                      type="submit"
                      className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-paper"
                    >
                      Keluar
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Buat workspace baru */}
      {canCreate && (
        <div className="mt-10 rounded-xl border border-line bg-paper p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-medium text-ink">
            <Plus className="h-5 w-5 text-teal-700" /> Buat workspace baru
          </h2>
          <p className="mt-1 text-sm text-muted">
            {hasFree
              ? "Anda sudah punya satu workspace gratis — workspace baru memerlukan paket berbayar."
              : "Workspace pertama Anda yang gratis. Berikutnya memerlukan paket berbayar."}
          </p>

          <form action={createWorkspace} className="mt-5 grid gap-4">
            <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
              <Field label="Nama workspace" name="name" required placeholder="cth. Bimbel Sari / SMA Nusantara" />
              <SelectField label="Jenis" name="type" defaultValue="personal">
                <option value="personal">Kelas pribadi</option>
                <option value="school">Sekolah</option>
              </SelectField>
              <SelectField label="Jenjang" name="level" defaultValue="SMA">
                <option value="SD">SD/MI</option>
                <option value="SMP">SMP/MTs</option>
                <option value="SMA">SMA/MA</option>
                <option value="SMK">SMK/MAK</option>
              </SelectField>
            </div>

            <SelectField label="Paket" name="planKey" defaultValue={hasFree ? "" : "starting"}>
              {plans.map((p) => {
                const free = isFreePlan(p);
                const disabled = free && hasFree;
                return (
                  <option key={p.key} value={p.key} disabled={disabled}>
                    {p.name}
                    {p.isCustom
                      ? " — nego"
                      : free
                        ? ` — gratis${disabled ? " (sudah dipakai)" : ""}`
                        : ` — ${formatRupiah(p.priceMonthly)}/bln`}
                  </option>
                );
              })}
            </SelectField>

            <div>
              <button
                type="submit"
                className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90"
              >
                Buat workspace
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink">{label}</span>
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-muted/50 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-line bg-paper px-3 py-2.5 text-sm text-ink focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
      >
        {children}
      </select>
    </label>
  );
}
