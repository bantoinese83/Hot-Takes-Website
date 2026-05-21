import { fetchApproximateCoords } from './approximateLocation';
import { parseProgressFromJoinPayload, type LaunchProgress } from './launchWaitlistProgress';
import { supabase, isSupabaseConfigured } from './supabase';

export type JoinWaitlistResult =
  | { ok: true; alreadyRegistered: boolean; email: string; progress?: LaunchProgress }
  | { ok: false; error: string };

export async function joinLaunchWaitlist(email: string): Promise<JoinWaitlistResult> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, error: 'Enter a valid email address.' };
  }

  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Waitlist is temporarily unavailable. Email us at connect@monarch-labs.com.' };
  }

  const coords = await fetchApproximateCoords();

  const { data, error } = await supabase.rpc('register_launch_waitlist', {
    p_email: trimmed,
    p_source: 'website',
    p_lat: coords?.lat ?? null,
    p_lng: coords?.lng ?? null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const row = data as { ok?: boolean; already_registered?: boolean; email?: string; error?: string } | null;
  if (!row?.ok) {
    return {
      ok: false,
      error: row?.error === 'invalid_email' ? 'Enter a valid email address.' : 'Could not join the waitlist. Try again.',
    };
  }

  const progress = parseProgressFromJoinPayload(row) ?? undefined;

  return {
    ok: true,
    alreadyRegistered: Boolean(row.already_registered),
    email: row.email ?? trimmed,
    progress,
  };
}
