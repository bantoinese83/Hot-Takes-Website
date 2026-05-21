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
  top_prompts?: {
    slug: string;
    body: string;
    hot_count: number;
    cold_count: number;
    category_label: string;
  }[];
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
  avatar_url: string | null;
  hot_take: string | null;
  hot_take_category: string | null;
  location_label: string | null;
  latitude: number | null;
  longitude: number | null;
  gender_identity: string | null;
  ethnicity_self: string[] | null;
  religion_self: string | null;
  politics_self: string | null;
  intent_self: string | null;
  birthdate: string | null;
  height_cm: number | null;
  kids_self: string | null;
  smoking_self: string | null;
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
  profile_photo_urls: string[] | null;
  match_contrarian_mode: boolean;
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
  avatar_url: string | null;
  location_label?: string | null;
  matching_complete: boolean;
  age_affirmed: boolean;
  subscription_tier: string | null;
  referral_code: string | null;
  notify_line_live: boolean;
  keep_matching_when_away: boolean;
};

export type PairingWeight = {
  key: string;
  value: number;
  description: string;
  updated_at: string;
};

export type SimulatedMatch = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  location_label: string | null;
  score: number;
  compatible: boolean;
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

export type LaunchWaitlistSignupRow = {
  id: string;
  email: string;
  source: string;
  created_at: string;
  lat_bucket: number | null;
  lng_bucket: number | null;
};

export type LaunchWaitlistDailyBucket = {
  day: string;
  signups: number;
};

export type LaunchWaitlistSourceBucket = {
  source: string;
  signups: number;
};

export type LaunchWaitlistGeoBucket = {
  lat_bucket: number;
  lng_bucket: number;
  signup_count: number;
  updated_at?: string;
};

export type LaunchWaitlistProgress = {
  as_of: string;
  signup_count: number;
  waitlist_goal: number;
  remaining: number;
  percent: number;
  unlocked: boolean;
  released_at: string | null;
  headline: string;
};

export type GrowthLaunchSnapshot = {
  progress: LaunchWaitlistProgress;
  total: number;
  signups_24h: number;
  signups_7d: number;
  with_geo_count: number;
  recent: LaunchWaitlistSignupRow[];
  daily: LaunchWaitlistDailyBucket[];
  by_source: LaunchWaitlistSourceBucket[];
  geo_buckets: LaunchWaitlistGeoBucket[];
};

export type GrowthSnapshot = {
  as_of?: string;
  line_waitlist: LineWaitlistRow[];
  plus_waitlist: PlusWaitlistRow[];
  line_count: number;
  plus_count: number;
  launch?: GrowthLaunchSnapshot;
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

export async function searchProfiles(query: string, limit = 30, offset = 0) {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_search_profiles', {
    p_query: query,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw error;
  return data as { profiles: AdminProfileRow[]; query: string; total: number; limit: number; offset: number };
}

export async function fetchQueueSnapshot() {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_queue_snapshot');
  if (error) throw error;
  return data as { rows: QueueRow[]; waiting_count?: number; in_date_count?: number };
}

export async function fetchGrowthSnapshot(): Promise<GrowthSnapshot> {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_growth_snapshot');
  if (error) throw error;
  return data as GrowthSnapshot;
}

export async function updateLaunchSettings(patch: {
  waitlist_goal?: number;
  headline?: string;
  is_released?: boolean;
}) {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_update_launch_settings', {
    p_waitlist_goal: patch.waitlist_goal ?? null,
    p_headline: patch.headline ?? null,
    p_is_released: patch.is_released ?? null,
  });
  if (error) throw error;
  return data as { ok: boolean; progress: LaunchWaitlistProgress };
}

