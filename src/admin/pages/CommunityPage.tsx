import { useCallback, useEffect, useState } from 'react';
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
                    <th>Hot %</th>
                    <th>Votes</th>
                    <th>Prompt</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prompts.map((p) => {
                    const hot = p.percentages?.hot ?? 0;
                    const votes = (p.hot_count ?? 0) + (p.cold_count ?? 0);
                    return (
                      <tr key={p.slug} className={p.is_active === false ? 'admin-row-muted' : undefined}>
                        <td>{p.is_active === false ? 'No' : 'Yes'}</td>
                        <td className="admin-mono">{p.slug}</td>
                        <td>{p.category_label ?? '—'}</td>
                        <td>{hot}%</td>
                        <td>{votes}</td>
                        <td style={{ maxWidth: 280 }}>{p.body ?? '—'}</td>
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
