import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminPageShell } from '../components/AdminPageShell';
import { AdminRefreshButton } from '../components/AdminRefreshButton';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { AdminEmptyState } from '../components/AdminEmptyState';
import {
  addUserBlock,
  fetchModerationReports,
  resolveReport,
  type ModerationReport,
  type ReportOpsStatus,
} from '../../lib/adminApi';
import { formatReportReason, formatShortId } from '../lib/adminFormat';

const STATUS_FILTERS: { value: ReportOpsStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'actioned', label: 'Actioned' },
];

export function ModerationPage() {
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<ReportOpsStatus | ''>('open');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchModerationReports(100, 0, filter);
      setReports(Array.isArray(res.reports) ? res.reports : []);
      setTotal(res.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (report: ModerationReport, status: ReportOpsStatus) => {
    setBusyId(report.id);
    try {
      await resolveReport(report.id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const blockPair = async (report: ModerationReport) => {
    setBusyId(report.id);
    try {
      await addUserBlock(report.reporter_id, report.reported_user_id);
      await resolveReport(report.id, 'actioned', 'Admin block: reporter → reported');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Block failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminPageShell
      title="Moderation"
      subtitle={`${total} report${total === 1 ? '' : 's'}${filter ? ` · filter: ${filter}` : ''}`}
      actions={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
    >
        <div className="admin-filter-row">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.label}
              type="button"
              className={`admin-btn admin-btn--ghost${filter === f.value ? ' admin-btn--active' : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        {error ? <AdminErrorBanner message={error} /> : null}
        <div className="admin-panel">
          {loading ? (
            <p className="admin-loading">Loading reports…</p>
          ) : reports.length === 0 ? (
            <AdminEmptyState
              title="No reports in this filter"
              description={filter === 'open' ? 'Open queue is clear — nice work.' : 'Try another status filter or view all.'}
              action={
                filter !== '' ? (
                  <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setFilter('open')}>
                    Show open only
                  </button>
                ) : (
                  <Link to="/admin/users" className="admin-btn admin-btn--ghost" style={{ textDecoration: 'none' }}>
                    Browse users
                  </Link>
                )
              }
            />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Status</th>
                    <th>Reason</th>
                    <th>Reporter → Reported</th>
                    <th>Note</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id}>
                      <td>{new Date(r.created_at).toLocaleString()}</td>
                      <td>
                        <span className={`admin-badge${r.report_ops_status === 'open' ? ' admin-badge--warn' : ' admin-badge--muted'}`}>
                          {r.report_ops_status ?? 'open'}
                        </span>
                      </td>
                      <td>{formatReportReason(r.report_reason)}</td>
                      <td>
                        <Link to={`/admin/users/${r.reporter_id}`} className="admin-link">
                          {r.reporter_name ?? formatShortId(r.reporter_id)}
                        </Link>
                        {' → '}
                        <Link to={`/admin/users/${r.reported_user_id}`} className="admin-link">
                          {r.reported_name ?? formatShortId(r.reported_user_id)}
                        </Link>
                      </td>
                      <td style={{ maxWidth: 180 }}>{r.report_note ?? '—'}</td>
                      <td>
                        <div className="admin-inline-actions">
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost"
                            disabled={busyId === r.id}
                            onClick={() => void act(r, 'reviewed')}
                          >
                            Reviewed
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost"
                            disabled={busyId === r.id}
                            onClick={() => void act(r, 'dismissed')}
                          >
                            Dismiss
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--danger"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                            disabled={busyId === r.id}
                            onClick={() => void blockPair(r)}
                          >
                            Block
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </AdminPageShell>
  );
}
