import { AdminPageShell } from '../components/AdminPageShell';
import { AdminRefreshButton } from '../components/AdminRefreshButton';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { DailyFunnelBarChart } from '../components/DailyFunnelBarChart';
import { FunnelAreaChart } from '../components/FunnelAreaChart';
import { useAdminAnalytics } from '../hooks/useAdminAnalytics';

export function PairingPage() {
  const { hub, error, degraded, loading, reload } = useAdminAnalytics(45_000);

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
