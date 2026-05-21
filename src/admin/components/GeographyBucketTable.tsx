import { geoCellKey, type GeographyBucketRow } from '../../lib/adminApi';

type Props = {
  buckets: GeographyBucketRow[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  maxRows?: number;
};

export function GeographyBucketTable({ buckets, selectedKey, onSelect, maxRows = 40 }: Props) {
  const visible = buckets.slice(0, maxRows);
  if (visible.length === 0) {
    return <p className="admin-empty">No buckets to list.</p>;
  }

  return (
    <div className="admin-table-scroll">
      <table className="admin-table admin-table--compact">
        <thead>
          <tr>
            <th>Lat °</th>
            <th>Lng °</th>
            <th>Profiles</th>
            <th>Sample labels</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((b) => {
            const key = geoCellKey(b.lat_bucket, b.lng_bucket);
            const labels = (b.sample_labels ?? []).filter(Boolean);
            return (
              <tr
                key={key}
                className={selectedKey === key ? 'admin-table-row--selected' : undefined}
                onClick={() => onSelect(key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(key);
                  }
                }}
              >
                <td>{b.lat_bucket.toFixed(1)}</td>
                <td>{b.lng_bucket.toFixed(1)}</td>
                <td>
                  <strong>{b.count}</strong>
                </td>
                <td className="admin-geo-table-labels">
                  {labels.length > 0 ? labels.join(' · ') : <span className="admin-muted">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
