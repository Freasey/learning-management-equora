import type { Metadata } from "next";
import { Mail, Phone, MapPin } from "lucide-react";
import { LeadForm } from "@/components/site/lead-form";

export const metadata: Metadata = {
  title: "Kontak — Equora",
  description: "Hubungi tim Equora. Kami siap membantu sekolah Anda.",
};

const channels = [
  { icon: Mail, label: "Email", value: "halo@equora.id" },
  { icon: Phone, label: "WhatsApp", value: "+62 812-0000-0000" },
  { icon: MapPin, label: "Alamat", value: "Jakarta, Indonesia" },
];

export default function KontakPage() {
  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-2 md:py-24">
      <div>
        <span className="font-mono text-xs uppercase tracking-widest text-teal-700">
          Kontak
        </span>
        <h1 className="mt-3 font-display text-4xl font-medium leading-tight text-ink md:text-5xl">
          Mari bicara
        </h1>
        <p className="mt-4 text-lg text-muted">
          Punya pertanyaan tentang produk, harga, atau migrasi data? Tim kami
          siap membantu.
        </p>

        <div className="mt-8 space-y-4">
          {channels.map((c) => (
            <div key={c.label} className="flex items-center gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-teal-700/10 text-teal-700">
                <c.icon className="h-5 w-5" />
              </span>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  {c.label}
                </div>
                <div className="text-ink">{c.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-paper p-7 shadow-[0_24px_60px_-30px_rgba(14,58,58,0.3)]">
        <h2 className="mb-5 font-display text-xl font-medium text-ink">
          Kirim pesan
        </h2>
        <LeadForm type="contact" submitLabel="Kirim Pesan" />
      </div>
    </section>
  );
}
