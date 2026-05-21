import { useCallback, useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Users, Zap } from 'lucide-react';
import { AdminPageShell } from '../components/AdminPageShell';
import { AdminRefreshButton } from '../components/AdminRefreshButton';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { AdminStatCard } from '../components/AdminStatCard';
import {
  fetchSubscriptionHealth,
  type SubscriptionHealthSnapshot,
  type SubscriptionTierBreakdown,
} from '../../lib/adminApi';
import { tierLabel } from '../lib/adminFormat';

const TIER_COLORS: Record<string, string> = {
  plus: '#ff544e',
  plus_waitlist: '#83cfff',
  free: '#7fe2b8',
};

const ARPU_USD = 9.99;

function TierBar({ tier, pct, color }: { tier: string; pct: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.65rem' }}>
      <div style={{ width: 110, fontSize: '0.82rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
        {tierLabel(tier)}
      </div>
      <div style={{ flex: 1, height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.max(2, pct)}%`,
            background: color ?? 'var(--color-accent)',
            borderRadius: 6,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <div style={{ width: 48, textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-muted)', flexShrink: 0 }}>
        {pct}%
      </div>
    </div>
  );
}

function DonutChart({ tiers, total }: { tiers: SubscriptionTierBreakdown[]; total: number }) {
  const radius = 60;
  const cx = 80;
  const cy = 80;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = tiers.map((t) => {
    const pct = total > 0 ? t.count / total : 0;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const seg = { ...t, dash, gap, offset, color: TIER_COLORS[t.tier] ?? '#555' };
    offset += dash;
    return seg;
  });

  return (
    <svg width={160} height={160} viewBox="0 0 160 160" style={{ overflow: 'visible' }}>
      {segments.map((s) => (
        <circle
          key={s.tier}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={s.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset + circumference * 0.25}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      ))}
      <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--text-primary)" fontSize={22} fontWeight={700}>
        {total}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-muted)" fontSize={11}>
        profiles
      </text>
    </svg>
  );
}

export function RevenueHealthPage() {
  const [snapshot, setSnapshot] = useState<SubscriptionHealthSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSubscriptionHealth();
      setSnapshot(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const plusCount = snapshot?.tiers.find((t) => t.tier === 'plus')?.count ?? 0;
  const estimatedMRR = plusCount * ARPU_USD;
  const estimatedARR = estimatedMRR * 12;

  return (
    <AdminPageShell
      title="Revenue & Subscriptions"
      subtitle="Tier breakdown, conversion funnel, and estimated MRR"
      actions={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
    >
      {error ? <AdminErrorBanner message={error} /> : null}
      {loading && !snapshot ? <p className="admin-loading">Loading subscription data…</p> : null}

      {snapshot ? (
        <>
          <div className="admin-stat-grid">
            <AdminStatCard
              label="Total profiles"
              value={snapshot.total_profiles.toLocaleString()}
              sub="All registered users"
            />
            <AdminStatCard
              label="Plus subscribers"
              value={plusCount}
              sub={`${snapshot.tiers.find((t) => t.tier === 'plus')?.pct ?? 0}% of users`}
              highlight={plusCount > 0}
            />
            <AdminStatCard
              label="Plus waitlist"
              value={snapshot.tiers.find((t) => t.tier === 'plus_waitlist')?.count ?? 0}
              sub="Pending upgrade"
            />
            <AdminStatCard
              label="Waitlist → Plus rate"
              value={snapshot.plus_waitlist_to_plus_rate != null ? `${snapshot.plus_waitlist_to_plus_rate}%` : '—'}
              sub="Of all Plus-interested users"
            />
            <AdminStatCard
              label="Est. MRR"
              value={`$${estimatedMRR.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              sub={`@ $${ARPU_USD}/mo · ${plusCount} Plus`}
              highlight={estimatedMRR > 0}
            />
            <AdminStatCard
              label="Est. ARR"
              value={`$${estimatedARR.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              sub="Annualized"
            />
          </div>

          <div className="admin-grid-2" style={{ marginTop: '1.5rem' }}>
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={16} style={{ color: 'var(--color-secondary)' }} />
                  Tier breakdown
                </h2>
                <span className="admin-panel-meta">{snapshot.total_profiles.toLocaleString()} total</span>
              </div>
              <div style={{ padding: '1.25rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <DonutChart tiers={snapshot.tiers} total={snapshot.total_profiles} />
                <div style={{ flex: 1 }}>
                  {snapshot.tiers.map((t) => (
                    <TierBar
                      key={t.tier}
                      tier={t.tier}
                      pct={t.pct}
                      color={TIER_COLORS[t.tier] ?? '#888'}
                    />
                  ))}
                </div>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table admin-table--compact">
                  <thead>
                    <tr>
                      <th>Tier</th>
                      <th>Users</th>
                      <th>Share</th>
                      <th>Est. Revenue/mo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.tiers.map((t) => (
                      <tr key={t.tier}>
                        <td>
                          <span
                            className="admin-badge"
                            style={{
                              background: `${TIER_COLORS[t.tier] ?? '#555'}22`,
                              color: TIER_COLORS[t.tier] ?? '#aaa',
                              border: `1px solid ${TIER_COLORS[t.tier] ?? '#555'}44`,
                            }}
                          >
                            {tierLabel(t.tier)}
                          </span>
                        </td>
                        <td>{t.count.toLocaleString()}</td>
                        <td>{t.pct}%</td>
                        <td style={{ color: t.tier === 'plus' ? '#7fe2b8' : 'var(--text-muted)' }}>
                          {t.tier === 'plus'
                            ? `$${(t.count * ARPU_USD).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="admin-panel">
              <div className="admin-panel-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={16} style={{ color: 'var(--color-accent)' }} />
                  Revenue projection
                </h2>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,84,78,0.08) 0%, rgba(127,226,184,0.06) 100%)',
                    border: '1px solid rgba(255,84,78,0.2)',
                    borderRadius: 12,
                    padding: '1.5rem',
                    marginBottom: '1rem',
                  }}
                >
                  <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Monthly Recurring Revenue
                  </p>
                  <p style={{ fontSize: '2.5rem', fontWeight: 800, color: plusCount > 0 ? '#7fe2b8' : 'var(--text-muted)', marginBottom: '0.25rem', lineHeight: 1 }}>
                    ${estimatedMRR.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {plusCount} subscribers × ${ARPU_USD}/mo
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {[
                    { label: '10× growth', users: plusCount * 10 },
                    { label: '50× growth', users: plusCount * 50 },
                    { label: '100× growth', users: plusCount * 100 },
                    { label: '1000 Plus users', users: 1000 },
                  ].map(({ label, users }) => (
                    <div
                      key={label}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 10,
                        padding: '0.75rem',
                      }}
                    >
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{label}</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        ${(users * ARPU_USD).toLocaleString('en-US', { maximumFractionDigits: 0 })}<span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 2 }}>/mo</span>
                      </p>
                    </div>
                  ))}
                </div>

                <div className="admin-hint-card" style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <Zap size={14} style={{ flexShrink: 0, marginTop: 2, color: 'var(--color-accent)' }} />
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      ARPU estimate of <strong>${ARPU_USD}/mo</strong> used for projections. Actual pricing may vary.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-panel" style={{ marginTop: '1.5rem' }}>
            <div className="admin-panel-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={16} style={{ color: '#7fe2b8' }} />
                Conversion funnel
              </h2>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {[
                {
                  label: 'Total profiles',
                  value: snapshot.total_profiles,
                  color: 'var(--text-muted)',
                  desc: 'All registered users',
                },
                {
                  label: 'Matching ready',
                  value: null,
                  color: 'var(--color-secondary)',
                  desc: 'Completed dating profile',
                },
                {
                  label: 'Plus waitlist',
                  value: snapshot.tiers.find((t) => t.tier === 'plus_waitlist')?.count ?? 0,
                  color: '#83cfff',
                  desc: 'Expressed Plus intent',
                },
                {
                  label: 'Plus subscribers',
                  value: plusCount,
                  color: '#ff544e',
                  desc: 'Paying customers',
                },
              ].map((step, i, arr) => {
                const max = arr[0].value ?? snapshot.total_profiles;
                const pct = step.value != null && max > 0 ? Math.round((step.value / max) * 100) : null;
                return (
                  <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: i < arr.length - 1 ? '0.65rem' : 0 }}>
                    <div style={{ width: 140, fontSize: '0.82rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                      <span style={{ color: step.color, fontWeight: 600 }}>{step.label}</span>
                    </div>
                    <div style={{ flex: 1, height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct ?? 100}%`,
                          background: step.color,
                          borderRadius: 6,
                          opacity: step.value == null ? 0.3 : 1,
                          transition: 'width 0.8s ease',
                        }}
                      />
                    </div>
                    <div style={{ width: 60, textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: step.color }}>
                        {step.value?.toLocaleString() ?? '—'}
                      </span>
                      {pct != null && i > 0 ? (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 4 }}>
                          ({pct}%)
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </AdminPageShell>
  );
}
