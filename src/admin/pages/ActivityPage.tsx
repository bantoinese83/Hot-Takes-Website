import { useCallback, useEffect, useState } from 'react';
import { AdminPageShell } from '../components/AdminPageShell';
import { AdminRefreshButton } from '../components/AdminRefreshButton';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { ActivityFeedTable } from '../components/ActivityFeedTable';
import { fetchActivityLog, type ActivityFeedItem } from '../../lib/adminApi';

export function ActivityPage() {
  const [items, setItems] = useState<ActivityFeedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const PAGE_SIZE = 50;

  const load = useCallback(async (offset = 0) => {
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);
    
    setError(null);
    try {
      const res = await fetchActivityLog(PAGE_SIZE, offset);
      if (offset === 0) {
        setItems(res.items);
      } else {
        setItems((prev) => [...prev, ...res.items]);
      }
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void load(0);
  }, [load]);

  const onLoadMore = async () => {
    if (loading || loadingMore) return;
    await load(items.length);
  };

  return (
    <AdminPageShell
      title="Activity log"
      subtitle="Pairing events, reports, dates, and push notifications"
      actions={<AdminRefreshButton onClick={() => void load(0)} loading={loading} />}
    >
        {error ? <AdminErrorBanner message={error} /> : null}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2>System-wide events</h2>
            {total > 0 && <span className="admin-badge admin-badge--muted">{total.toLocaleString()} total</span>}
          </div>
          {loading && items.length === 0 ? (
            <p className="admin-loading">Loading activity…</p>
          ) : (
            <>
              <ActivityFeedTable items={items} />
              {items.length < total && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    disabled={loadingMore}
                    onClick={() => void onLoadMore()}
                  >
                    {loadingMore ? 'Loading more…' : `Load more (${total - items.length} remaining)`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        <p className="admin-footnote">
          Supabase Edge Function logs are not in this feed — use the Supabase dashboard for matchmaker / APNs traces.
          This log is database-backed: pairing_events, interactions (reports), dates, push_notifications.
        </p>
    </AdminPageShell>
  );
}
