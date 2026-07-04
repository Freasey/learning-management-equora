import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // mammoth (ekstraksi teks DOCX) memakai fitur Node.js — jangan di-bundle,
  // pakai require Node native agar tidak pecah saat build server action.
  serverExternalPackages: ["mammoth"],
  experimental: {
    // Unggahan berkas (materi PDF/PPT, dll) lewat Server Action — naikkan batas
    // body dari default 1 MB. Catatan: di platform serverless tertentu masih
    // ada batas request-nya sendiri.
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  images: {
    // Izinkan menampilkan objek publik Vercel Blob via next/image.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
