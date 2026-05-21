import { AdminPageShell } from '../components/AdminPageShell';
import { AdminRefreshButton } from '../components/AdminRefreshButton';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { AdminStatCard } from '../components/AdminStatCard';
import { DailyFunnelBarChart } from '../components/DailyFunnelBarChart';
import { FunnelAreaChart } from '../components/FunnelAreaChart';
import { useAdminAnalytics } from '../hooks/useAdminAnalytics';
import { formatWaitMs } from '../../lib/adminApi';

export function PairingPage() {
  const { hub, error, degraded, loading, reload } = useAdminAnalytics(45_000);

  const wait = hub?.wait_time_24h;

  return (
    <AdminPageShell
      title="Pairing funnel"
      subtitle="Hourly and daily queue joins, leaves, and pairs"
      actions={<AdminRefreshButton onClick={() => void reload()} loading={loading} />}
    >
        {error ? <AdminErrorBanner message={error} degraded={degraded} /> : null}
        {loading && !hub ? (
          <p className="admin-loading">Loading funnel…</p>
        ) : (
          <>
            <div className="admin-panel" style={{ marginBottom: '1.25rem' }}>
              <div className="admin-panel-header">
                <h2>Wait times (24h)</h2>
              </div>
              <div className="admin-stat-grid" style={{ padding: '1rem' }}>
                <AdminStatCard 
                  label="Average wait" 
                  value={formatWaitMs(wait?.avg_ms)} 
                />
                <AdminStatCard 
                  label="p50 (median)" 
                  value={formatWaitMs(wait?.p50_ms)} 
                  highlight={(wait?.p50_ms ?? 0) > 120_000}
                />
                <AdminStatCard 
                  label="p90 (tail)" 
                  value={formatWaitMs(wait?.p90_ms)} 
                  highlight={(wait?.p90_ms ?? 0) > 300_000}
                />
                <AdminStatCard 
                  label="p95 (max tail)" 
                  value={formatWaitMs(wait?.p95_ms)} 
                />
              </div>
            </div>

            <div className="admin-grid-2">
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <h2>Hourly (24h)</h2>
                </div>
                <FunnelAreaChart data={hub?.hourly_funnel_24h ?? []} />
              </div>
              <div className="admin-panel">
                <div className="admin-panel-header">
                  <h2>Daily (7d)</h2>
                </div>
                <DailyFunnelBarChart data={hub?.daily_funnel_7d ?? []} />
              </div>
            </div>
            <div className="admin-panel">
              {(hub?.hourly_funnel_24h?.length ?? 0) === 0 ? (
                <p className="admin-empty">No pairing events in the last 24 hours.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Hour (local)</th>
                        <th>Joins</th>
                        <th>Leaves</th>
                        <th>Paired</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(hub?.hourly_funnel_24h ?? []).map((b) => (
                        <tr key={b.hour}>
                          <td>{new Date(b.hour).toLocaleString()}</td>
                          <td>{b.queue_joins}</td>
                          <td>{b.queue_leaves}</td>
                          <td>{b.paired}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
    </AdminPageShell>
  );
}
