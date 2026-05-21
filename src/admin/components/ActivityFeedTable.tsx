import { Link } from 'react-router-dom';
import type { ActivityFeedItem } from '../../lib/adminApi';
import { formatWaitMs } from '../../lib/adminApi';
import { formatDateTime, formatShortId } from '../lib/adminFormat';

type Props = {
  items: ActivityFeedItem[];
  limit?: number;
};

function kindBadge(kind: string) {
  if (kind.startsWith('pairing.paired')) return 'admin-badge';
  if (kind.startsWith('report')) return 'admin-badge admin-badge--warn';
  if (kind.startsWith('push')) return 'admin-badge admin-badge--muted';
  if (kind.startsWith('date')) return 'admin-badge admin-badge--muted';
  return 'admin-badge admin-badge--muted';
}

export function ActivityFeedTable({ items, limit }: Props) {
  const rows = limit ? items.slice(0, limit) : items;

  if (rows.length === 0) {
    return <p className="admin-empty">No recent activity in the last 48 hours.</p>;
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Event</th>
            <th>Detail</th>
            <th>Users</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.at}-${row.kind}-${i}`}>
              <td title={new Date(row.at).toLocaleString()}>{formatDateTime(row.at)}</td>
              <td>
                <span className={kindBadge(row.kind)}>{row.kind}</span>
              </td>
              <td>
                {row.wait_ms != null ? (
                  <span>wait {formatWaitMs(row.wait_ms)}</span>
                ) : row.detail ? (
                  <span>{row.detail}</span>
                ) : (
                  '—'
                )}
              </td>
              <td>
                {row.user_id ? (
                  <Link to={`/admin/users/${row.user_id}`} className="admin-link admin-mono">
                    {formatShortId(row.user_id)}
                  </Link>
                ) : (
                  '—'
                )}
                {row.partner_user_id ? (
                  <>
                    {' → '}
                    <Link to={`/admin/users/${row.partner_user_id}`} className="admin-link admin-mono">
                      {formatShortId(row.partner_user_id)}
                    </Link>
                  </>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
