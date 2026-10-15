/** Format waktu lengkap: "15 Okt 2026, 14.20 WIB" (zona Asia/Jakarta). */
export function formatDateTime(value?: string | number | Date | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return `${d.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })} WIB`;
}
