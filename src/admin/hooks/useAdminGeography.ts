import { useCallback, useEffect, useState } from 'react';
import {
  fetchAdminGeographySnapshot,
  geographySnapshotFromHub,
  type AdminGeographySnapshot,
} from '../../lib/adminApi';
import { useAdminAnalytics } from './useAdminAnalytics';

export function useAdminGeography(pollMs = 60_000) {
  const { hub, error: hubError, degraded, reload: reloadHub } = useAdminAnalytics(pollMs);
  const [snapshot, setSnapshot] = useState<AdminGeographySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingHubFallback, setUsingHubFallback] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await fetchAdminGeographySnapshot();
      setSnapshot(snap);
      setUsingHubFallback(false);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load geography';
      if (hub) {
        setSnapshot(geographySnapshotFromHub(hub));
        setUsingHubFallback(true);
        setError(`${msg} — showing cached analytics hub data.`);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [hub]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!hub || !usingHubFallback) return;
    setSnapshot(geographySnapshotFromHub(hub));
  }, [hub, usingHubFallback]);

  const refreshAll = useCallback(async () => {
    await reloadHub();
    await reload();
  }, [reload, reloadHub]);

  return {
    snapshot,
    hub,
    error: error ?? hubError,
    degraded,
    loading,
    usingHubFallback,
    reload: refreshAll,
  };
}
