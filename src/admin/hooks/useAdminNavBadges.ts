import { useEffect, useState } from 'react';
import { fetchDashboardOverview } from '../../lib/adminApi';

export type AdminNavBadges = {
  waiting: number;
  reports: number;
};

export function useAdminNavBadges() {
  const [badges, setBadges] = useState<AdminNavBadges>({ waiting: 0, reports: 0 });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const o = await fetchDashboardOverview();
        if (!mounted) return;
        setBadges({ waiting: o.waiting_count ?? 0, reports: o.reports_total ?? 0 });
      } catch {
        /* sidebar badges are best-effort */
      }
    };
    void load();
    const id = window.setInterval(() => void load(), 60_000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  return badges;
}
