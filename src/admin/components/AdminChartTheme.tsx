/** Shared Recharts styling for dark ops console. */
export const CHART_COLORS = {
  accent: '#ff544e',
  secondary: '#83cfff',
  muted: '#6b7280',
  join: '#ff8a84',
  leave: '#9ca3af',
  paired: '#83cfff',
  sample: '#a78bfa',
  grid: 'rgba(255,255,255,0.06)',
  axis: '#9ca3af',
} as const;

export const chartMargin = { top: 8, right: 12, left: 0, bottom: 0 } as const;

export function formatHourTick(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatDayTick(day: string) {
  const d = new Date(day);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
