import { getOrCreateVoterKey, isSupabaseConfigured, supabase } from './supabase';

export type CommunityVote = 'hot' | 'cold';

export interface CommunityTakePrompt {
  slug: string;
  category_label: string;
  category_key: string;
  body: string;
  hot_count: number;
  cold_count: number;
  percentages: { hot: number; cold: number };
}

export interface CommunityTakePromptUI {
  id: string;
  category: string;
  question: string;
  hot: number;
  cold: number;
}

import { FALLBACK_PROMPTS } from './communityTakeFallback';

export { FALLBACK_PROMPTS };

function toUI(row: CommunityTakePrompt): CommunityTakePromptUI {
  return {
    id: row.slug,
    category: row.category_label,
    question: row.body,
    hot: row.percentages.hot,
    cold: row.percentages.cold,
  };
}

export async function fetchCommunityPrompts(): Promise<CommunityTakePromptUI[]> {
  if (!isSupabaseConfigured || !supabase) {
    return FALLBACK_PROMPTS;
  }

  const { data, error } = await supabase.rpc('get_community_take_prompts');
  if (error) {
    console.warn('[communityTakes] fetch failed', error.message);
    return FALLBACK_PROMPTS;
  }

  const rows = (data ?? []) as CommunityTakePrompt[];
  if (!Array.isArray(rows) || rows.length === 0) {
    return FALLBACK_PROMPTS;
  }

  return rows.map(toUI);
}

export async function castCommunityVote(
  slug: string,
  vote: CommunityVote,
): Promise<CommunityTakePromptUI | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const voterKey = getOrCreateVoterKey();
  const { data, error } = await supabase.rpc('cast_community_take_vote', {
    p_prompt_slug: slug,
    p_vote: vote,
    p_source: 'web',
    p_voter_key: voterKey,
  });

  if (error) {
    console.warn('[communityTakes] vote failed', error.message);
    return null;
  }

  const payload = data as {
    ok?: boolean;
    slug?: string;
    percentages?: { hot: number; cold: number };
    hot_count?: number;
    cold_count?: number;
  };

  if (!payload?.ok || !payload.slug || !payload.percentages) {
    return null;
  }

  const { data: rows } = await supabase.rpc('get_community_take_prompts');
  const match = (rows as CommunityTakePrompt[] | null)?.find((r) => r.slug === payload.slug);
  const fallback = FALLBACK_PROMPTS.find((p) => p.id === payload.slug);
  return {
    id: payload.slug,
    category: match?.category_label ?? fallback?.category ?? payload.slug,
    question: match?.body ?? fallback?.question ?? '',
    hot: payload.percentages.hot,
    cold: payload.percentages.cold,
  };
}
