import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminPageShell } from '../components/AdminPageShell';
import { AdminRefreshButton } from '../components/AdminRefreshButton';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { AdminStatCard } from '../components/AdminStatCard';
import { GeoLeafletMap } from '../components/GeoLeafletMap';
import { GeographyLocationRank } from '../components/GeographyLocationRank';
import { GeographyBucketTable } from '../components/GeographyBucketTable';
import { GeographyRegionBreakdown } from '../components/GeographyRegionBreakdown';
import { useAdminGeography } from '../hooks/useAdminGeography';
import { formatRelativeTime } from '../lib/adminFormat';
import { geoCellKey, type GeoGridCell, type GeographyBucketRow } from '../../lib/adminApi';

type MapLayer = 'ready' | 'all';

function findBucket(buckets: GeographyBucketRow[], key: string): GeographyBucketRow | undefined {
  return buckets.find((b) => geoCellKey(b.lat_bucket, b.lng_bucket) === key);
}

export function GeographyPage() {
  const { snapshot, error, degraded, loading, usingHubFallback, reload } = useAdminGeography(60_000);
  const [layer, setLayer] = useState<MapLayer>('ready');
  const [showQueue, setShowQueue] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const cells: GeoGridCell[] = useMemo(() => {
    if (!snapshot) return [];
    return layer === 'ready' ? snapshot.geo_grid_ready : snapshot.geo_grid_all;
  }, [snapshot, layer]);

  const tableBuckets = useMemo(() => {
    const bucketsArr = snapshot?.buckets ?? [];
    const cellKeys = new Set(cells.map((c) => geoCellKey(c.lat_bucket, c.lng_bucket)));
    const fromDetail = bucketsArr.filter((b) => cellKeys.has(geoCellKey(b.lat_bucket, b.lng_bucket)));
    if (fromDetail.length > 0) return fromDetail;
    return cells.map((c) => ({ ...c, sample_labels: [] as string[] }));
  }, [snapshot?.buckets, cells]);

  const selectedBucket = selectedKey ? findBucket(tableBuckets, selectedKey) : undefined;
  const selectedCell = selectedBucket
    ? { lat_bucket: selectedBucket.lat_bucket, lng_bucket: selectedBucket.lng_bucket, count: selectedBucket.count }
    : null;

  const summary = snapshot?.summary;

  return (
    <AdminPageShell
      title="Geography"
      subtitle="Privacy-safe ~0.1° buckets on a dark basemap — match-ready density, regions, and live queue overlay"
      actions={<AdminRefreshButton onClick={() => void reload()} loading={loading} />}
    >
      {error ? <AdminErrorBanner message={error} degraded={degraded} /> : null}
      {usingHubFallback ? (
        <p className="admin-hint-banner">
          Limited mode: deploy <code>admin_geography_snapshot</code> migration for full layers and queue overlay.
        </p>
      ) : null}

      {snapshot ? (
        <>
          <p className="admin-live-meta">
            Live · updated {formatRelativeTime(snapshot.as_of)} ago
            {summary ? (
              <>
                {' '}
                · {summary.bucket_count_ready} match-ready buckets · {summary.bucket_count_all} all-location buckets
              </>
            ) : null}
          </p>

          <div className="admin-stat-grid admin-stat-grid--geo">
            <AdminStatCard
              label="Profiles with location"
              value={summary?.profiles_with_coords ?? '—'}
              sub={`${summary?.profiles_total ?? '—'} total accounts`}
            />
            <AdminStatCard
              label="Match-ready + located"
              value={summary?.matching_ready_with_coords ?? '—'}
              sub={`${summary?.matching_ready ?? '—'} match-ready overall`}
            />
            <AdminStatCard
              label="Location coverage"
              value={summary != null ? `${summary.coverage_pct}%` : '—'}
              sub="Share of match-ready with lat/lng"
              highlight={summary != null && summary.coverage_pct < 50}
            />
            <AdminStatCard
              label="On map now"
              value={summary?.queue_on_map ?? 0}
              sub="Queue rows with coordinates"
            />
          </div>

          <div className="admin-geo-toolbar">
            <div className="admin-segmented" role="group" aria-label="Map layer">
              <button
                type="button"
                className={layer === 'ready' ? 'admin-segmented-btn admin-segmented-btn--active' : 'admin-segmented-btn'}
                onClick={() => {
                  setLayer('ready');
                  setSelectedKey(null);
                }}
              >
                Match-ready
              </button>
              <button
                type="button"
                className={layer === 'all' ? 'admin-segmented-btn admin-segmented-btn--active' : 'admin-segmented-btn'}
                onClick={() => {
                  setLayer('all');
                  setSelectedKey(null);
                }}
              >
                All with location
              </button>
            </div>
            <label className="admin-geo-toggle">
              <input type="checkbox" checked={showQueue} onChange={(e) => setShowQueue(e.target.checked)} />
              Show live queue overlay
            </label>
            {selectedKey ? (
              <button type="button" className="admin-btn admin-btn--ghost admin-btn--compact" onClick={() => setSelectedKey(null)}>
                Clear selection
              </button>
            ) : null}
          </div>

          <div className="admin-geo-layout">
            <div className="admin-panel admin-panel--map">
              <div className="admin-panel-header">
                <h2>Density map</h2>
                <span className="admin-badge admin-badge--muted">
                  {layer === 'ready' ? 'Match-ready only' : 'Any profile with lat/lng'}
                </span>
              </div>
              <GeoLeafletMap
                cells={cells}
                queuePoints={snapshot.queue_points}
                showQueue={showQueue && snapshot.queue_points.length > 0}
                selectedKey={selectedKey}
                onSelectCell={(cell) => {
                  if (!cell) {
                    setSelectedKey(null);
                    return;
                  }
                  const key = geoCellKey(cell.lat_bucket, cell.lng_bucket);
                  setSelectedKey((prev) => (prev === key ? null : key));
                }}
                height={500}
              />
            </div>

            <aside className="admin-panel admin-panel--geo-detail">
              <div className="admin-panel-header">
                <h2>Bucket detail</h2>
              </div>
              {selectedBucket && selectedCell ? (
                <div className="admin-geo-detail">
                  <p className="admin-geo-detail-count">
                    <span className="admin-geo-detail-number">{selectedBucket.count}</span>
                    profiles in bucket
                  </p>
                  <dl className="admin-dl admin-dl--compact">
                    <div>
                      <dt>Coordinates</dt>
                      <dd>
                        {selectedCell.lat_bucket.toFixed(1)}° lat · {selectedCell.lng_bucket.toFixed(1)}° lng
                      </dd>
                    </div>
                    <div>
                      <dt>Approx. area</dt>
                      <dd>~11 km grid cell (0.1° rounding)</dd>
                    </div>
                  </dl>
                  {(selectedBucket.sample_labels?.length ?? 0) > 0 ? (
                    <>
                      <h3 className="admin-geo-detail-subhead">Sample labels</h3>
                      <ul className="admin-geo-detail-labels">
                        {selectedBucket.sample_labels!.map((lbl) => (
                          <li key={lbl}>{lbl}</li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="admin-muted">No location labels in this bucket.</p>
                  )}
                  <Link to="/admin/users" className="admin-link">
                    Browse users →
                  </Link>
                </div>
              ) : (
                <div className="admin-geo-detail-empty">
                  <p>Click a circle on the map or a row in the bucket table to inspect density and sample city labels.</p>
                </div>
              )}
            </aside>
          </div>

          <div className="admin-grid-2 admin-grid-2--geo">
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h2>Top location labels</h2>
                <span className="admin-badge admin-badge--muted">match-ready · located</span>
              </div>
              <GeographyLocationRank rows={snapshot.location_labels} />
            </div>
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h2>Regions</h2>
                <span className="admin-badge admin-badge--muted">parsed from label</span>
              </div>
              <GeographyRegionBreakdown regions={snapshot.regions} />
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2>Bucket index</h2>
              <span className="admin-badge admin-badge--muted">click row to highlight on map</span>
            </div>
            <GeographyBucketTable buckets={tableBuckets} selectedKey={selectedKey} onSelect={setSelectedKey} />
          </div>
        </>
      ) : loading ? (
        <p className="admin-loading">Loading geography…</p>
      ) : null}
    </AdminPageShell>
  );
}
