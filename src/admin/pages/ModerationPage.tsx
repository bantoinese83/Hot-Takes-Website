import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminPageShell } from '../components/AdminPageShell';
import { AdminRefreshButton } from '../components/AdminRefreshButton';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { AdminEmptyState } from '../components/AdminEmptyState';
import { AdminSuccessBanner } from '../components/AdminSuccessBanner';
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
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const PAGE_SIZE = 50;

  const load = useCallback(async (offset = 0) => {
    if (offset === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    try {
      const res = await fetchModerationReports(PAGE_SIZE, offset, filter);
      if (offset === 0) {
        setReports(Array.isArray(res.reports) ? res.reports : []);
      } else {
        setReports((prev) => [...prev, ...res.reports]);
      }
      setTotal(res.total ?? 0);
      if (offset === 0) setSelected(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filter]);

  useEffect(() => {
    void load(0);
  }, [load]);

  const onLoadMore = async () => {
    if (loading || loadingMore) return;
    await load(reports.length);
  };

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

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === reports.length) setSelected(new Set());
    else setSelected(new Set(reports.map((r) => r.id)));
  };

  const bulkResolve = async (status: ReportOpsStatus) => {
    if (selectedIds.length === 0) return;
    setBulkBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await Promise.all(selectedIds.map((id) => resolveReport(id, status)));
      setSuccess(`Bulk updated ${selectedIds.length} reports to ${status}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk update failed');
    } finally {
      setBulkBusy(false);
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

        {selectedIds.length > 0 ? (
          <div className="admin-bulk-bar">
            <span>
              <strong>{selectedIds.length}</strong> reports selected
            </span>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              disabled={bulkBusy}
              onClick={() => void bulkResolve('reviewed')}
            >
              Mark Reviewed
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              disabled={bulkBusy}
              onClick={() => void bulkResolve('dismissed')}
            >
              Dismiss All
            </button>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setSelected(new Set())}>
              Clear
            </button>
          </div>
        ) : null}

        {error ? <AdminErrorBanner message={error} /> : null}
        {success ? <AdminSuccessBanner message={success} onDismiss={() => setSuccess(null)} /> : null}

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
                    <th style={{ width: 44 }}>
                      <input
                        type="checkbox"
                        aria-label="Select all on page"
                        checked={reports.length > 0 && selected.size === reports.length}
                        onChange={toggleAll}
                      />
                    </th>
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
                    <tr key={r.id} className={selected.has(r.id) ? 'admin-row-selected' : undefined}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label="Select report"
                          checked={selected.has(r.id)}
                          onChange={() => toggleOne(r.id)}
                        />
                      </td>
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

        {reports.length < total && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              disabled={loadingMore}
              onClick={() => void onLoadMore()}
            >
              {loadingMore ? 'Loading more…' : `Load more (${total - reports.length} remaining)`}
            </button>
          </div>
        )}
    </AdminPageShell>
  );
}
