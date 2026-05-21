import type { GeographyRegionRow } from '../../lib/adminApi';

type Props = {
  regions: GeographyRegionRow[];
};

export function GeographyRegionBreakdown({ regions }: Props) {
  if (regions.length === 0) {
    return <p className="admin-empty">Region breakdown needs the geography snapshot API.</p>;
  }

  const top = regions[0]?.count ?? 1;

  return (
    <ul className="admin-geo-rank admin-geo-rank--compact" role="list">
      {regions.map((r) => {
        const width = top > 0 ? Math.max(6, Math.round((100 * r.count) / top)) : 0;
        return (
          <li key={r.region} className="admin-geo-rank-row">
            <div className="admin-geo-rank-meta">
              <span className="admin-geo-rank-label" title={r.region}>
                {r.region}
              </span>
              <span className="admin-geo-rank-count">{r.count}</span>
            </div>
            <div className="admin-geo-rank-bar-track" aria-hidden>
              <div
                className="admin-geo-rank-bar-fill admin-geo-rank-bar-fill--secondary"
                style={{ width: `${width}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
