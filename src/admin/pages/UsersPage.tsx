import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AdminPageShell } from '../components/AdminPageShell';
import { AdminRefreshButton } from '../components/AdminRefreshButton';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { AdminConfirmDialog } from '../components/AdminConfirmDialog';
import { AdminEmptyState } from '../components/AdminEmptyState';
import { AdminSuccessBanner } from '../components/AdminSuccessBanner';
import { useAdminAuth } from '../../lib/useAdminAuth';
import { formatShortId, tierLabel } from '../lib/adminFormat';
import {
  adminDeleteUser,
  bulkRemoveFromQueue,
  bulkUpdateProfiles,
  searchProfiles,
  type AdminProfileRow,
} from '../../lib/adminApi';

export function UsersPage() {
  const { adminInfo } = useAdminAuth();
  const isSuperadmin = Boolean(adminInfo?.is_superadmin);

  const [query, setQuery] = useState('');
  const [profiles, setProfiles] = useState<AdminProfileRow[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [bulkTier, setBulkTier] = useState('');
  const [confirm, setConfirm] = useState<'queue' | 'tier' | 'delete' | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const loadProfiles = useCallback(async (searchQuery: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchProfiles(searchQuery, 100);
      setProfiles(Array.isArray(res.profiles) ? res.profiles : []);
      setTotal(typeof res.total === 'number' ? res.total : res.profiles?.length ?? 0);
      setSearched(true);
      setSelected(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfiles('');
  }, [loadProfiles]);

  const onSearch = async (e?: FormEvent) => {
    e?.preventDefault();
    await loadProfiles(query);
  };

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === profiles.length) setSelected(new Set());
    else setSelected(new Set(profiles.map((p) => p.id)));
  };

  const runBulkQueueRemove = async () => {
    if (selectedIds.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await bulkRemoveFromQueue(selectedIds);
      setSuccess(`Removed ${res.removed} of ${res.requested} from queue.`);
      await loadProfiles(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk queue remove failed');
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const runBulkTier = async () => {
    if (selectedIds.length === 0 || !bulkTier) return;
    setBusy(true);
    setError(null);
    try {
      const res = await bulkUpdateProfiles(selectedIds, { subscription_tier: bulkTier });
      setSuccess(`Updated ${res.profiles_updated} profile(s) to ${tierLabel(bulkTier)}.`);
      await loadProfiles(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk update failed');
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const runBulkDelete = async () => {
    if (!isSuperadmin || selectedIds.length === 0) return;
    setBusy(true);
    setError(null);
    let deleted = 0;
    const failures: string[] = [];
    try {
      for (const id of selectedIds) {
        try {
          await adminDeleteUser(id);
          deleted += 1;
        } catch (err) {
          failures.push(`${formatShortId(id)}: ${err instanceof Error ? err.message : 'failed'}`);
        }
      }
      if (deleted > 0) setSuccess(`Permanently deleted ${deleted} account(s).`);
      if (failures.length > 0) setError(failures.join('; '));
      await loadProfiles(query);
    } finally {
      setBusy(false);
      setConfirm(null);
      setDeleteConfirmText('');
    }
  };

  const subtitle =
    total != null
      ? `${profiles.length} shown${total > profiles.length ? ` · ${total} matching in database` : ''}`
      : 'Search by name, user id, or referral code';

  return (
    <AdminPageShell
      title="Users"
      subtitle={subtitle}
      actions={<AdminRefreshButton onClick={() => void loadProfiles(query)} loading={loading} label="Reload" />}
    >
      <form className="admin-search-row" onSubmit={(e) => void onSearch(e)}>
        <input
          placeholder="Search name, UUID, or referral code…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search users"
        />
        <button type="submit" className="admin-btn admin-btn--primary" style={{ width: 'auto' }} disabled={loading}>
          {loading ? 'Loading…' : 'Search'}
        </button>
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          disabled={loading}
          onClick={() => {
            setQuery('');
            void loadProfiles('');
          }}
        >
          Show all
        </button>
      </form>

      {selectedIds.length > 0 ? (
        <div className="admin-bulk-bar">
          <span>
            <strong>{selectedIds.length}</strong> selected (max 100 per action)
          </span>
          <button type="button" className="admin-btn admin-btn--ghost" disabled={busy} onClick={() => setConfirm('queue')}>
            Remove from queue
          </button>
          <select value={bulkTier} onChange={(e) => setBulkTier(e.target.value)} aria-label="Bulk subscription tier">
            <option value="">Set tier…</option>
            <option value="free">Free</option>
            <option value="plus_waitlist">Plus waitlist</option>
            <option value="plus">Plus</option>
          </select>
          <button type="button" className="admin-btn admin-btn--ghost" disabled={busy || !bulkTier} onClick={() => setConfirm('tier')}>
            Apply tier
          </button>
          {isSuperadmin ? (
            <button type="button" className="admin-btn admin-btn--danger" disabled={busy} onClick={() => setConfirm('delete')}>
              Delete accounts
            </button>
          ) : null}
          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      ) : null}

      {error ? <AdminErrorBanner message={error} /> : null}
      {success ? <AdminSuccessBanner message={success} onDismiss={() => setSuccess(null)} /> : null}

      <div className="admin-panel">
        {loading ? (
          <p className="admin-loading">Loading profiles…</p>
        ) : profiles.length === 0 ? (
          <AdminEmptyState
            title={searched ? 'No matches' : 'No profiles yet'}
            description={
              searched
                ? 'Try a different search term or clear the filter.'
                : 'Profiles appear when users complete sign-up in the app.'
            }
            action={
              searched ? (
                <button type="button" className="admin-btn admin-btn--ghost" onClick={() => void loadProfiles('')}>
                  Show all users
                </button>
              ) : null
            }
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>
                    <input
                      type="checkbox"
                      aria-label="Select all on page"
                      checked={profiles.length > 0 && selected.size === profiles.length}
                      onChange={toggleAll}
                    />
                  </th>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Ready</th>
                  <th>Age</th>
                  <th>Tier</th>
                  <th>Referral</th>
                  <th>User id</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className={selected.has(p.id) ? 'admin-row-selected' : undefined}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${p.name ?? p.id}`}
                        checked={selected.has(p.id)}
                        onChange={() => toggleOne(p.id)}
                      />
                    </td>
                    <td>
                      <Link to={`/admin/users/${p.id}`} className="admin-link">
                        {p.name ?? 'Unnamed'}
                      </Link>
                    </td>
                    <td>{p.location_label ?? '—'}</td>
                    <td>{p.matching_complete ? 'Yes' : 'No'}</td>
                    <td>{p.age_affirmed ? 'Yes' : 'No'}</td>
                    <td>
                      <span className="admin-badge admin-badge--muted">{tierLabel(p.subscription_tier)}</span>
                    </td>
                    <td>{p.referral_code ?? '—'}</td>
                    <td>
                      <Link to={`/admin/users/${p.id}`} className="admin-link admin-mono">
                        {formatShortId(p.id)}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminConfirmDialog
        open={confirm === 'queue'}
        title={`Remove ${selectedIds.length} from queue?`}
        message="They stop matchmaking immediately. Check Live queue if anyone is mid-date."
        danger
        busy={busy}
        confirmLabel="Remove from queue"
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runBulkQueueRemove()}
      />
      <AdminConfirmDialog
        open={confirm === 'tier'}
        title={`Set tier to ${tierLabel(bulkTier)}?`}
        message={`Updates subscription tier for ${selectedIds.length} user(s).`}
        busy={busy}
        confirmLabel="Apply"
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runBulkTier()}
      />
      <AdminConfirmDialog
        open={confirm === 'delete'}
        title={`Delete ${selectedIds.length} account(s)?`}
        message={
          <>
            <p>Permanent erasure of profile, queue, dates, interactions, auth, and storage. Type DELETE to confirm.</p>
            <input
              className="admin-confirm-input"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              aria-label="Type DELETE to confirm"
            />
          </>
        }
        danger
        busy={busy}
        confirmLabel="Delete permanently"
        onCancel={() => {
          setConfirm(null);
          setDeleteConfirmText('');
        }}
        onConfirm={() => void runBulkDelete()}
        confirmDisabled={deleteConfirmText !== 'DELETE'}
      />
    </AdminPageShell>
  );
}
