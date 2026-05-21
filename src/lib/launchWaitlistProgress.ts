import { supabase, isSupabaseConfigured } from './supabase';

export type LaunchProgress = {
  signupCount: number;
  waitlistGoal: number;
  remaining: number;
  percent: number;
  unlocked: boolean;
  headline: string;
  asOf: string;
  releasedAt: string | null;
};

const DEFAULT_GOAL = Number(import.meta.env.VITE_WAITLIST_GOAL) || 500;

function parseProgress(data: unknown): LaunchProgress | null {
  if (!data || typeof data !== 'object') return null;
  const row = data as Record<string, unknown>;
  const goal = Number(row.waitlist_goal);
  const count = Number(row.signup_count);
  if (!Number.isFinite(goal) || goal < 1 || !Number.isFinite(count)) return null;
  return {
    signupCount: Math.max(0, Math.floor(count)),
    waitlistGoal: Math.floor(goal),
    remaining: Math.max(0, Number(row.remaining) || 0),
    percent: Math.min(100, Number(row.percent) || 0),
    unlocked: Boolean(row.unlocked),
    headline: typeof row.headline === 'string' ? row.headline : 'Unlock Hot Take on iOS',
    asOf: typeof row.as_of === 'string' ? row.as_of : new Date().toISOString(),
    releasedAt: typeof row.released_at === 'string' ? row.released_at : null,
  };
}

export function demoLaunchProgress(): LaunchProgress {
  return {
    signupCount: 0,
    waitlistGoal: DEFAULT_GOAL,
    remaining: DEFAULT_GOAL,
    percent: 0,
    unlocked: false,
    headline: 'Unlock Hot Take on iOS',
    asOf: new Date().toISOString(),
    releasedAt: null,
  };
}

export async function fetchLaunchWaitlistProgress(): Promise<LaunchProgress> {
  if (!isSupabaseConfigured || !supabase) {
    return demoLaunchProgress();
  }

  const { data, error } = await supabase.rpc('get_launch_waitlist_progress');
  if (error) throw error;
  return parseProgress(data) ?? demoLaunchProgress();
}

export function subscribeLaunchWaitlistProgress(
  onUpdate: (progress: LaunchProgress) => void,
  onError?: (message: string) => void,
): () => void {
  let cancelled = false;
  let channel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;

  const pull = async () => {
    try {
      const next = await fetchLaunchWaitlistProgress();
      if (!cancelled) onUpdate(next);
    } catch (e) {
      if (!cancelled) onError?.(e instanceof Error ? e.message : 'Could not load waitlist progress');
    }
  };

  void pull();

  const pollId = window.setInterval(() => void pull(), 12_000);

  if (isSupabaseConfigured && supabase) {
    channel = supabase
      .channel('launch-waitlist-stats')
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

export function parseProgressFromJoinPayload(data: unknown): LaunchProgress | null {
  if (!data || typeof data !== 'object') return null;
  const row = data as { progress?: unknown };
  return parseProgress(row.progress);
}
