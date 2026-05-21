import { supabase, isSupabaseConfigured } from './supabase';

export type AdminSessionInfo = {
  is_admin: boolean;
  is_superadmin?: boolean;
  email?: string;
  role?: string;
};

export type DashboardOverview = {
  as_of: string;
  waiting_count: number;
  active_dates_count: number;
  reports_24h: number;
  reports_total: number;
  queue_joins_24h: number;
  queue_leaves_24h?: number;
  paired_24h: number;
  waiting_samples_24h?: number;
  conversion_pct_24h: number | null;
  leave_before_pair_pct_24h?: number | null;
  profiles_matching_complete: number;
  profiles_total?: number;
  profiles_with_location?: number;
  age_affirmed_count?: number;
  plus_waitlist_count: number;
  line_waitlist_count: number;
  push_sent_24h?: number;
  match_threads_count?: number;
};

export type DailyFunnelBucket = {
  day: string;
  queue_joins: number;
  queue_leaves: number;
  paired: number;
  waiting_samples: number;
};

export type WaitTimeStats = {
  sample_count_24h: number | null;
  p50_ms: number | null;
  p90_ms: number | null;
  p95_ms: number | null;
  avg_ms: number | null;
};

export type InteractionStats = {
  match_24h: number;
  pass_24h: number;
  report_24h: number;
  mutual_match_7d: number;
};

export type GeoGridCell = {
  lat_bucket: number;
  lng_bucket: number;
  count: number;
};

export type LocationLabelRow = {
  label: string;
  count: number;
  pct_of_located_ready?: number | null;
};

export type GeographyRegionRow = {
  region: string;
  count: number;
};

export type GeographyQueuePoint = {
  user_id: string;
  name: string | null;
  location_label: string | null;
  lat: number;
  lng: number;
  status: string;
  entered_at: string;
};

export type GeographyBucketRow = GeoGridCell & {
  sample_labels?: string[] | null;
};

export type AdminGeographySummary = {
  profiles_total: number;
  profiles_with_coords: number;
  matching_ready: number;
  matching_ready_with_coords: number;
  coverage_pct: number;
  bucket_count_ready: number;
  bucket_count_all: number;
  queue_on_map: number;
};

export type AdminGeographySnapshot = {
  as_of: string;
  summary: AdminGeographySummary;
  geo_grid_all: GeoGridCell[];
  geo_grid_ready: GeoGridCell[];
  location_labels: LocationLabelRow[];
  regions: GeographyRegionRow[];
  queue_points: GeographyQueuePoint[];
  buckets: GeographyBucketRow[];
};

export function geoCellKey(lat: number, lng: number): string {
  return `${lat.toFixed(1)}:${lng.toFixed(1)}`;
}

export type ActivityFeedItem = {
  at: string;
  kind: string;
  user_id: string | null;
  partner_user_id: string | null;
  wait_ms: number | null;
  detail: string | null;
};

export type AdminAnalyticsHub = {
  as_of: string;
  overview: DashboardOverview;
  daily_funnel_7d: DailyFunnelBucket[];
  hourly_funnel_24h: PairingHourBucket[];
  wait_time_24h: WaitTimeStats;
  interactions: InteractionStats;
  reports_by_reason_30d: { reason: string; count: number }[];
  location_labels: LocationLabelRow[];
  geo_grid: GeoGridCell[];
  push_24h: { kind: string; count: number }[];
  referrals: {
    referred_profiles: number;
    referrals_30d: number;
    top_codes: { code: string; referrals: number }[];
  };
  dates: {
    active_now: number;
    started_24h: number;
    completed_7d: number;
    cancelled_7d: number;
  };
  hot_take_categories: { category: string; count: number }[];
  activity_feed: ActivityFeedItem[];
};

export type ReportOpsStatus = 'open' | 'reviewed' | 'dismissed' | 'actioned';

