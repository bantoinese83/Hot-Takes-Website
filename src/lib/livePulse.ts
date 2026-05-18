import { isSupabaseConfigured, supabase } from './supabase';

export interface LivePulseStats {
  activeDates: number;
  waitingCount: number;
  datesStartedLastHour: number;
  communityVotesTotal: number;
  asOf: string | null;
  isLive: boolean;
}

const POLL_MS = 12_000;

type PulseRow = {
  active_dates_count?: number;
  waiting_count?: number;
  dates_started_last_hour?: number;
  community_votes_total?: number;
  as_of?: string;
};

function parsePulse(data: unknown): LivePulseStats | null {
  if (!data || typeof data !== 'object') return null;
  const row = data as PulseRow;
  return {
    activeDates: Math.max(0, Number(row.active_dates_count) || 0),
    waitingCount: Math.max(0, Number(row.waiting_count) || 0),
    datesStartedLastHour: Math.max(0, Number(row.dates_started_last_hour) || 0),
    communityVotesTotal: Math.max(0, Number(row.community_votes_total) || 0),
    asOf: typeof row.as_of === 'string' ? row.as_of : null,
    isLive: true,
  };
}

/** Offline demo — clearly not wired to Supabase. */
export const DEMO_PULSE: LivePulseStats = {
  activeDates: 0,
  waitingCount: 0,
  datesStartedLastHour: 0,
  communityVotesTotal: 0,
  asOf: null,
  isLive: false,
};

export async function fetchLivePulse(): Promise<LivePulseStats> {
  if (!isSupabaseConfigured || !supabase) {
    return DEMO_PULSE;
  }

  const { data, error } = await supabase.rpc('get_public_live_pulse');
  if (error) {
    console.warn('[livePulse] fetch failed', error.message);
    return DEMO_PULSE;
  }

  return parsePulse(data) ?? DEMO_PULSE;
}

export function subscribeLivePulse(onUpdate: (stats: LivePulseStats) => void): () => void {
  let cancelled = false;

  const tick = async () => {
    const stats = await fetchLivePulse();
    if (!cancelled) onUpdate(stats);
  };

  void tick();
  const id = window.setInterval(() => void tick(), POLL_MS);

  return () => {
    cancelled = true;
    window.clearInterval(id);
  };
}

export { POLL_MS };
