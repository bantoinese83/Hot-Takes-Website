import { useCallback, useEffect, useState } from 'react';
import {
  fetchAdminAnalyticsHub,
  fetchDashboardOverview,
  type AdminAnalyticsHub,
  type DashboardOverview,
} from '../../lib/adminApi';

function emptyHub(overview: DashboardOverview): AdminAnalyticsHub {
  return {
    as_of: overview.as_of,
    overview,
    daily_funnel_7d: [],
    hourly_funnel_24h: [],
    wait_time_24h: {
      sample_count_24h: 0,
      p50_ms: null,
      p90_ms: null,
      p95_ms: null,
      avg_ms: null,
    },
    interactions: { match_24h: 0, pass_24h: 0, report_24h: 0, mutual_match_7d: 0 },
    reports_by_reason_30d: [],
    location_labels: [],
    geo_grid: [],
    push_24h: [],
    referrals: { referred_profiles: 0, referrals_30d: 0, top_codes: [] },
    dates: {
      active_now: overview.active_dates_count,
      started_24h: 0,
      completed_7d: 0,
      cancelled_7d: 0,
    },
    hot_take_categories: [],
    activity_feed: [],
  };
}

export function useAdminAnalytics(refreshMs = 30_000) {
  const [hub, setHub] = useState<AdminAnalyticsHub | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    setDegraded(false);
    try {
      setHub(await fetchAdminAnalyticsHub());
    } catch (hubErr) {
      const hubMessage = hubErr instanceof Error ? hubErr.message : 'Failed to load analytics hub';
      try {
        const overview = await fetchDashboardOverview();
        setHub(emptyHub(overview));
        setDegraded(true);
        setError(`Full analytics unavailable — showing overview metrics only. (${hubMessage})`);
      } catch (overviewErr) {
        const overviewMessage =
          overviewErr instanceof Error ? overviewErr.message : 'Failed to load overview';
        setHub(null);
        setError(`${hubMessage}. Overview fallback also failed: ${overviewMessage}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    if (refreshMs <= 0) return;
    const id = window.setInterval(() => void load(), refreshMs);
    return () => window.clearInterval(id);
  }, [load, refreshMs]);

  return { hub, error, degraded, loading, reload: load };
}
