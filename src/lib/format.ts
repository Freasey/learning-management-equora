/** Format angka Rupiah tanpa desimal. */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Label kuota: null = tak terbatas. */
export function quotaLabel(value: number | null): string {
  return value === null ? "Tak terbatas" : value.toLocaleString("id-ID");
}

/** Format tanggal singkat Indonesia. */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(new Date(date));
}
