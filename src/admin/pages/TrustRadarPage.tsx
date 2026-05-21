import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Shield, ShieldAlert, ShieldCheck, User } from 'lucide-react';
import { AdminPageShell } from '../components/AdminPageShell';
import { AdminRefreshButton } from '../components/AdminRefreshButton';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { AdminEmptyState } from '../components/AdminEmptyState';
import {
  fetchTrustRadar,
  removeFromQueue,
  type TrustRadarUser,
} from '../../lib/adminApi';
import { formatDateTime, formatShortId } from '../lib/adminFormat';

type SortKey = 'risk_score' | 'reports_received' | 'reports_filed';

const RISK_CONFIG = {
  high: { label: 'High Risk', color: '#f87171', icon: ShieldAlert, bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' },
  medium: { label: 'Medium Risk', color: '#fbbf24', icon: AlertTriangle, bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)' },
  low: { label: 'Low', color: '#7fe2b8', icon: ShieldCheck, bg: 'rgba(127,226,184,0.06)', border: 'rgba(127,226,184,0.2)' },
};

function RiskBadge({ level }: { level: TrustRadarUser['risk_level'] }) {
  const cfg = RISK_CONFIG[level];
  const Icon = cfg.icon;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.2rem 0.55rem',
        borderRadius: 20,
        fontSize: '0.72rem',
        fontWeight: 700,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

function RiskScoreBar({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (score / max) * 100) : 0;
  const color = score >= 9 ? '#f87171' : score >= 3 ? '#fbbf24' : '#7fe2b8';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color, minWidth: 20, textAlign: 'right' }}>{score}</span>
    </div>
  );
}

export function TrustRadarPage() {
  const [users, setUsers] = useState<TrustRadarUser[]>([]);
  const [asOf, setAsOf] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>('risk_score');
  const [filterLevel, setFilterLevel] = useState<TrustRadarUser['risk_level'] | ''>('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTrustRadar(100);
      setUsers(res.users);
      setAsOf(res.as_of);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trust data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = users
    .filter((u) => !filterLevel || u.risk_level === filterLevel)
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const maxScore = Math.max(...users.map((u) => u.risk_score), 1);
  const highCount = users.filter((u) => u.risk_level === 'high').length;
  const medCount = users.filter((u) => u.risk_level === 'medium').length;

  const kickFromQueue = async (userId: string, name: string | null) => {
    setBusyId(userId);
    try {
      await removeFromQueue(userId);
      setActionMsg(`${name ?? formatShortId(userId)} removed from queue.`);
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminPageShell
      title="Trust Radar"
      subtitle={`${users.length} flagged users · ${highCount} high risk · ${medCount} medium`}
      actions={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
    >
      {error ? <AdminErrorBanner message={error} /> : null}
      {actionMsg ? (
        <div className="admin-hint-card" style={{ marginBottom: '1rem', borderColor: 'rgba(127,226,184,0.3)', background: 'rgba(127,226,184,0.06)' }}>
          <p style={{ margin: 0, color: '#7fe2b8', fontSize: '0.85rem' }}>{actionMsg}</p>
        </div>
      ) : null}

      {/* Summary cards */}
      <div className="admin-stat-grid" style={{ marginBottom: '1.25rem' }}>
        {(['high', 'medium', 'low'] as const).map((level) => {
          const cfg = RISK_CONFIG[level];
          const count = users.filter((u) => u.risk_level === level).length;
          return (
            <div
              key={level}
              className="admin-panel"
              style={{ padding: '1rem 1.25rem', cursor: 'pointer', borderColor: filterLevel === level ? cfg.border : undefined }}
              onClick={() => setFilterLevel(filterLevel === level ? '' : level)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setFilterLevel(filterLevel === level ? '' : level)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                {<cfg.icon size={16} style={{ color: cfg.color }} />}
                <span style={{ fontSize: '0.75rem', color: cfg.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cfg.label}</span>
              </div>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: count > 0 && level === 'high' ? cfg.color : 'var(--text-primary)', margin: 0 }}>{count}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>users in this range</p>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="admin-filter-row" style={{ marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>Sort by:</span>
        {([
          { key: 'risk_score', label: 'Risk score' },
          { key: 'reports_received', label: 'Reports received' },
          { key: 'reports_filed', label: 'Reports filed' },
        ] as { key: SortKey; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`admin-btn admin-btn--ghost${sortBy === key ? ' admin-btn--active' : ''}`}
            onClick={() => setSortBy(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {asOf ? (
        <p className="admin-live-meta" style={{ marginBottom: '1rem' }}>
          Data as of {formatDateTime(asOf)} · Risk score = reports_received × 3 + reports_filed
        </p>
      ) : null}

      <div className="admin-panel">
        {loading ? (
          <p className="admin-loading">Scanning trust signals…</p>
        ) : filtered.length === 0 ? (
          <AdminEmptyState
            title={filterLevel ? `No ${filterLevel}-risk users` : 'No flagged users'}
            description={filterLevel ? 'Try a different risk filter.' : 'All users are in good standing.'}
            action={
              filterLevel ? (
                <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setFilterLevel('')}>
                  Show all
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Risk level</th>
                  <th>Risk score</th>
                  <th style={{ textAlign: 'center' }}>Received</th>
                  <th style={{ textAlign: 'center' }}>Filed</th>
                  <th>Last report</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr
                    key={u.user_id}
                    style={u.risk_level === 'high' ? { background: 'rgba(248,113,113,0.04)' } : undefined}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="admin-avatar-sm" />
                        ) : (
                          <div className="admin-avatar-sm admin-avatar-sm--fallback">
                            {u.name?.charAt(0) ?? <User size={12} />}
                          </div>
                        )}
                        <Link to={`/admin/users/${u.user_id}`} className="admin-link" style={{ fontWeight: 600 }}>
                          {u.name ?? formatShortId(u.user_id)}
                        </Link>
                      </div>
                    </td>
                    <td><RiskBadge level={u.risk_level} /></td>
                    <td style={{ minWidth: 120 }}>
                      <RiskScoreBar score={u.risk_score} max={maxScore} />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, color: u.reports_received >= 3 ? '#f87171' : 'var(--text-primary)' }}>
                        {u.reports_received}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, color: u.reports_filed >= 5 ? '#fbbf24' : 'var(--text-muted)' }}>
                        {u.reports_filed}
                      </span>
                    </td>
                    <td>
                      <span className="admin-panel-meta">
                        {u.latest_report_at ? formatDateTime(u.latest_report_at) : '—'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-inline-actions">
                        <Link to={`/admin/users/${u.user_id}`} className="admin-btn admin-btn--ghost" style={{ textDecoration: 'none', fontSize: '0.78rem' }}>
                          Profile
                        </Link>
                        <Link
                          to={`/admin/moderation?user=${u.user_id}`}
                          className="admin-btn admin-btn--ghost"
                          style={{ textDecoration: 'none', fontSize: '0.78rem' }}
                        >
                          Reports
                        </Link>
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.72rem' }}
                          disabled={busyId === u.user_id}
                          onClick={() => void kickFromQueue(u.user_id, u.name)}
                        >
                          Kick queue
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

      <div className="admin-hint-card" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
          <Shield size={14} style={{ flexShrink: 0, marginTop: 2, color: 'var(--text-muted)' }} />
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <strong>Risk score</strong> = (reports received × 3) + reports filed. Users with high filing rates may be over-reporters.
            Click any risk card above to filter.
          </p>
        </div>
      </div>
    </AdminPageShell>
  );
}
