/**
 * SVG manual untuk area Siswa (tanpa icon library). Semua digambar tangan
 * dengan path/shape sederhana agar terasa intensional, bukan generik.
 */

type IconProps = { className?: string };

/** Logo: buku terbuka. */
export function LogoBook({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 6.5C9.8 5.2 7.3 4.9 4.5 5.4v11.3c2.8-.5 5.3-.2 7.5 1.1 2.2-1.3 4.7-1.6 7.5-1.1V5.4C16.7 4.9 14.2 5.2 12 6.5Z"
        fill="currentColor"
        opacity="0.18"
      />
      <path
        d="M12 6.5C9.8 5.2 7.3 4.9 4.5 5.4v11.3c2.8-.5 5.3-.2 7.5 1.1 2.2-1.3 4.7-1.6 7.5-1.1V5.4C16.7 4.9 14.2 5.2 12 6.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12 6.7v11.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Keluar: pintu + panah. */
export function IconLogout({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" />
      <path d="M10 12H3.5" />
      <path d="m6.5 8-4 4 4 4" />
    </svg>
  );
}

/** Bantuan: lingkaran tanda tanya. */
export function IconHelp({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9.2 9.3a2.9 2.9 0 0 1 5.6 1c0 1.9-2.8 2.5-2.8 4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

/** Peringatan: lingkaran seru. */
export function IconAlert({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4.5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

/** Ilustrasi: tumpukan buku + matahari kecil (dekorasi, multi-warna palet). */
export function ArtBooks({ className }: IconProps) {
  return (
    <svg viewBox="0 0 140 120" className={className} fill="none" aria-hidden="true">
      <circle cx="104" cy="30" r="13" fill="#FFC145" />
      <path d="M104 9v-6M104 57v6M83 30h-6M131 30h-6M89 15l-4-4M123 49l-4-4M119 15l4-4M85 49l4-4" stroke="#FFC145" strokeWidth="3" strokeLinecap="round" />
      <rect x="22" y="92" width="92" height="18" rx="5" fill="#FF6B5E" />
      <rect x="30" y="74" width="80" height="18" rx="5" fill="#3DA9FC" />
      <rect x="18" y="56" width="86" height="18" rx="5" fill="#27CA9A" />
      <rect x="30" y="60" width="6" height="10" rx="3" fill="#ffffff" opacity="0.6" />
      <rect x="42" y="78" width="6" height="10" rx="3" fill="#ffffff" opacity="0.6" />
      <rect x="34" y="96" width="6" height="10" rx="3" fill="#ffffff" opacity="0.6" />
    </svg>
  );
}

/** Ilustrasi empty-state: pensil & penggaris menyilang. */
export function ArtBuilding({ className }: IconProps) {
  return (
    <svg viewBox="0 0 96 96" className={className} fill="none" aria-hidden="true">
      <rect x="14" y="20" width="14" height="60" rx="4" transform="rotate(-18 21 50)" fill="#3DA9FC" />
      <rect x="68" y="20" width="14" height="60" rx="4" transform="rotate(18 75 50)" fill="#FFC145" />
      <path d="M21 24l4-10 4 10" fill="#1d2422" opacity="0.8" />
      <circle cx="48" cy="50" r="9" fill="#FF6B5E" />
    </svg>
  );
}
