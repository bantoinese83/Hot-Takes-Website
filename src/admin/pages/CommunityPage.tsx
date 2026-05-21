import { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, Copy, TrendingUp } from 'lucide-react';
import { AdminPageShell } from '../components/AdminPageShell';
import { AdminSuccessBanner } from '../components/AdminSuccessBanner';
import { AdminRefreshButton } from '../components/AdminRefreshButton';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { AdminConfirmDialog } from '../components/AdminConfirmDialog';
import {
  createPrompt,
  deletePrompt,
  fetchAllCommunityPrompts,
  fetchCommunityStats,
  setPromptActive,
  updatePrompt,
  type CommunityPromptAdmin,
  type CreatePromptInput,
} from '../../lib/adminApi';
import { asArray } from '../lib/adminFormat';

type SortKey = 'votes' | 'hot_pct' | 'velocity' | 'active';


const CATEGORY_KEYS: CreatePromptInput['category_key'][] = [
  'food_drinks',
  'pop_culture',
  'tech_ai',
  'lifestyle',
];

export function CommunityPage() {
  const [voteTotal, setVoteTotal] = useState(0);
  const [prompts, setPrompts] = useState<CommunityPromptAdmin[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('votes');

  const [newSlug, setNewSlug] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newKey, setNewKey] = useState<CreatePromptInput['category_key']>('lifestyle');
  const [newBody, setNewBody] = useState('');
  const [newSort, setNewSort] = useState(100);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stats, all] = await Promise.all([fetchCommunityStats(), fetchAllCommunityPrompts()]);
      setVoteTotal(stats.vote_total ?? 0);
      setPrompts(asArray<CommunityPromptAdmin>(all.prompts));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load community prompts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleActive = async (p: CommunityPromptAdmin) => {
    setBusy(true);
    try {
      await setPromptActive(p.slug, !p.is_active);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toggle failed');
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    if (!editSlug) return;
    setBusy(true);
    try {
      await updatePrompt(editSlug, { body: editBody, category_label: editLabel });
      setEditSlug(null);
      setSuccess('Prompt updated.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const submitCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      await createPrompt({
        slug: newSlug,
        category_label: newLabel,
        category_key: newKey,
        body: newBody,
        sort_order: newSort,
        is_active: true,
      });
      setShowCreate(false);
      setNewSlug('');
      setNewLabel('');
      setNewBody('');
      setSuccess('Prompt created.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  };

  const runDelete = async () => {
    if (!deleteSlug) return;
    setBusy(true);
    try {
      const res = await deletePrompt(deleteSlug);
      if (res.deactivated) {
        setSuccess(
          `Prompt "${deleteSlug}" has votes — deactivated instead of deleted (${res.vote_count ?? 0} votes).`,
        );
      } else {
        setSuccess(`Prompt "${deleteSlug}" deleted.`);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
      setDeleteSlug(null);
    }
  };

  const clonePrompt = async (p: CommunityPromptAdmin) => {
    setBusy(true);
    try {
      const bSlug = `${p.slug}-b-${Date.now().toString(36)}`;
      await createPrompt({
        slug: bSlug,
        category_label: p.category_label ?? 'Untitled',
        category_key: 'lifestyle',
        body: `${p.body ?? ''} (B variant)`,
        sort_order: (p.sort_order ?? 100) + 1,
        is_active: false, // Start inactive for review
      });
      setSuccess(`Cloned as "${bSlug}" (inactive). Edit and activate to run A/B test.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clone failed');
    } finally {
      setBusy(false);
    }
  };

  const sortedPrompts = useMemo(() => {
    const arr = [...prompts];
    if (sortBy === 'votes') return arr.sort((a, b) => ((b.hot_count ?? 0) + (b.cold_count ?? 0)) - ((a.hot_count ?? 0) + (a.cold_count ?? 0)));
    if (sortBy === 'hot_pct') return arr.sort((a, b) => (b.percentages?.hot ?? 0) - (a.percentages?.hot ?? 0));
    if (sortBy === 'active') return arr.sort((a, b) => (b.is_active === true ? 1 : 0) - (a.is_active === true ? 1 : 0));
    // velocity: votes per day since... we don't have created_at, so use total votes as proxy
    return arr.sort((a, b) => ((b.hot_count ?? 0) + (b.cold_count ?? 0)) - ((a.hot_count ?? 0) + (a.cold_count ?? 0)));
  }, [prompts, sortBy]);

  const topSlug = sortedPrompts.find((p) => p.is_active !== false)?.slug;

  return (
    <AdminPageShell
      title="Community votes"
      subtitle={`${voteTotal.toLocaleString()} total votes · ${prompts.length} prompts`}
      actions={
        <div className="admin-toolbar">
          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? 'Cancel create' : 'New prompt'}
          </button>
          <AdminRefreshButton onClick={() => void load()} loading={loading} />
        </div>
      }
    >
        {error ? <AdminErrorBanner message={error} /> : null}
        {success ? <AdminSuccessBanner message={success} onDismiss={() => setSuccess(null)} /> : null}

        {/* Sort controls */}
        <div className="admin-filter-row" style={{ marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>
            <TrendingUp size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Sort by:
          </span>
          {([
            { key: 'votes', label: 'Total votes' },
            { key: 'hot_pct', label: 'Hot %' },
            { key: 'active', label: 'Active first' },
          ] as { key: SortKey; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`admin-btn admin-btn--ghost${sortBy === key ? ' admin-btn--active' : ''}`}
              onClick={() => setSortBy(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {showCreate ? (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2>Create prompt</h2>
            </div>
            <div className="admin-form-stack">
              <label className="admin-field">
                <span>Slug (lowercase, unique)</span>
                <input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="e.g. dating-texting" />
              </label>
              <label className="admin-field">
                <span>Category label</span>
                <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Dating Culture" />
              </label>
              <label className="admin-field">
                <span>Category key</span>
                <select value={newKey} onChange={(e) => setNewKey(e.target.value as CreatePromptInput['category_key'])}>
                  {CATEGORY_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-field">
                <span>Body</span>
                <textarea rows={3} value={newBody} onChange={(e) => setNewBody(e.target.value)} />
              </label>
              <label className="admin-field">
                <span>Sort order</span>
                <input
                  type="number"
                  value={newSort}
                  onChange={(e) => setNewSort(Number(e.target.value) || 0)}
                />
              </label>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                style={{ width: 'auto' }}
                disabled={busy || !newSlug.trim() || !newLabel.trim() || !newBody.trim()}
                onClick={() => void submitCreate()}
              >
                Create prompt
              </button>
            </div>
          </div>
        ) : null}

        {editSlug ? (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2>Edit prompt: {editSlug}</h2>
            </div>
            <div className="admin-form-stack">
              <label className="admin-field">
                <span>Category label</span>
                <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
              </label>
              <label className="admin-field">
                <span>Body</span>
                <textarea rows={4} value={editBody} onChange={(e) => setEditBody(e.target.value)} />
              </label>
              <div className="admin-action-row">
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  style={{ width: 'auto' }}
                  disabled={busy}
                  onClick={() => void saveEdit()}
                >
                  Save
                </button>
                <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setEditSlug(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="admin-panel">
          {loading ? (
            <p className="admin-loading">Loading prompts…</p>
          ) : prompts.length === 0 ? (
            <p className="admin-empty">No community prompts.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Active</th>
                      <th>Slug</th>
                      <th>Category</th>
                      <th>Hot/Cold split</th>
                      <th>Hot %</th>
                      <th>Votes</th>
                      <th>Prompt</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPrompts.map((p) => {
                      const hot = p.percentages?.hot ?? 0;
                      const cold = p.percentages?.cold ?? 0;
                      const votes = (p.hot_count ?? 0) + (p.cold_count ?? 0);
                      const isChampion = p.slug === topSlug && votes > 0;
                      return (
                        <tr key={p.slug} className={p.is_active === false ? 'admin-row-muted' : undefined}>
                          <td>{p.is_active === false ? 'No' : 'Yes'}</td>
                          <td className="admin-mono">
                            <div title={isChampion ? "Champion" : undefined} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              {isChampion && (
                                <Award size={13} style={{ color: '#fbbf24', flexShrink: 0 }} />
                              )}
                              {p.slug}
                            </div>
                          </td>
                          <td>{p.category_label ?? '—'}</td>
                          <td style={{ minWidth: 120 }}>
                            <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', display: 'flex' }}>
                              <div
                                style={{
                                  width: `${hot}%`,
                                  background: 'var(--color-accent)',
                                  transition: 'width 0.5s ease',
                                }}
                              />
                              <div
                                style={{
                                  width: `${cold}%`,
                                  background: 'var(--color-secondary)',
                                  opacity: 0.6,
                                  transition: 'width 0.5s ease',
                                }}
                              />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                              <span style={{ color: 'var(--color-accent)' }}>{p.hot_count ?? 0} 🔥</span>
                              <span style={{ color: 'var(--color-secondary)' }}>{p.cold_count ?? 0} ❄️</span>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, color: hot >= 60 ? 'var(--color-accent)' : hot <= 40 ? 'var(--color-secondary)' : 'var(--text-primary)' }}>
                              {hot}%
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600 }}>{votes}</span>
                          </td>
                          <td style={{ maxWidth: 220 }}>{p.body ?? '—'}</td>
                          <td>
                              <div className="admin-inline-actions">
                                <button
                                  type="button"
                                  className="admin-btn admin-btn--ghost"
                                  disabled={busy}
                                  onClick={() => {
                                    setEditSlug(p.slug);
                                    setEditBody(p.body ?? '');
                                    setEditLabel(p.category_label ?? '');
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="admin-btn admin-btn--ghost"
                                  disabled={busy}
                                  title="Clone for A/B test"
                                  onClick={() => void clonePrompt(p)}
                                >
                                  <Copy size={12} />
                                </button>
                                <button
                                  type="button"
                                  className="admin-btn admin-btn--ghost"
                                  disabled={busy}
                                  onClick={() => void toggleActive(p)}
                                >
                                  {p.is_active === false ? 'Activate' : 'Deactivate'}
                                </button>
                                <button
                                  type="button"
                                  className="admin-btn admin-btn--danger"
                                  disabled={busy}
                                  onClick={() => setDeleteSlug(p.slug)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
            </div>
          )}
        </div>

      <AdminConfirmDialog
        open={Boolean(deleteSlug)}
        title={`Delete prompt "${deleteSlug}"?`}
        message="If the prompt has votes it will be deactivated only; otherwise it is removed from the catalog."
        danger
        busy={busy}
        confirmLabel="Delete"
        onCancel={() => setDeleteSlug(null)}
        onConfirm={() => void runDelete()}
      />
    </AdminPageShell>
  );
}
