import { Link } from 'react-router-dom';
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

export function DashboardPage() {
  const { hub, error, degraded, loading, reload } = useAdminAnalytics(30_000);
  const { overview } = useAdminOps();
  const data = hub?.overview ?? overview ?? null;

  const needsAttention =
    (data?.reports_24h ?? 0) > 0 ||
    (data?.waiting_count ?? 0) > 8 ||
    (data?.leave_before_pair_pct_24h ?? 0) > 40;

  return (
    <AdminPageShell
      title="Overview"
      subtitle={data?.as_of ? `Snapshot as of ${formatDateTime(data.as_of)}` : 'Live ops snapshot'}
      actions={<AdminRefreshButton onClick={() => void reload()} loading={loading} />}
    >
      {error ? <AdminErrorBanner message={error} degraded={degraded} /> : null}

      {needsAttention && data ? (
        <div className="admin-hint-card" role="note">
          <strong>Needs attention:</strong>{' '}
          {(data.reports_24h ?? 0) > 0 && (
            <>
              {data.reports_24h} report{data.reports_24h === 1 ? '' : 's'} in 24h —{' '}
              <Link to="/admin/moderation">review moderation</Link>
              .{' '}
            </>
          )}
          {(data.waiting_count ?? 0) > 8 && (
            <>
              {data.waiting_count} users waiting — <Link to="/admin/queue">check queue</Link>.{' '}
            </>
          )}
          {(data.leave_before_pair_pct_24h ?? 0) > 40 && (
            <>High leave-before-pair rate ({data.leave_before_pair_pct_24h}%) — see pairing funnel.</>
          )}
        </div>
      ) : null}

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
            <AdminStatCard label="Wait p50 (24h)" value={formatWaitMs(hub?.wait_time_24h?.p50_ms)} />
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
        </>
      ) : null}
    </AdminPageShell>
  );
}
