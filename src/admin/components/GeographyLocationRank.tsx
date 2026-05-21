import type { LocationLabelRow } from '../../lib/adminApi';

type Props = {
  rows: LocationLabelRow[];
  maxRows?: number;
};

export function GeographyLocationRank({ rows, maxRows = 25 }: Props) {
  const visible = rows.slice(0, maxRows);
  if (visible.length === 0) {
    return <p className="admin-empty">No location labels yet for match-ready profiles.</p>;
  }

  const top = visible[0]?.count ?? 1;

  return (
    <ul className="admin-geo-rank" role="list">
      {visible.map((row, i) => {
        const pct = row.pct_of_located_ready ?? (top > 0 ? Math.round((1000 * row.count) / top) / 10 : 0);
        const width = top > 0 ? Math.max(6, Math.round((100 * row.count) / top)) : 0;
        return (
          <li key={`${row.label}-${i}`} className="admin-geo-rank-row">
            <div className="admin-geo-rank-meta">
              <span className="admin-geo-rank-rank">{i + 1}</span>
              <span className="admin-geo-rank-label" title={row.label}>
                {row.label}
              </span>
              <span className="admin-geo-rank-count">{row.count}</span>
            </div>
            <div className="admin-geo-rank-bar-track" aria-hidden>
              <div className="admin-geo-rank-bar-fill" style={{ width: `${width}%` }} />
            </div>
            {row.pct_of_located_ready != null ? (
              <span className="admin-geo-rank-pct">{pct}% of located · ready</span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
