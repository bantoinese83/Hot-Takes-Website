import { useCallback, useEffect, useState } from 'react';
import { fetchDashboardOverview, type DashboardOverview } from '../../lib/adminApi';

export type AdminOpsSnapshot = {
  overview: DashboardOverview | null;
  loading: boolean;
  error: string | null;
  refreshedAt: Date | null;
  reload: () => Promise<void>;
};

/** Lightweight live ops pulse for nav badges, context bar, and headers. */
export function useAdminOpsSnapshot(pollMs = 45_000): AdminOpsSnapshot {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  const reload = useCallback(async () => {
    try {
      const o = await fetchDashboardOverview();
      setOverview(o);
      setRefreshedAt(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ops snapshot');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    if (pollMs <= 0) return;
    const id = window.setInterval(() => void reload(), pollMs);
    return () => window.clearInterval(id);
  }, [reload, pollMs]);

  return { overview, loading, error, refreshedAt, reload };
}
