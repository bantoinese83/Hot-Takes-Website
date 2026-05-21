import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Flame, Radio, Video } from 'lucide-react';
import { AdminPageShell } from '../components/AdminPageShell';
import { AdminRefreshButton } from '../components/AdminRefreshButton';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { AdminStatCard } from '../components/AdminStatCard';
import {
  fetchDateQualitySnapshot,
  formatWaitMs,
  type DateQualitySnapshot,
} from '../../lib/adminApi';
import { formatDateTime, formatShortId } from '../lib/adminFormat';

function DurationHistogram({ buckets }: { buckets: { label: string; count: number }[] }) {
  const max = Math.max(...buckets.map((b) => b.count), 1);
  const colors = ['#f87171', '#fbbf24', '#83cfff', '#a78bfa', '#7fe2b8'];
  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', height: 120 }}>
        {buckets.map((b, i) => {
          const height = Math.max(8, (b.count / max) * 108);
          return (
            <div key={b.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{b.count}</span>
              <div
                style={{
                  width: '100%',
                  height,
                  background: colors[i % colors.length],
                  borderRadius: '4px 4px 0 0',
                  opacity: b.count === 0 ? 0.2 : 1,
                  transition: 'height 0.5s ease',
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
        {buckets.map((b, i) => (
          <div key={b.label} style={{ flex: 1, textAlign: 'center', fontSize: '0.65rem', color: colors[i % colors.length] }}>
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function OutcomeDonut({ completed, active, total }: { completed: number; active: number; total: number }) {
  const other = Math.max(0, total - completed - active);
  const segs = [
    { label: 'Completed', count: completed, color: '#7fe2b8' },
    { label: 'Active now', count: active, color: '#83cfff' },
    { label: 'Other', count: other, color: 'rgba(255,255,255,0.1)' },
  ].filter((s) => s.count > 0);

  const r = 50;
  const circ = 2 * Math.PI * r;
  let off = 0;
  const segments = segs.map((s) => {
    const dash = total > 0 ? (s.count / total) * circ : 0;
    const seg = { ...s, dash, gap: circ - dash, offset: off };
    off += dash;
    return seg;
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1rem' }}>
      <svg width={120} height={120} viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
        {total === 0 ? (
          <circle cx={60} cy={60} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={14} />
        ) : (
          segments.map((s) => (
            <circle
              key={s.label}
              cx={60}
              cy={60}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={14}
              strokeDasharray={`${s.dash} ${s.gap}`}
              strokeDashoffset={-s.offset + circ * 0.25}
            />
          ))
        )}
        <text x={60} y={56} textAnchor="middle" fill="var(--text-primary)" fontSize={20} fontWeight={800}>{total}</text>
        <text x={60} y={72} textAnchor="middle" fill="var(--text-muted)" fontSize={10}>dates today</text>
      </svg>
      <div style={{ flex: 1 }}>
        {segs.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flex: 1 }}>{s.label}</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: s.color }}>{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DateQualityPage() {
  const [snapshot, setSnapshot] = useState<DateQualitySnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDateQualitySnapshot();
      setSnapshot(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load date quality data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Auto-refresh active dates every 30s
  useEffect(() => {
    const id = setInterval(() => void load(), 30_000);
    return () => clearInterval(id);
  }, [load]);

  const stats = snapshot?.stats;

  return (
    <AdminPageShell
      title="Date Quality Monitor"
      subtitle="Session outcomes, duration analytics, and live dates · auto-refreshes every 30s"
      actions={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
    >
      {error ? <AdminErrorBanner message={error} /> : null}
      {loading && !snapshot ? <p className="admin-loading">Loading date quality data…</p> : null}

      {stats ? (
        <>
          <div className="admin-stat-grid">
            <AdminStatCard
              label="Dates today"
              value={stats.total_today}
              sub="Last 24h"
            />
            <AdminStatCard
              label="Avg duration"
              value={stats.avg_duration_ms != null ? formatWaitMs(stats.avg_duration_ms) : '—'}
              sub="Completed dates"
            />
            <AdminStatCard
              label="Completion rate"
              value={stats.completion_rate != null ? `${stats.completion_rate}%` : '—'}
              sub="Ended vs started"
              highlight={(stats.completion_rate ?? 0) >= 60}
            />
            <AdminStatCard
              label="Live now"
              value={snapshot?.active_now.length ?? 0}
              sub="Active sessions"
              highlight={(snapshot?.active_now.length ?? 0) > 0}
            />
          </div>

          <div className="admin-grid-2" style={{ marginTop: '1.5rem' }}>
            {/* Duration histogram */}
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} style={{ color: 'var(--color-secondary)' }} />
                  Duration distribution
                </h2>
                <span className="admin-panel-meta">Completed dates</span>
              </div>
              {stats.duration_buckets.every((b) => b.count === 0) ? (
                <p className="admin-empty" style={{ padding: '2rem' }}>No completed dates in the last 24h.</p>
              ) : (
                <DurationHistogram buckets={stats.duration_buckets} />
              )}
            </div>

            {/* Outcome donut */}
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Flame size={16} style={{ color: 'var(--color-accent)' }} />
                  Outcome breakdown
                </h2>
                <span className="admin-panel-meta">Last 24h</span>
              </div>
              <OutcomeDonut
                completed={snapshot?.recent_completed.length ?? 0}
                active={snapshot?.active_now.length ?? 0}
                total={stats.total_today}
              />
            </div>
          </div>

          {/* Live dates */}
          {snapshot && snapshot.active_now.length > 0 && (
            <div className="admin-panel" style={{ marginTop: '1.5rem' }}>
              <div className="admin-panel-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Radio size={16} style={{ color: '#f87171' }} className="admin-spin" />
                  Live dates
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#f87171',
                      marginLeft: '0.25rem',
                      animation: 'admin-pulse 1.5s ease-in-out infinite',
                    }}
                  />
                </h2>
                <span className="admin-panel-meta">{snapshot.active_now.length} active now</span>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User A</th>
                      <th>User B</th>
                      <th>Room</th>
                      <th>Started</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.active_now.map((d) => {
                      const startedMs = d.started_at ? Date.now() - new Date(d.started_at).getTime() : null;
                      return (
                        <tr key={d.id}>
                          <td>
                            <Link to={`/admin/users/${d.user1_id}`} className="admin-link">
                              {formatShortId(d.user1_id)}
                            </Link>
                          </td>
                          <td>
                            <Link to={`/admin/users/${d.user2_id}`} className="admin-link">
                              {formatShortId(d.user2_id)}
                            </Link>
                          </td>
                          <td>
                            <span className="admin-mono" style={{ fontSize: '0.75rem' }}>
                              {d.livekit_room_name ?? '—'}
                            </span>
                          </td>
                          <td>{d.started_at ? formatDateTime(d.started_at) : '—'}</td>
                          <td>
                            <span style={{ color: '#83cfff', fontWeight: 600 }}>
                              {startedMs != null ? formatWaitMs(startedMs) : '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent completed */}
          {snapshot && snapshot.recent_completed.length > 0 && (
            <div className="admin-panel" style={{ marginTop: '1.5rem' }}>
              <div className="admin-panel-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Video size={16} style={{ color: 'var(--text-muted)' }} />
                  Recent sessions
                </h2>
                <span className="admin-panel-meta">Last 24h · up to 50</span>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table admin-table--compact">
                  <thead>
                    <tr>
                      <th>User A</th>
                      <th>User B</th>
                      <th>Status</th>
                      <th>Duration</th>
                      <th>Ended at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.recent_completed.map((d) => {
                      const durMs =
                        d.started_at && d.ended_at
                          ? new Date(d.ended_at).getTime() - new Date(d.started_at).getTime()
                          : null;
                      return (
                        <tr key={d.id}>
                          <td>
                            <Link to={`/admin/users/${d.user1_id}`} className="admin-link">
                              {formatShortId(d.user1_id)}
                            </Link>
                          </td>
                          <td>
                            <Link to={`/admin/users/${d.user2_id}`} className="admin-link">
                              {formatShortId(d.user2_id)}
                            </Link>
                          </td>
                          <td>
                            <span
                              className={`admin-badge${d.status === 'completed' ? '' : ' admin-badge--muted'}`}
                            >
                              {d.status ?? 'ended'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>
                            {formatWaitMs(durMs)}
                          </td>
                          <td className="admin-panel-meta">
                            {d.ended_at ? formatDateTime(d.ended_at) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </AdminPageShell>
  );
}
