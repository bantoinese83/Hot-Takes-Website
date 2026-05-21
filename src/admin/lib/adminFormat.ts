/** Shared display helpers for ops console tables. */

export function formatShortId(id: string | null | undefined, chars = 8): string {
  if (!id) return '—';
  return id.length <= chars ? id : `${id.slice(0, chars)}…`;
}

export function formatReportReason(reason: string | null | undefined): string {
  if (!reason) return '—';
  return reason.replace(/_/g, ' ');
}

export function formatDurationSeconds(sec: number | null | undefined): string {
  if (sec == null || sec < 0) return '—';
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const sec = Math.round((Date.now() - d.getTime()) / 1000);
  if (sec < 10) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return formatDateTime(iso);
}

export function tierLabel(tier: string | null | undefined): string {
  if (!tier || tier === 'free') return 'Free';
  if (tier === 'plus_waitlist') return 'Plus waitlist';
  if (tier === 'plus') return 'Plus';
  return tier;
}

/** PostgREST sometimes returns jsonb arrays as strings; normalize to array. */
export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}