export type ModerationReport = {
  id: string;
  created_at: string;
  reporter_id: string;
  reported_user_id: string;
  report_reason: string | null;
  report_note: string | null;
  report_source: string | null;
  date_id: string | null;
  reporter_name: string | null;
  reported_name: string | null;
  report_ops_status?: ReportOpsStatus;
  report_ops_note?: string | null;
  report_reviewed_at?: string | null;
};

export type AdminProfileDetail = {
  id: string;
  name: string | null;
  hot_take: string | null;
  hot_take_category: string | null;
  location_label: string | null;
  latitude: number | null;
  longitude: number | null;
  subscription_tier: string;
  referral_code: string | null;
  referred_by_user_id: string | null;
  notify_line_live: boolean;
  keep_matching_when_away: boolean;
  matching_profile_completed_at: string | null;
  age_affirmed_at: string | null;
  plus_waitlisted_at: string | null;
  admin_ops_note: string | null;
  in_queue: boolean;
  queue_status: string | null;
  on_line_waitlist: boolean;
};

export type WebsiteAdminRow = {
  id: string;
  email: string;
  role: string;
  auth_user_id: string | null;
  created_at: string;
  last_seen_at: string | null;
};

export type CommunityPromptAdmin = {
  slug: string;
  category_label?: string;
  body?: string;
  hot_count?: number;
  cold_count?: number;
  sort_order?: number;
  is_active?: boolean;
  percentages?: { hot: number; cold: number };
};

export type AdminProfileRow = {
  id: string;
  name: string | null;
  location_label?: string | null;
  matching_complete: boolean;
  age_affirmed: boolean;
  subscription_tier: string | null;
  referral_code: string | null;
  notify_line_live: boolean;
  keep_matching_when_away: boolean;
};

export type QueueRow = {
  user_id: string;
  status: string;
  created_at: string;
  entered_at?: string | null;
  last_seen_at: string | null;
  name: string | null;
  location_label?: string | null;
  matching_complete: boolean;
  seconds_in_queue?: number;
};

export type LineWaitlistRow = {
  user_id: string;
  created_at: string;
  last_notified_at: string | null;
  name: string | null;
  location_label: string | null;
  notify_line_live: boolean;
};

export type PlusWaitlistRow = {
  user_id: string;
  name: string | null;
  plus_waitlisted_at: string | null;
  subscription_tier: string | null;
  location_label: string | null;
};

export type PairingHourBucket = {
  hour: string;
  queue_joins: number;
  queue_leaves: number;
  paired: number;
};

function requireClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  return supabase;
}

export async function adminLinkSession(): Promise<AdminSessionInfo> {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_link_session');
  if (error) throw error;
  const info = data as AdminSessionInfo;
  if (info.is_admin) {
    const { data: superFlag } = await client.rpc('admin_is_superadmin');
    info.is_superadmin = superFlag === true;
  }
  return info;
}

export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_dashboard_overview');
  if (error) throw error;
  return data as DashboardOverview;
}

export async function fetchModerationReports(limit = 50, offset = 0, status?: ReportOpsStatus | '') {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_list_moderation_reports', {
    p_limit: limit,
    p_offset: offset,
    p_status: status || null,
  });
  if (error) throw error;
  const payload = data as { total: number; reports: ModerationReport[] };
  return payload;
}

export async function fetchAdminProfile(userId: string) {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_get_profile', { p_user_id: userId });
  if (error) throw error;
  return data as AdminProfileDetail;
}

export type AdminProfileUpdate = {
  subscription_tier?: string;
  notify_line_live?: boolean;
  keep_matching_when_away?: boolean;
  admin_ops_note?: string | null;
  reset_age_affirmation?: boolean;
  reset_matching_complete?: boolean;
};

export async function updateAdminProfile(userId: string, patch: AdminProfileUpdate) {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_update_profile', {
    p_user_id: userId,
    p_subscription_tier: patch.subscription_tier ?? null,
    p_notify_line_live: patch.notify_line_live ?? null,
    p_keep_matching_when_away: patch.keep_matching_when_away ?? null,
    p_admin_ops_note: patch.admin_ops_note ?? null,
    p_reset_age_affirmation: patch.reset_age_affirmation ?? false,
    p_reset_matching_complete: patch.reset_matching_complete ?? false,
  });
  if (error) throw error;
  return data as AdminProfileDetail;
}

