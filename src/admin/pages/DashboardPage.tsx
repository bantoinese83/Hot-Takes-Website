import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { AlertTriangle, Flame, TrendingUp } from 'lucide-react';
import { AdminPageShell } from '../components/AdminPageShell';
import { AdminStatCard } from '../components/AdminStatCard';
import { AdminRefreshButton } from '../components/AdminRefreshButton';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { ActivityFeedTable } from '../components/ActivityFeedTable';
import { FunnelAreaChart } from '../components/FunnelAreaChart';
import { useAdminAnalytics } from '../hooks/useAdminAnalytics';
import { useAdminOps } from '../hooks/useAdminOps';
import { formatWaitMs } from '../../lib/adminApi';
import { formatDateTime } from '../lib/adminFormat';
import { supabase } from '../../lib/supabase';

export function DashboardPage() {
  const { hub, error, degraded, loading, reload } = useAdminAnalytics(60_000);
  const { overview } = useAdminOps();
  const data = hub?.overview ?? overview ?? null;

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('admin_dashboard_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue' }, () => void reload(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dates' }, () => void reload(true))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'moderation_reports' }, () => void reload(true))
      .subscribe();

    return () => {
      if (supabase) void supabase.removeChannel(channel);
    };
  }, [reload]);

  const p90Wait = hub?.wait_time_24h?.p90_ms ?? 0;
  const leaveRate = data?.leave_before_pair_pct_24h ?? 0;
  const reports24h = data?.reports_24h ?? 0;

  const alerts = [
    {
      show: p90Wait > 300_000,
      icon: AlertTriangle,
      level: 'danger',
      text: `High p90 wait time: ${formatWaitMs(p90Wait)}. Users are waiting too long.`,
      link: '/admin/queue',
    },
    {
      show: leaveRate > 45,
      icon: TrendingUp,
      level: 'warn',
      text: `High leave rate: ${leaveRate}% of users leaving before matching.`,
      link: '/admin/pairing',
    },
    {
      show: reports24h > 15,
      icon: AlertTriangle,
      level: 'danger',
      text: `${reports24h} reports in 24h. Possible spike in bad actors.`,
      link: '/admin/moderation',
    },
  ].filter((a) => a.show);

  return (
    <AdminPageShell
      title="Overview"
      subtitle={data?.as_of ? `Snapshot as of ${formatDateTime(data.as_of)}` : 'Live ops snapshot'}
      actions={<AdminRefreshButton onClick={() => void reload()} loading={loading} />}
    >
      {error ? <AdminErrorBanner message={error} degraded={degraded} /> : null}

      {alerts.length > 0 && (
        <div className="admin-form-stack" style={{ gap: '0.65rem', marginBottom: '0.5rem' }}>
          {alerts.map((a, i) => (
            <div
              key={i}
              className={`admin-banner ${a.level === 'danger' ? 'admin-banner--error' : 'admin-banner--warn'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
            >
              <a.icon size={18} />
              <div style={{ flex: 1 }}>
                <strong>{a.level === 'danger' ? 'CRITICAL:' : 'NOTICE:'}</strong> {a.text}
              </div>
              <Link to={a.link} className="admin-btn admin-btn--ghost admin-btn--compact">
                Investigate
              </Link>
            </div>
          ))}
        </div>
      )}

      {loading && !data ? <p className="admin-loading">Loading metrics…</p> : null}

      {data ? (
        <>
          <div className="admin-stat-grid">
            <AdminStatCard label="In line (active)" value={data.waiting_count} />
            <AdminStatCard label="Live dates" value={data.active_dates_count} />
            <AdminStatCard
              label="Reports (24h)"
              value={data.reports_24h}
              sub={`${data.reports_total} open total`}
              highlight={data.reports_24h > 0}
            />
            <AdminStatCard
              label="Join → paired (24h)"
              value={data.conversion_pct_24h != null ? `${data.conversion_pct_24h}%` : '—'}
              sub={`${data.paired_24h} paired / ${data.queue_joins_24h} joins`}
            />
            <AdminStatCard
              label="Leave before pair"
              value={data.leave_before_pair_pct_24h != null ? `${data.leave_before_pair_pct_24h}%` : '—'}
              sub={`${data.queue_leaves_24h ?? 0} leaves (24h)`}
              highlight={(data.leave_before_pair_pct_24h ?? 0) > 40}
            />
            <AdminStatCard
              label="Profiles ready"
              value={data.profiles_matching_complete}
              sub={`${data.profiles_total ?? '—'} total`}
            />
            <AdminStatCard label="Match threads" value={data.match_threads_count ?? 0} />
            <AdminStatCard label="Mutual matches (7d)" value={hub?.interactions?.mutual_match_7d ?? '—'} />
            <AdminStatCard
              label="Wait p50 (24h)"
              value={formatWaitMs(hub?.wait_time_24h?.p50_ms)}
              highlight={(hub?.wait_time_24h?.p50_ms ?? 0) > 120_000}
            />
            <AdminStatCard label="Line waitlist" value={data.line_waitlist_count} />
            <AdminStatCard label="Plus waitlist" value={data.plus_waitlist_count} />
            <AdminStatCard label="Push (24h)" value={data.push_sent_24h ?? 0} />
          </div>

          <div className="admin-grid-2">
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h2>Hourly funnel</h2>
                <Link to="/admin/pairing" className="admin-link">
                  Details →
                </Link>
              </div>
              <FunnelAreaChart data={hub?.hourly_funnel_24h ?? []} height={240} />
            </div>
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h2>Recent activity</h2>
                <Link to="/admin/activity" className="admin-link">
                  Full log →
                </Link>
              </div>
              <ActivityFeedTable items={hub?.activity_feed ?? []} limit={12} />
            </div>
          </div>

          <div className="admin-grid-2">
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Flame size={18} style={{ color: '#ff544e' }} />
                  Hot Takes performance
                </h2>
                <Link to="/admin/community" className="admin-link">
                  Manage →
                </Link>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table admin-table--compact">
                  <thead>
                    <tr>
                      <th>Slug</th>
                      <th>Hot / Cold</th>
                      <th>Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(hub?.top_prompts ?? []).map((p) => {
                      const total = p.hot_count + p.cold_count;
                      const hotPct = total > 0 ? Math.round((p.hot_count / total) * 100) : 0;
                      return (
                        <tr key={p.slug}>
                          <td className="admin-mono" style={{ fontSize: '0.72rem' }}>{p.slug}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', minWidth: 60 }}>
                                <div style={{ height: '100%', width: `${hotPct}%`, background: '#ff544e' }} />
                              </div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{hotPct}%</span>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{total} votes</td>
                        </tr>
                      );
                    })}
                    {(hub?.top_prompts ?? []).length === 0 && (
                      <tr>
                        <td colSpan={3} className="admin-empty">No prompt data available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="admin-panel">
              <div className="admin-panel-header">
                <h2>Ops shortcuts</h2>
              </div>
              <div className="admin-shortcuts">
                <Link to="/admin/moderation">
                  Moderation{data.reports_total > 0 ? ` (${data.reports_total})` : ''}
                </Link>
                <Link to="/admin/queue">Live queue{data.waiting_count > 0 ? ` (${data.waiting_count})` : ''}</Link>
                <Link to="/admin/users">Users</Link>
                <Link to="/admin/geography">Geography</Link>
                <Link to="/admin/growth">Waitlists</Link>
                <Link to="/admin/analytics">Analytics</Link>
                <Link to="/admin/community">Community prompts</Link>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </AdminPageShell>
  );
}
