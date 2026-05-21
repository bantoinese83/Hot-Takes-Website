import { AdminPageShell } from '../components/AdminPageShell';
import { AdminRefreshButton } from '../components/AdminRefreshButton';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { ActivityFeedTable } from '../components/ActivityFeedTable';
import { useAdminAnalytics } from '../hooks/useAdminAnalytics';

export function ActivityPage() {
  const { hub, error, degraded, loading, reload } = useAdminAnalytics(20_000);

  return (
    <AdminPageShell
      title="Activity log"
      subtitle="Pairing events, reports, dates, and push notifications (last 48h)"
      actions={<AdminRefreshButton onClick={() => void reload()} loading={loading} />}
    >
        {error ? <AdminErrorBanner message={error} degraded={degraded} /> : null}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2>Recent events</h2>
            <span className="admin-badge admin-badge--muted">auto-refresh 20s</span>
          </div>
          {loading && !hub ? (
            <p className="admin-loading">Loading activity…</p>
          ) : (
            <ActivityFeedTable items={hub?.activity_feed ?? []} />
          )}
        </div>
        <p className="admin-footnote">
          Supabase Edge Function logs are not in this feed — use the Supabase dashboard for matchmaker / APNs traces.
          This log is database-backed: pairing_events, interactions (reports), dates, push_notifications.
        </p>
    </AdminPageShell>
  );
}