export async function resolveReport(reportId: string, status: ReportOpsStatus, opsNote?: string) {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_resolve_report', {
    p_report_id: reportId,
    p_status: status,
    p_ops_note: opsNote ?? null,
  });
  if (error) throw error;
  return data as { ok: boolean };
}

export async function removeFromQueue(userId: string) {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_queue_remove', { p_user_id: userId });
  if (error) throw error;
  return data as { ok: boolean; removed: boolean };
}

export async function removeFromLineWaitlist(userId: string) {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_line_waitlist_remove', { p_user_id: userId });
  if (error) throw error;
  return data as { ok: boolean; removed: boolean };
}

export async function addUserBlock(blockerId: string, blockedId: string) {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_add_user_block', {
    p_blocker_id: blockerId,
    p_blocked_id: blockedId,
  });
  if (error) throw error;
  return data as { ok: boolean };
}

export async function setPromptActive(slug: string, isActive: boolean) {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_set_prompt_active', {
    p_slug: slug,
    p_is_active: isActive,
  });
  if (error) throw error;
  return data as { ok: boolean };
}

export async function updatePrompt(
  slug: string,
  patch: { body?: string; category_label?: string; sort_order?: number },
) {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_update_prompt', {
    p_slug: slug,
    p_body: patch.body ?? null,
    p_category_label: patch.category_label ?? null,
    p_sort_order: patch.sort_order ?? null,
  });
  if (error) throw error;
  return data;
}

export async function listWebsiteAdmins() {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_list_website_admins');
  if (error) throw error;
  return data as { admins: WebsiteAdminRow[] };
}

export async function addWebsiteAdmin(email: string, role: 'admin' | 'superadmin' = 'admin') {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_add_website_admin', {
    p_email: email,
    p_role: role,
  });
  if (error) throw error;
  return data as WebsiteAdminRow;
}

export async function removeWebsiteAdmin(email: string) {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_remove_website_admin', { p_email: email });
  if (error) throw error;
  return data as { ok: boolean };
}

export async function searchProfiles(query: string, limit = 30) {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_search_profiles', {
    p_query: query,
    p_limit: limit,
  });
  if (error) throw error;
  return data as { profiles: AdminProfileRow[]; query: string; total?: number };
}

export async function fetchQueueSnapshot() {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_queue_snapshot');
  if (error) throw error;
  return data as { rows: QueueRow[]; waiting_count?: number; in_date_count?: number };
}

export async function fetchGrowthSnapshot() {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_growth_snapshot');
  if (error) throw error;
  return data as {
    line_waitlist: LineWaitlistRow[];
    plus_waitlist: PlusWaitlistRow[];
    line_count: number;
    plus_count: number;
  };
}

export async function fetchPairingFunnel24h() {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_pairing_funnel_24h');
  if (error) throw error;
  return data as { hourly: PairingHourBucket[] };
}

export async function fetchCommunityStats() {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_community_stats');
  if (error) throw error;
  return data as { vote_total: number; prompts: unknown };
}

export async function fetchAllCommunityPrompts() {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_list_community_prompts');
  if (error) throw error;
  return data as { prompts: CommunityPromptAdmin[] };
}

export type CreatePromptInput = {
  slug: string;
  category_label: string;
  category_key: 'food_drinks' | 'pop_culture' | 'tech_ai' | 'lifestyle';
  body: string;
  sort_order?: number;
  is_active?: boolean;
};

export async function createPrompt(input: CreatePromptInput) {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_create_prompt', {
    p_slug: input.slug,
    p_category_label: input.category_label,
    p_category_key: input.category_key,
    p_body: input.body,
    p_sort_order: input.sort_order ?? 100,
    p_is_active: input.is_active ?? true,
  });
  if (error) throw error;
  return data as CommunityPromptAdmin;
}

