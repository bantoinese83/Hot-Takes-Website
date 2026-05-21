import {
  fetchAdminAnalyticsHub,
  fetchAdminGeographySnapshot,
  fetchGrowthSnapshot,
  fetchModerationReports,
  fetchQueueSnapshot,
  fetchAllCommunityPrompts,
  type AdminAnalyticsHub,
} from '../../lib/adminApi';

const MAX_JSON_CHARS = 14_000;

function trimJson(obj: unknown): string {
  const s = JSON.stringify(obj, null, 0);
  if (s.length <= MAX_JSON_CHARS) return s;
  return `${s.slice(0, MAX_JSON_CHARS)}\n…[truncated for context window]`;
}

export type IntelContextBundle = {
  loadedAt: string;
  analytics?: AdminAnalyticsHub;
  moderation?: { total: number; open: number; reports: unknown[] };
  queue?: unknown;
  growth?: unknown;
  geography?: unknown;
  community?: unknown;
};

export async function loadIntelContext(scope: IntelContextScope): Promise<string> {
  const bundle: IntelContextBundle = { loadedAt: new Date().toISOString() };

  try {
    if (scope === 'full' || scope === 'ops' || scope === 'growth') {
      bundle.analytics = await fetchAdminAnalyticsHub();
    }
    if (scope === 'full' || scope === 'moderation') {
      const mod = await fetchModerationReports(40, 0, 'open');
      const open = mod.reports.filter((r) => (r.report_ops_status ?? 'open') === 'open');
      bundle.moderation = {
        total: mod.total,
        open: open.length,
        reports: open.slice(0, 25).map((r) => ({
          id: r.id,
          at: r.created_at,
          reason: r.report_reason,
          note: r.report_note?.slice(0, 200),
          reporter: r.reporter_name,
          reported: r.reported_name,
          status: r.report_ops_status,
        })),
      };
    }
    if (scope === 'full' || scope === 'queue') {
      bundle.queue = await fetchQueueSnapshot();
    }
    if (scope === 'full' || scope === 'growth') {
      bundle.growth = await fetchGrowthSnapshot();
    }
    if (scope === 'full' || scope === 'geo') {
      const geo = await fetchAdminGeographySnapshot();
      bundle.geography = {
        as_of: geo.as_of,
        summary: geo.summary,
        top_labels: geo.location_labels.slice(0, 15),
        regions: geo.regions.slice(0, 12),
        top_buckets: geo.buckets.slice(0, 20),
        queue_on_map: geo.queue_points.length,
      };
    }
    if (scope === 'full' || scope === 'community') {
      const { prompts } = await fetchAllCommunityPrompts();
      bundle.community = {
        prompt_count: prompts.length,
        active: prompts.filter((p) => p.is_active).length,
        samples: prompts.slice(0, 12).map((p) => ({
          slug: p.slug,
          category: p.category_label,
          body: p.body?.slice(0, 120),
          hot: p.hot_count,
          cold: p.cold_count,
        })),
      };
    }
  } catch (e) {
    bundle.analytics = undefined;
    return trimJson({
      error: e instanceof Error ? e.message : 'Failed to load admin data',
      partial: bundle,
    });
  }

  return trimJson(bundle);
}

export type IntelContextScope = 'full' | 'ops' | 'moderation' | 'queue' | 'growth' | 'geo' | 'community';
