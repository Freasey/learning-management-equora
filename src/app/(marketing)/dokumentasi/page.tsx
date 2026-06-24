import { redirect } from "next/navigation";

// Dokumentasi statis lama digantikan Pusat Bantuan dinamis (DB-backed) di /panduan.
export default function DokumentasiRedirect() {
  redirect("/panduan");
}
