import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { List, MapPin, Users, Zap } from 'lucide-react';
import { AdminPageShell } from '../components/AdminPageShell';
import { AdminRefreshButton } from '../components/AdminRefreshButton';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { AdminEmptyState } from '../components/AdminEmptyState';
import { fetchQueueSnapshot, removeFromQueue, bulkRemoveFromQueue, type QueueRow } from '../../lib/adminApi';
import { supabase } from '../../lib/supabase';
import { AdminConfirmDialog } from '../components/AdminConfirmDialog';
import { formatDurationSeconds, formatShortId } from '../lib/adminFormat';

type QueueView = 'list' | 'clusters';

type CityCluster = {
  city: string;
  users: QueueRow[];
  matchable: boolean; // 2+ users present
};

function GeoClusters({ rows }: { rows: QueueRow[] }) {
  const clusters = useMemo(() => {
    const map: Record<string, QueueRow[]> = {};
    for (const r of rows) {
      const key = r.location_label ?? 'Unknown location';
      if (!map[key]) map[key] = [];
      map[key].push(r);
    }
    return Object.entries(map)
      .map(([city, users]): CityCluster => ({ city, users, matchable: users.length >= 2 }))
      .sort((a, b) => b.users.length - a.users.length);
  }, [rows]);

  const matchable = clusters.filter((c) => c.matchable).length;
  const sparse = clusters.filter((c) => !c.matchable).length;

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        <div className="admin-panel" style={{ padding: '1rem', borderColor: 'rgba(127,226,184,0.25)', background: 'rgba(127,226,184,0.04)' }}>
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7fe2b8', margin: '0 0 0.25rem' }}>Match-ready cities</p>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: '#7fe2b8', margin: 0 }}>{matchable}</p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>2+ people waiting</p>
        </div>
        <div className="admin-panel" style={{ padding: '1rem', borderColor: 'rgba(251,191,36,0.2)', background: 'rgba(251,191,36,0.04)' }}>
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fbbf24', margin: '0 0 0.25rem' }}>Sparse cities</p>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24', margin: 0 }}>{sparse}</p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>1 person waiting</p>
        </div>
        <div className="admin-panel" style={{ padding: '1rem' }}>
          <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '0 0 0.25rem' }}>Total locations</p>
          <p style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>{clusters.length}</p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>Unique cities in queue</p>
        </div>
      </div>

      {clusters.length === 0 ? (
        <div className="admin-panel">
          <p className="admin-empty" style={{ padding: '2rem' }}>No users in queue.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {clusters.map((cluster) => (
            <div
              key={cluster.city}
              className="admin-panel"
              style={{
                padding: '1rem',
                borderColor: cluster.matchable
                  ? 'rgba(127,226,184,0.3)'
                  : 'rgba(251,191,36,0.2)',
                background: cluster.matchable
                  ? 'rgba(127,226,184,0.04)'
                  : 'rgba(251,191,36,0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={14} style={{ color: cluster.matchable ? '#7fe2b8' : '#fbbf24', flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{cluster.city}</span>
                </div>
                {cluster.matchable ? (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      padding: '0.15rem 0.45rem',
                      borderRadius: 20,
                      background: 'rgba(127,226,184,0.15)',
                      color: '#7fe2b8',
                      border: '1px solid rgba(127,226,184,0.3)',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <Zap size={9} />
                    Match possible
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      padding: '0.15rem 0.45rem',
                      borderRadius: 20,
                      background: 'rgba(251,191,36,0.1)',
                      color: '#fbbf24',
                      border: '1px solid rgba(251,191,36,0.25)',
                      fontWeight: 700,
                    }}
                  >
                    Sparse
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
                <Users size={12} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {cluster.users.length} user{cluster.users.length !== 1 ? 's' : ''} waiting
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {cluster.users.slice(0, 4).map((u) => (
                  <div key={u.user_id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: u.status === 'in_date' ? '#83cfff' : '#7fe2b8',
                        flexShrink: 0,
                      }}
                    />
                    <Link
                      to={`/admin/users/${u.user_id}`}
                      className="admin-link"
                      style={{ fontSize: '0.78rem' }}
                    >
                      {u.name ?? formatShortId(u.user_id)}
                    </Link>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {formatDurationSeconds(u.seconds_in_queue)}
                    </span>
                  </div>
                ))}
                {cluster.users.length > 4 && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                    +{cluster.users.length - 4} more
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function QueuePage() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [waitingCount, setWaitingCount] = useState(0);
  const [inDateCount, setInDateCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [kickUserId, setKickUserId] = useState<string | null>(null);
  const [kicking, setKicking] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkKickConfirm, setBulkKickConfirm] = useState(false);
  const [view, setView] = useState<QueueView>('list');

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
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

    if (!supabase) return;

    // Subscribe to any changes in the queue table
    const channel = supabase
      .channel('admin_queue_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue' },
        (payload) => {
          setLastEvent(`${payload.eventType} at ${new Date().toLocaleTimeString()}`);
          void load(true); // Silent reload on any change
        }
      )
      .subscribe();

    // Still use a slower poll for "seconds in queue" ticking and safety
    const id = window.setInterval(() => void load(true), 30_000);

    return () => {
      if (supabase) void supabase.removeChannel(channel);
      window.clearInterval(id);
    };
  }, [load]);

  return (
    <AdminPageShell
      title="Live queue"
      subtitle={`${waitingCount} waiting · ${inDateCount} in date · real-time active${lastEvent ? ` · last: ${lastEvent}` : ''}`}
      actions={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
    >
        {error ? <AdminErrorBanner message={error} /> : null}

        {/* View toggle */}
        <div className="admin-filter-row" style={{ marginBottom: '1rem' }}>
          <button
            type="button"
            className={`admin-btn admin-btn--ghost${view === 'list' ? ' admin-btn--active' : ''}`}
            onClick={() => setView('list')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <List size={14} />
            List view
          </button>
          <button
            type="button"
            className={`admin-btn admin-btn--ghost${view === 'clusters' ? ' admin-btn--active' : ''}`}
            onClick={() => setView('clusters')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <MapPin size={14} />
            City clusters
          </button>
        </div>

        {selected.size > 0 ? (
          <div className="admin-bulk-bar">
            <span>
              <strong>{selected.size}</strong> selected
            </span>
            <button type="button" className="admin-btn admin-btn--danger" disabled={kicking} onClick={() => setBulkKickConfirm(true)}>
              Remove from queue
            </button>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setSelected(new Set())}>
              Clear
            </button>
          </div>
        ) : null}

        {view === 'clusters' ? (
          loading && rows.length === 0 ? (
            <p className="admin-loading">Loading queue…</p>
          ) : (
            <GeoClusters rows={rows.filter((r) => r.status !== 'in_date')} />
          )
        ) : null}

        {view === 'list' ? (
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
                    <th style={{ width: 44 }}>
                      <input
                        type="checkbox"
                        aria-label="Select all"
                        checked={rows.length > 0 && selected.size === rows.length}
                        onChange={() => {
                          if (selected.size === rows.length) setSelected(new Set());
                          else setSelected(new Set(rows.map(r => r.user_id)));
                        }}
                      />
                    </th>
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
                    <tr key={r.user_id} className={selected.has(r.user_id) ? 'admin-row-selected' : undefined}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Select ${r.name ?? r.user_id}`}
                          checked={selected.has(r.user_id)}
                          onChange={() => {
                            setSelected(prev => {
                              const next = new Set(prev);
                              if (next.has(r.user_id)) next.delete(r.user_id);
                              else next.add(r.user_id);
                              return next;
                            });
                          }}
                        />
                      </td>
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
        ) : null}
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
      <AdminConfirmDialog
        open={bulkKickConfirm}
        title={`Remove ${selected.size} from queue?`}
        message="Users will leave the line immediately."
        danger
        busy={kicking}
        confirmLabel="Remove all"
        onCancel={() => setBulkKickConfirm(false)}
        onConfirm={() => {
          setKicking(true);
          void bulkRemoveFromQueue(Array.from(selected))
            .then(() => {
              setSelected(new Set());
              return load();
            })
            .catch((err) => setError(err instanceof Error ? err.message : 'Bulk remove failed'))
            .finally(() => {
              setKicking(false);
              setBulkKickConfirm(false);
            });
        }}
      />
    </AdminPageShell>
  );
}
