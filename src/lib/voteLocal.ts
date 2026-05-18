import type { CommunityTakePromptUI, CommunityVote } from './communityTakes';

/** Shift displayed percentages when Supabase is offline — keeps the preview interactive. */
export function applyLocalVoteShift(
  prompt: CommunityTakePromptUI,
  vote: CommunityVote,
): CommunityTakePromptUI {
  const delta = 4;
  let hot = prompt.hot + (vote === 'hot' ? delta : -delta);
  hot = Math.min(96, Math.max(4, hot));
  return { ...prompt, hot, cold: 100 - hot };
}
