import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminPageShell } from '../components/AdminPageShell';
import { AdminRefreshButton } from '../components/AdminRefreshButton';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { AdminEmptyState } from '../components/AdminEmptyState';
import { fetchQueueSnapshot, removeFromQueue, type QueueRow } from '../../lib/adminApi';
import { AdminConfirmDialog } from '../components/AdminConfirmDialog';
import { formatDurationSeconds, formatShortId } from '../lib/adminFormat';

export function QueuePage() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [waitingCount, setWaitingCount] = useState(0);
  const [inDateCount, setInDateCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [kickUserId, setKickUserId] = useState<string | null>(null);
  const [kicking, setKicking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchQueueSnapshot();
      setRows(Array.isArray(res.rows) ? res.rows : []);
      setWaitingCount(res.waiting_count ?? 0);
      setInDateCount(res.in_date_count ?? 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <AdminPageShell
      title="Live queue"
      subtitle={`${waitingCount} waiting · ${inDateCount} in date · refreshes every 15s`}
      actions={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
    >
        {error ? <AdminErrorBanner message={error} /> : null}
        <div className="admin-panel">
          {loading && rows.length === 0 ? (
            <p className="admin-loading">Loading queue…</p>
          ) : rows.length === 0 ? (
            <AdminEmptyState title="Queue is empty" description="No one is waiting for a match right now." />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Prefs</th>
                    <th>In queue</th>
                    <th>Last seen</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.user_id}>
                      <td>
                        <span className={r.status === 'in_date' ? 'admin-badge' : 'admin-badge admin-badge--muted'}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <Link to={`/admin/users/${r.user_id}`} className="admin-link">
                          {r.name ?? formatShortId(r.user_id)}
                        </Link>
                      </td>
                      <td>{r.location_label ?? '—'}</td>
                      <td>{r.matching_complete ? 'Yes' : 'No'}</td>
                      <td>{formatDurationSeconds(r.seconds_in_queue)}</td>
                      <td>{r.last_seen_at ? new Date(r.last_seen_at).toLocaleString() : '—'}</td>
                      <td>
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                          onClick={() => setKickUserId(r.user_id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      <AdminConfirmDialog
        open={Boolean(kickUserId)}
        title="Remove from queue?"
        message="User will leave the line immediately."
        danger
        busy={kicking}
        confirmLabel="Remove"
        onCancel={() => setKickUserId(null)}
        onConfirm={() => {
          if (!kickUserId) return;
          setKicking(true);
          void removeFromQueue(kickUserId)
            .then(() => load())
            .catch((err) => setError(err instanceof Error ? err.message : 'Remove failed'))
            .finally(() => {
              setKicking(false);
              setKickUserId(null);
            });
        }}
      />
    </AdminPageShell>
  );
}