export async function deleteLaunchWaitlistSignup(id: string) {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_delete_launch_waitlist_signup', { p_id: id });
  if (error) throw error;
  return data as { ok: boolean; deleted: boolean };
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

export async function fetchUserActivity(userId: string, limit = 100, offset = 0) {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_get_user_activity', {
    p_user_id: userId,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw error;
  return data as { user_id: string; activity: ActivityFeedItem[]; has_more: boolean };
}

export async function fetchPairingWeights() {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_list_pairing_weights');
  if (error) throw error;
  return data as PairingWeight[];
}

export async function updatePairingWeight(key: string, value: number) {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_update_pairing_weight', {
    p_key: key,
    p_value: value,
  });
  if (error) throw error;
  return data as { ok: boolean };
}

export async function simulatePairing(userId: string) {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_simulate_pairing', {
    p_user_id: userId,
  });
  if (error) throw error;
  return data as { user_id: string; top_matches: SimulatedMatch[] };
}

export async function fetchActivityLog(limit = 50, offset = 0) {
  const client = requireClient();
  const { data, error } = await client.rpc('admin_list_activity_log', {
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw error;
  return data as { total: number; limit: number; offset: number; items: ActivityFeedItem[] };
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

// ─── REVENUE HEALTH ───────────────────────────────────────────

export type SubscriptionTierBreakdown = {
  tier: string;
  count: number;
  pct: number;
};

export type SubscriptionHealthSnapshot = {
  as_of: string;
  total_profiles: number;
  tiers: SubscriptionTierBreakdown[];
  conversions_7d: number;
  conversions_30d: number;
  plus_waitlist_to_plus_rate: number | null;
};

export async function fetchSubscriptionHealth(): Promise<SubscriptionHealthSnapshot> {
  const client = requireClient();
  // Query profiles table directly for tier breakdown
  const { data: tiers, error: e1 } = await client
    .from('profiles')
    .select('subscription_tier')
    .not('subscription_tier', 'is', null);
  if (e1) throw e1;

  const rows = (tiers ?? []) as { subscription_tier: string }[];
  const total = rows.length;
  const counts: Record<string, number> = {};
  for (const r of rows) {
    counts[r.subscription_tier] = (counts[r.subscription_tier] ?? 0) + 1;
  }
  const tierBreakdown: SubscriptionTierBreakdown[] = Object.entries(counts).map(([tier, count]) => ({
    tier,
    count,
    pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
  }));

  const plusCount = counts['plus'] ?? 0;
  const plusWaitlistCount = counts['plus_waitlist'] ?? 0;

  return {
    as_of: new Date().toISOString(),
    total_profiles: total,
    tiers: tierBreakdown.sort((a, b) => b.count - a.count),
    conversions_7d: 0, // Would need pairing_events or audit log
    conversions_30d: 0,
    plus_waitlist_to_plus_rate:
      plusWaitlistCount + plusCount > 0
        ? Math.round((plusCount / (plusWaitlistCount + plusCount)) * 1000) / 10
        : null,
  };
}

// ─── TRUST RADAR ──────────────────────────────────────────────

export type TrustRadarUser = {
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  reports_received: number;
  reports_filed: number;
  blocks_received: number;
  risk_score: number;
  risk_level: 'high' | 'medium' | 'low';
  latest_report_at: string | null;
};

export async function fetchTrustRadar(limit = 50): Promise<{ users: TrustRadarUser[]; as_of: string }> {
  const client = requireClient();

  // Reports received — grouped by reported_user_id
  const { data: received, error: e1 } = await client
    .from('moderation_reports')
    .select('reported_user_id, created_at')
    .order('created_at', { ascending: false });
  if (e1) throw e1;

  // Reports filed — grouped by reporter_id
  const { data: filed, error: e2 } = await client
    .from('moderation_reports')
    .select('reporter_id');
  if (e2) throw e2;

  const receivedMap: Record<string, { count: number; latest: string }> = {};
  for (const r of (received ?? []) as { reported_user_id: string; created_at: string }[]) {
    if (!receivedMap[r.reported_user_id]) receivedMap[r.reported_user_id] = { count: 0, latest: r.created_at };
    receivedMap[r.reported_user_id].count += 1;
  }

  const filedMap: Record<string, number> = {};
  for (const r of (filed ?? []) as { reporter_id: string }[]) {
    filedMap[r.reporter_id] = (filedMap[r.reporter_id] ?? 0) + 1;
  }

  const allIds = [...new Set([...Object.keys(receivedMap), ...Object.keys(filedMap)])];
  const topIds = allIds
    .map((id) => ({
      id,
      score: (receivedMap[id]?.count ?? 0) * 3 + (filedMap[id] ?? 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.id);

  if (topIds.length === 0) return { users: [], as_of: new Date().toISOString() };

  const { data: profiles, error: e3 } = await client
    .from('profiles')
    .select('id, name, avatar_url')
    .in('id', topIds);
  if (e3) throw e3;

  const profileMap: Record<string, { name: string | null; avatar_url: string | null }> = {};
  for (const p of (profiles ?? []) as { id: string; name: string | null; avatar_url: string | null }[]) {
    profileMap[p.id] = { name: p.name, avatar_url: p.avatar_url };
  }

  const users: TrustRadarUser[] = topIds.map((id) => {
    const rr = receivedMap[id]?.count ?? 0;
    const rf = filedMap[id] ?? 0;
    const score = rr * 3 + rf;
    const risk_level: TrustRadarUser['risk_level'] = score >= 9 ? 'high' : score >= 3 ? 'medium' : 'low';
    return {
      user_id: id,
      name: profileMap[id]?.name ?? null,
      avatar_url: profileMap[id]?.avatar_url ?? null,
      reports_received: rr,
      reports_filed: rf,
      blocks_received: 0,
      risk_score: score,
      risk_level,
      latest_report_at: receivedMap[id]?.latest ?? null,
    };
  });

  return { users, as_of: new Date().toISOString() };
}

// ─── PUSH NOTIFICATIONS ────────────────────────────────────────

export type PushHistoryRow = {
  id: string;
  created_at: string;
  kind: string;
  title: string | null;
  body: string | null;
  recipient_count: number | null;
  target_filter: string | null;
  sent_by: string | null;
};

export type SendPushInput = {
  title: string;
  body: string;
  deep_link?: string;
  target: 'all' | 'plus' | 'free' | 'location';
  target_location?: string;
};

export async function fetchPushHistory(limit = 30): Promise<PushHistoryRow[]> {
  const client = requireClient();
  // Query push_notification_log if it exists; return empty array gracefully
  const { data, error } = await client
    .from('push_notification_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    // Table may not exist — return empty
    return [];
  }
  return (data ?? []) as PushHistoryRow[];
}

export async function estimatePushAudience(target: SendPushInput['target'], location?: string): Promise<number> {
  const client = requireClient();
  let query = client.from('profiles').select('id', { count: 'exact', head: true });
  if (target === 'plus') query = query.eq('subscription_tier', 'plus');
  else if (target === 'free') query = query.eq('subscription_tier', 'free');
  else if (target === 'location' && location) query = query.ilike('location_label', `%${location}%`);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function sendAdminPush(input: SendPushInput): Promise<{ ok: boolean; sent: number }> {
  const client = requireClient();
  const { data, error } = await client.functions.invoke('admin-send-push', { body: input });
  if (error) throw error;
  const payload = data as { ok?: boolean; sent?: number } | null;
  if (!payload?.ok) {
    throw new Error('Push send failed');
  }
  return { ok: true, sent: payload.sent ?? 0 };
}

// ─── DATE QUALITY ──────────────────────────────────────────────

export type DateRow = {
  id: string;
  started_at: string | null;
  ended_at: string | null;
  status: string | null;
  user1_id: string;
  user2_id: string;
  livekit_room_name: string | null;
  duration_ms: number | null;
};

export type DateQualitySnapshot = {
  as_of: string;
  active_now: DateRow[];
  recent_completed: DateRow[];
  stats: {
    total_today: number;
    avg_duration_ms: number | null;
    completion_rate: number | null;
    early_end_rate: number | null;
    duration_buckets: { label: string; count: number }[];
  };
};

export async function fetchDateQualitySnapshot(): Promise<DateQualitySnapshot> {
  const client = requireClient();
  const dayAgo = new Date(Date.now() - 86400_000).toISOString();

  const { data, error } = await client
    .from('dates')
    .select('id, started_at, ended_at, status, user1_id, user2_id, livekit_room_name')
    .gte('started_at', dayAgo)
    .order('started_at', { ascending: false })
    .limit(200);
  if (error) throw error;

  const rows = (data ?? []) as DateRow[];
  const active = rows.filter((r) => r.status === 'active' || !r.ended_at);
  const completed = rows.filter((r) => r.status === 'completed' || r.ended_at);

  const durations = completed
    .filter((r) => r.started_at && r.ended_at)
    .map((r) => new Date(r.ended_at!).getTime() - new Date(r.started_at!).getTime());

  const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : null;

  const buckets = [
    { label: '< 1 min', max: 60_000 },
    { label: '1–3 min', max: 180_000 },
    { label: '3–5 min', max: 300_000 },
    { label: '5–10 min', max: 600_000 },
    { label: '10+ min', max: Infinity },
  ];

  const durationBuckets = buckets.map(({ label, max }, i) => {
    const min = i === 0 ? 0 : buckets[i - 1].max;
    return { label, count: durations.filter((d) => d >= min && d < max).length };
  });

  return {
    as_of: new Date().toISOString(),
    active_now: active,
    recent_completed: completed.slice(0, 50),
    stats: {
      total_today: rows.length,
      avg_duration_ms: avgDuration,
      completion_rate: rows.length > 0 ? Math.round((completed.length / rows.length) * 100) : null,
      early_end_rate: null,
      duration_buckets: durationBuckets,
    },
  };
}

// ─── SYSTEM HEALTH ──────────────────────────────────────────────

export type SystemHealthCheck = {
  name: string;
  status: 'ok' | 'warn' | 'error' | 'checking';
  latency_ms: number | null;
  detail: string;
  checked_at: string;
};

export async function pingMatchmakerHealth(): Promise<SystemHealthCheck> {
  const client = requireClient();
  const start = Date.now();
  try {
    const { error } = await client.functions.invoke('matchmaker', {
      body: { _health_check: true },
    });
    const latency = Date.now() - start;
    return {
      name: 'matchmaker edge fn',
      status: error ? 'warn' : 'ok',
      latency_ms: latency,
      detail: error ? `Response error: ${error.message}` : `OK in ${latency}ms`,
      checked_at: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'matchmaker edge fn',
      status: 'error',
      latency_ms: Date.now() - start,
      detail: err instanceof Error ? err.message : 'Unreachable',
      checked_at: new Date().toISOString(),
    };
  }
}

export async function fetchQueueHealthCheck(): Promise<{
  stale_entries: number;
  orphaned_in_date: number;
  longest_wait_ms: number | null;
}> {
  const client = requireClient();
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const { data: stale, error: e1 } = await client
    .from('queue')
    .select('user_id', { count: 'exact', head: true })
    .eq('status', 'waiting')
    .lt('last_seen_at', thirtyMinAgo);

  const { data: orphaned, error: e2 } = await client
    .from('queue')
    .select('user_id, entered_at')
    .eq('status', 'in_date');

  const staleCount = (stale as unknown as { count: number } | null)?.count ?? 0;
  const orphanedRows = (orphaned ?? []) as { user_id: string; entered_at: string }[];
  const longestWait =
    orphanedRows.length > 0
      ? Math.max(...orphanedRows.map((r) => Date.now() - new Date(r.entered_at).getTime()))
      : null;

  return {
    stale_entries: staleCount,
    orphaned_in_date: e2 ? 0 : orphanedRows.length,
    longest_wait_ms: longestWait,
  };
}

// ─── USER RELATIONSHIPS ────────────────────────────────────────

export type UserRelationshipItem = {
  partner_id: string;
  partner_name: string | null;
  partner_avatar: string | null;
  type: 'date' | 'block' | 'report_filed' | 'report_received';
  outcome: string | null;
  at: string;
  detail: string | null;
};

export async function fetchUserRelationships(userId: string): Promise<{ items: UserRelationshipItem[] }> {
  const client = requireClient();

  const [dates, blocksGiven, reportsGiven, reportsReceived] = await Promise.all([
    client
      .from('dates')
      .select('id, started_at, ended_at, status, user1_id, user2_id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('started_at', { ascending: false })
      .limit(100),
    client.from('user_blocks').select('blocked_id, created_at').eq('blocker_id', userId).limit(50),
    client.from('moderation_reports').select('reported_user_id, report_reason, created_at, report_ops_status').eq('reporter_id', userId).limit(50),
    client.from('moderation_reports').select('reporter_id, report_reason, created_at, report_ops_status').eq('reported_user_id', userId).limit(50),
  ]);

  const partnerIds = new Set<string>();
  (dates.data ?? []).forEach((r: Record<string, unknown>) => {
    const u1 = r['user1_id'] as string;
    const u2 = r['user2_id'] as string;
    partnerIds.add(u1 === userId ? u2 : u1);
  });
  (blocksGiven.data ?? []).forEach((r: Record<string, unknown>) => partnerIds.add(r['blocked_id'] as string));
  (reportsGiven.data ?? []).forEach((r: Record<string, unknown>) => partnerIds.add(r['reported_user_id'] as string));
  (reportsReceived.data ?? []).forEach((r: Record<string, unknown>) => partnerIds.add(r['reporter_id'] as string));

  const { data: profiles } = await client
    .from('profiles')
    .select('id, name, avatar_url')
    .in('id', [...partnerIds].slice(0, 100));

  const profileMap: Record<string, { name: string | null; avatar_url: string | null }> = {};
  for (const p of (profiles ?? []) as { id: string; name: string | null; avatar_url: string | null }[]) {
    profileMap[p.id] = { name: p.name, avatar_url: p.avatar_url };
  }

  const items: UserRelationshipItem[] = [];

  for (const r of (dates.data ?? []) as {
    id: string;
    started_at: string;
    status: string | null;
    user1_id: string;
    user2_id: string;
  }[]) {
    const partnerId = r.user1_id === userId ? r.user2_id : r.user1_id;
    items.push({
      partner_id: partnerId,
      partner_name: profileMap[partnerId]?.name ?? null,
      partner_avatar: profileMap[partnerId]?.avatar_url ?? null,
      type: 'date',
      outcome: r.status,
      at: r.started_at,
      detail: null,
    });
  }
  for (const r of (blocksGiven.data ?? []) as { blocked_id: string; created_at: string }[]) {
    items.push({ partner_id: r.blocked_id, partner_name: profileMap[r.blocked_id]?.name ?? null, partner_avatar: profileMap[r.blocked_id]?.avatar_url ?? null, type: 'block', outcome: 'blocked', at: r.created_at, detail: 'You blocked this user' });
  }
  for (const r of (reportsGiven.data ?? []) as { reported_user_id: string; report_reason: string | null; created_at: string; report_ops_status: string | null }[]) {
    items.push({ partner_id: r.reported_user_id, partner_name: profileMap[r.reported_user_id]?.name ?? null, partner_avatar: profileMap[r.reported_user_id]?.avatar_url ?? null, type: 'report_filed', outcome: r.report_ops_status, at: r.created_at, detail: r.report_reason });
  }
  for (const r of (reportsReceived.data ?? []) as { reporter_id: string; report_reason: string | null; created_at: string; report_ops_status: string | null }[]) {
    items.push({ partner_id: r.reporter_id, partner_name: profileMap[r.reporter_id]?.name ?? null, partner_avatar: profileMap[r.reporter_id]?.avatar_url ?? null, type: 'report_received', outcome: r.report_ops_status, at: r.created_at, detail: r.report_reason });
  }

  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return { items };
}
