import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey)
  : null;

const VOTER_STORAGE_KEY = 'ht_community_voter_id';

/** Stable anonymous id for web Hot/Cold votes (required when not signed in). */
export function getOrCreateVoterKey(): string {
  try {
    const existing = localStorage.getItem(VOTER_STORAGE_KEY);
    if (existing && existing.length > 8) {
      return existing;
    }
    const created = crypto.randomUUID();
    localStorage.setItem(VOTER_STORAGE_KEY, created);
    return created;
  } catch {
    return `web_${Date.now()}`;
  }
}
