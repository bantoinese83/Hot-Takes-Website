import { useCallback, useEffect, useState } from 'react';
import { AdminPageShell } from '../components/AdminPageShell';
import { AdminRefreshButton } from '../components/AdminRefreshButton';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { Link } from 'react-router-dom';
import { fetchGrowthSnapshot, removeFromLineWaitlist, updateAdminProfile, type LineWaitlistRow, type PlusWaitlistRow } from '../../lib/adminApi';
import { formatShortId } from '../lib/adminFormat';

export function GrowthPage() {
  const [line, setLine] = useState<LineWaitlistRow[]>([]);
  const [plus, setPlus] = useState<PlusWaitlistRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchGrowthSnapshot();
      setLine(Array.isArray(res.line_waitlist) ? res.line_waitlist : []);
      setPlus(Array.isArray(res.plus_waitlist) ? res.plus_waitlist : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load growth data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminPageShell
      title="Growth & waitlists"
      subtitle={`${line.length} line notify · ${plus.length} Plus interest`}
      actions={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
    >
        {error ? <AdminErrorBanner message={error} /> : null}
        <div className="admin-grid-2">
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2>Line live notifications</h2>
            </div>
            {loading ? (
              <p className="admin-loading">Loading…</p>
            ) : line.length === 0 ? (
              <p className="admin-empty">No one on the line waitlist.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Location</th>
                      <th>Joined</th>
                      <th>Last notified</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {line.map((r) => (
                      <tr key={r.user_id}>
                        <td>
                          <Link to={`/admin/users/${r.user_id}`} className="admin-link">
                            {r.name ?? formatShortId(r.user_id)}
                          </Link>
                        </td>
                        <td>{r.location_label ?? '—'}</td>
                        <td>{new Date(r.created_at).toLocaleString()}</td>
                        <td>{r.last_notified_at ? new Date(r.last_notified_at).toLocaleString() : '—'}</td>
                        <td>
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost"
                            disabled={busy}
                            onClick={() => {
                              setBusy(true);
                              void removeFromLineWaitlist(r.user_id)
                                .then(() => load())
                                .catch((err) => setError(err instanceof Error ? err.message : 'Remove failed'))
                                .finally(() => setBusy(false));
                            }}
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
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2>Plus waitlist</h2>
            </div>
            {loading ? (
              <p className="admin-loading">Loading…</p>
            ) : plus.length === 0 ? (
              <p className="admin-empty">No Plus waitlist signups yet.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Location</th>
                      <th>Joined</th>
                      <th>Tier</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {plus.map((r) => (
                      <tr key={r.user_id}>
                        <td>
                          <Link to={`/admin/users/${r.user_id}`} className="admin-link">
                            {r.name ?? formatShortId(r.user_id)}
                          </Link>
                        </td>
                        <td>{r.location_label ?? '—'}</td>
                        <td>{r.plus_waitlisted_at ? new Date(r.plus_waitlisted_at).toLocaleString() : '—'}</td>
                        <td>{r.subscription_tier ?? 'plus_waitlist'}</td>
                        <td>
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost"
                            disabled={busy}
                            onClick={() => {
                              setBusy(true);
                              void updateAdminProfile(r.user_id, { subscription_tier: 'free' })
                                .then(() => load())
                                .catch((err) => setError(err instanceof Error ? err.message : 'Update failed'))
                                .finally(() => setBusy(false));
                            }}
                          >
                            Clear Plus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
    </AdminPageShell>
  );
}
