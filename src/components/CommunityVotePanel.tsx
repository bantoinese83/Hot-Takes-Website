import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Flame, RefreshCw, Snowflake } from 'lucide-react';
import {
  castCommunityVote,
  fetchCommunityPrompts,
  FALLBACK_PROMPTS,
  type CommunityTakePromptUI,
  type CommunityVote,
} from '../lib/communityTakes';
import { applyLocalVoteShift } from '../lib/voteLocal';
import { isSupabaseConfigured } from '../lib/supabase';
import { ShineBorder } from '@/components/magicui/shine-border';
import { useAnimatedPercent } from '../hooks/useAnimatedPercent';
import { Reveal } from './Reveal';

const VOTES_STORAGE_KEY = 'ht_community_votes';
const ROTATE_MS = 8000;

function loadStoredVotes(): Record<string, CommunityVote> {
  try {
    const raw = localStorage.getItem(VOTES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CommunityVote>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveStoredVotes(votes: Record<string, CommunityVote>) {
  try {
    localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(votes));
  } catch {
    /* quota */
  }
}

function AnimatedResults({ hot, cold, userVote }: { hot: number; cold: number; userVote: CommunityVote }) {
  const hotDisplay = useAnimatedPercent(hot, true);
  const coldDisplay = useAnimatedPercent(cold, true);

  return (
    <div className="vote-results vote-results--animated">
      <div className="results-bar-container" role="img" aria-label={`${hot}% hot, ${cold}% cold`}>
        <div className="results-bar-hot" style={{ width: `${hotDisplay}%` }}>
          <span>Hot {hotDisplay}%</span>
        </div>
        <div className="results-bar-cold">
          <span>Cold {coldDisplay}%</span>
        </div>
      </div>
      <p className="results-explanation">
        You voted <strong>{userVote === 'hot' ? 'Hot' : 'Cold'}</strong>. Takes like this inform taste-based pairing in
        the app.
      </p>
    </div>
  );
}

export function CommunityVotePanel() {
  const [prompts, setPrompts] = useState<CommunityTakePromptUI[]>(FALLBACK_PROMPTS);
  const [activeTabId, setActiveTabId] = useState(FALLBACK_PROMPTS[0].id);
  const [votedIds, setVotedIds] = useState<Record<string, CommunityVote>>(() => loadStoredVotes());
  const [isVoting, setIsVoting] = useState(false);
  const [cardKey, setCardKey] = useState(0);

  const refreshPrompts = useCallback(async () => {
    const rows = await fetchCommunityPrompts();
    setPrompts(rows);
    if (rows.length > 0 && !rows.some((r) => r.id === activeTabId)) {
      setActiveTabId(rows[0].id);
    }
  }, [activeTabId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshPrompts();
  }, [refreshPrompts]);

  const activeHotTake = prompts.find((item) => item.id === activeTabId) ?? prompts[0];
  const userVote = votedIds[activeTabId];
  const activeIndex = prompts.findIndex((p) => p.id === activeTabId);

  const goToIndex = useCallback(
    (index: number) => {
      const next = prompts[index];
      if (!next) return;
      setActiveTabId(next.id);
      setCardKey((k) => k + 1);
    },
    [prompts],
  );

  const goNext = useCallback(() => {
    if (prompts.length === 0) return;
    goToIndex((activeIndex + 1) % prompts.length);
  }, [activeIndex, goToIndex, prompts.length]);

  const goPrev = useCallback(() => {
    if (prompts.length === 0) return;
    goToIndex((activeIndex - 1 + prompts.length) % prompts.length);
  }, [activeIndex, goToIndex, prompts.length]);

  useEffect(() => {
    if (userVote || prompts.length < 2) return;

    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      goNext();
    }, ROTATE_MS);

    return () => clearInterval(id);
  }, [userVote, goNext, prompts.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev]);

  const handleVote = async (vote: CommunityVote) => {
    if (isVoting) return;
    setIsVoting(true);
    const nextVotes = { ...votedIds, [activeTabId]: vote };
    setVotedIds(nextVotes);
    saveStoredVotes(nextVotes);

    if (isSupabaseConfigured) {
      const updated = await castCommunityVote(activeTabId, vote);
      if (updated) {
        setPrompts((prev) =>
          prev.map((row) => (row.id === updated.id ? { ...row, hot: updated.hot, cold: updated.cold } : row)),
        );
      }
    } else {
      setPrompts((prev) =>
        prev.map((row) => (row.id === activeTabId ? applyLocalVoteShift(row, vote) : row)),
      );
    }

    setCardKey((k) => k + 1);
    setIsVoting(false);
  };

  const handleResetVote = () => {
    setVotedIds((prev) => {
      const updated = { ...prev };
      delete updated[activeTabId];
      saveStoredVotes(updated);
      return updated;
    });
    void refreshPrompts();
    setCardKey((k) => k + 1);
  };

  return (
    <section className="previewer-section" id="previewer">
      <div className="container">
        <Reveal>
          <div className="section-header">
            <span className="section-label">Try it</span>
            <h2 className="section-title">Vote on a community Take</h2>
            <p className="section-lead">
              Same prompts as in the app.{' '}
              {isSupabaseConfigured ? (
                <span className="live-stats-badge">Totals update live</span>
              ) : null}
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={80}>
          <div className="previewer-controls">
            <button type="button" className="previewer-nav-btn" onClick={goPrev} aria-label="Previous take">
              <ChevronLeft size={20} />
            </button>

            <div className="previewer-tabs" role="tablist" aria-label="Take categories">
              {prompts.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTabId === item.id}
                  onClick={() => goToIndex(index)}
                  className={`previewer-tab ${activeTabId === item.id ? 'active' : ''}`}
                >
                  {item.category}
                </button>
              ))}
            </div>

            <button type="button" className="previewer-nav-btn" onClick={goNext} aria-label="Next take">
              <ChevronRight size={20} />
            </button>
          </div>
        </Reveal>

        <Reveal delayMs={140}>
          <div className="previewer-card-container">
            <article key={cardKey} className="previewer-card glass-card previewer-card--enter relative overflow-hidden">
              <ShineBorder shineColor="#ff544e" duration={12} borderWidth={1} />
              <span className="previewer-category">{activeHotTake.category}</span>
              <p className="previewer-hottake">&ldquo;{activeHotTake.question}&rdquo;</p>

              {!userVote ? (
                <div className="previewer-actions">
                  <button
                    type="button"
                    onClick={() => void handleVote('hot')}
                    className="previewer-vote-btn btn-hot"
                    disabled={isVoting}
                  >
                    <Flame size={18} /> Hot
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleVote('cold')}
                    className="previewer-vote-btn btn-cold"
                    disabled={isVoting}
                  >
                    <Snowflake size={18} /> Cold
                  </button>
                </div>
              ) : (
                <>
                  <AnimatedResults hot={activeHotTake.hot} cold={activeHotTake.cold} userVote={userVote} />
                  <button type="button" onClick={handleResetVote} className="btn-reset-preview">
                    <RefreshCw size={12} /> Change vote
                  </button>
                </>
              )}
            </article>
            <p className="previewer-hint">Use arrow keys or wait — takes rotate automatically.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
