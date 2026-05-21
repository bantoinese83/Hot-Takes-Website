/** Client-side helpers for Growth & waitlists admin views. */

export function bucketApproxLabel(latBucket: number | null, lngBucket: number | null): string {
  if (latBucket == null || lngBucket == null) return '—';
  const lat = (latBucket / 10).toFixed(1);
  const lng = (lngBucket / 10).toFixed(1);
  return `${lat}°, ${lng}°`;
}

export function maskEmailForDisplay(email: string, reveal: boolean): string {
  if (reveal) return email;
  const at = email.indexOf('@');
  if (at <= 1) return '•••';
  return `${email.slice(0, 2)}•••${email.slice(at)}`;
}

export function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const escape = (v: string) => {
    if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };
  const lines = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function filterByQuery<T>(rows: T[], query: string, pick: (row: T) => string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((r) => pick(r).toLowerCase().includes(q));
}