export async function deletePrompt(slug: string) {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_delete_prompt', { p_slug: slug });
  if (error) throw error;
  return data as { ok: boolean; deactivated?: boolean; deleted?: boolean; vote_count?: number };
}

export type BulkProfileUpdate = {
  subscription_tier?: string;
  notify_line_live?: boolean;
  keep_matching_when_away?: boolean;
  remove_from_queue?: boolean;
  remove_from_line_waitlist?: boolean;
};

export async function bulkUpdateProfiles(userIds: string[], patch: BulkProfileUpdate) {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_bulk_update_profiles', {
    p_user_ids: userIds,
    p_subscription_tier: patch.subscription_tier ?? null,
    p_notify_line_live: patch.notify_line_live ?? null,
    p_keep_matching_when_away: patch.keep_matching_when_away ?? null,
    p_remove_from_queue: patch.remove_from_queue ?? false,
    p_remove_from_line_waitlist: patch.remove_from_line_waitlist ?? false,
  });
  if (error) throw error;
  return data as {
    ok: boolean;
    requested: number;
    profiles_updated: number;
    queue_removed: number;
    waitlist_removed: number;
  };
}

export async function bulkRemoveFromQueue(userIds: string[]) {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_bulk_queue_remove', { p_user_ids: userIds });
  if (error) throw error;
  return data as { ok: boolean; requested: number; removed: number };
}

/** Permanent erasure — superadmin only; invokes Edge Function with service role. */
export async function adminDeleteUser(userId: string) {
  const client = requireClient();
  const { data, error } = await client.functions.invoke('admin-delete-user', {
    body: { user_id: userId },
  });
  if (error) throw error;
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(String(data.error));
  }
  return data as { ok: boolean; userId?: string };
}

export async function fetchAdminAnalyticsHub(): Promise<AdminAnalyticsHub> {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_analytics_hub');
  if (error) throw error;
  return data as AdminAnalyticsHub;
}

/** Rich geography data (map layers, regions, queue overlay). Falls back to analytics hub shape when RPC missing. */
export async function fetchAdminGeographySnapshot(): Promise<AdminGeographySnapshot> {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_geography_snapshot');
  if (error) throw error;
  return data as AdminGeographySnapshot;
}

export function geographySnapshotFromHub(hub: AdminAnalyticsHub): AdminGeographySnapshot {
  const o = hub.overview;
  const ready = o.profiles_matching_complete ?? 0;
  const withCoords = o.profiles_with_location ?? 0;
  const grid = hub.geo_grid ?? [];
  const labels = hub.location_labels ?? [];
  const totalReadyCoords = labels.reduce((n, l) => n + l.count, 0) || withCoords;

  return {
    as_of: hub.as_of,
    summary: {
      profiles_total: o.profiles_total ?? 0,
      profiles_with_coords: withCoords,
      matching_ready: ready,
      matching_ready_with_coords: withCoords,
      coverage_pct: ready > 0 ? Math.round((1000 * withCoords) / ready) / 10 : 0,
      bucket_count_ready: grid.length,
      bucket_count_all: grid.length,
      queue_on_map: 0,
    },
    geo_grid_all: grid,
    geo_grid_ready: grid,
    location_labels: labels.map((l) => ({
      ...l,
      pct_of_located_ready:
        totalReadyCoords > 0 ? Math.round((1000 * l.count) / totalReadyCoords) / 10 : null,
    })),
    regions: [],
    queue_points: [],
    buckets: grid.map((c) => ({ ...c, sample_labels: [] })),
  };
}

/** Format wait_ms for display (e.g. "42s", "2m 10s"). */
export function formatWaitMs(ms: number | null | undefined): string {
  if (ms == null || Number.isNaN(ms)) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return rem > 0 ? `${min}m ${rem}s` : `${min}m`;
}
