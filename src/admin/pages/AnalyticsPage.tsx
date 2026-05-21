import { useEffect } from 'react';
import { AdminPageShell } from '../components/AdminPageShell';
import { AdminRefreshButton } from '../components/AdminRefreshButton';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { AdminStatCard } from '../components/AdminStatCard';
import { DailyFunnelBarChart } from '../components/DailyFunnelBarChart';
import { FunnelAreaChart } from '../components/FunnelAreaChart';
import { SimpleBarChart } from '../components/SimpleBarChart';
import { useAdminAnalytics } from '../hooks/useAdminAnalytics';
import { formatWaitMs } from '../../lib/adminApi';
import { CHART_COLORS } from '../components/AdminChartTheme';
import { supabase } from '../../lib/supabase';

export function AnalyticsPage() {
  const { hub, error, degraded, loading, reload } = useAdminAnalytics(45_000);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('admin_analytics_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue' }, () => void reload(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dates' }, () => void reload(true))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'moderation_reports' }, () => void reload(true))
      .subscribe();

    return () => {
      if (supabase) void supabase.removeChannel(channel);
    };
  }, [reload]);

  const o = hub?.overview;
  const wait = hub?.wait_time_24h;
  const ix = hub?.interactions;

  return (
    <AdminPageShell
      title="Analytics"
      subtitle="Funnel, engagement, wait times, and safety breakdowns"
      actions={<AdminRefreshButton onClick={() => void reload()} loading={loading} />}
    >
        {error ? <AdminErrorBanner message={error} degraded={degraded} /> : null}
        {loading && !hub ? <p className="admin-loading">Loading analytics…</p> : null}
        {hub && o ? (
          <>
            <div className="admin-stat-grid">
              <AdminStatCard label="Wait p50 (24h)" value={formatWaitMs(wait?.p50_ms ?? null)} sub={`n=${wait?.sample_count_24h ?? 0}`} />
              <AdminStatCard label="Wait p90" value={formatWaitMs(wait?.p90_ms ?? null)} />
              <AdminStatCard label="Mutual matches (7d)" value={ix?.mutual_match_7d ?? 0} />
              <AdminStatCard label="Match / pass (24h)" value={`${ix?.match_24h ?? 0} / ${ix?.pass_24h ?? 0}`} />
              <AdminStatCard label="Dates started (24h)" value={hub.dates?.started_24h ?? 0} sub={`${hub.dates?.completed_7d ?? 0} completed (7d)`} />
              <AdminStatCard label="Referred users" value={hub.referrals?.referred_profiles ?? 0} sub={`${hub.referrals?.referrals_30d ?? 0} completed (30d)`} />
              <AdminStatCard label="Push sent (24h)" value={o.push_sent_24h ?? 0} />
              <AdminStatCard label="With location" value={o.profiles_with_location ?? 0} sub={`of ${o.profiles_matching_complete} ready`} />
            </div>

            <div className="admin-grid-2">
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <h2>7-day funnel</h2>
                </div>
                <DailyFunnelBarChart data={hub.daily_funnel_7d ?? []} />
              </div>
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <h2>Hourly funnel (24h)</h2>
                </div>
                <FunnelAreaChart data={hub.hourly_funnel_24h ?? []} />
              </div>
            </div>

            <div className="admin-grid-2">
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <h2>Reports by reason (30d)</h2>
                </div>
                <SimpleBarChart
                  data={(hub.reports_by_reason_30d ?? []).map((r) => ({ label: r.reason, count: r.count }))}
                  layout="vertical"
                  color={CHART_COLORS.join}
                />
              </div>
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <h2>Hot take categories</h2>
                </div>
                <SimpleBarChart
                  data={(hub.hot_take_categories ?? []).map((c) => ({ label: c.category, count: c.count }))}
                  color={CHART_COLORS.paired}
                />
              </div>
            </div>

            <div className="admin-grid-2">
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <h2>Push notifications (24h)</h2>
                </div>
                <SimpleBarChart
                  data={(hub.push_24h ?? []).map((p) => ({ label: p.kind, count: p.count }))}
                  color={CHART_COLORS.secondary}
                />
              </div>
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <h2>Top referral codes</h2>
                </div>
                {(hub.referrals?.top_codes ?? []).length === 0 ? (
                  <p className="admin-empty">No referral attributions yet.</p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Referrals</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hub.referrals.top_codes.map((r) => (
                          <tr key={r.code}>
                            <td>{r.code}</td>
                            <td>{r.referrals}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
    </AdminPageShell>
  );
}
