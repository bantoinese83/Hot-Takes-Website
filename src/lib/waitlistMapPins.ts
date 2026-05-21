import type { Marker } from '@/components/magicui/dotted-map';
import { supabase, isSupabaseConfigured } from './supabase';

export type WaitlistMapPin = Marker & {
  count: number;
};

type RawPin = {
  lat?: number;
  lng?: number;
  count?: number;
};

function parsePins(data: unknown): WaitlistMapPin[] {
  if (!Array.isArray(data)) return [];
  const out: WaitlistMapPin[] = [];
  for (const row of data) {
    if (!row || typeof row !== 'object') continue;
    const p = row as RawPin;
    const lat = Number(p.lat);
    const lng = Number(p.lng);
    const count = Math.max(1, Number(p.count) || 1);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const size = Math.min(0.62, 0.34 + Math.log2(count + 1) * 0.08);
    out.push({
      lat,
      lng,
      count,
      size,
      pulse: count >= 2,
    });
  }
  return out;
}

export async function fetchWaitlistMapPins(): Promise<WaitlistMapPin[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.rpc('get_launch_waitlist_map_pins');
  if (error) throw error;
  return parsePins(data);
}

export function totalFromPins(pins: WaitlistMapPin[]): number {
  return pins.reduce((sum, p) => sum + p.count, 0);
}

export function subscribeWaitlistMapPins(
  onUpdate: (pins: WaitlistMapPin[]) => void,
  onError?: (message: string) => void,
): () => void {
  let cancelled = false;
  let channel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;

  const pull = async () => {
    try {
      const pins = await fetchWaitlistMapPins();
      if (!cancelled) onUpdate(pins);
    } catch (e) {
      if (!cancelled) onError?.(e instanceof Error ? e.message : 'Could not load waitlist map');
    }
  };

  void pull();
  const pollId = window.setInterval(() => void pull(), 15_000);

  if (isSupabaseConfigured && supabase) {
    channel = supabase
      .channel('launch-waitlist-geo')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'launch_waitlist_geo_buckets' },
        () => void pull(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'launch_waitlist_public_stats' },
        () => void pull(),
      )
      .subscribe();
  }

  return () => {
    cancelled = true;
    window.clearInterval(pollId);
    if (channel && supabase) void supabase.removeChannel(channel);
  };
}
