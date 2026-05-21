import { useCallback, useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, Database, RefreshCw, Server, Wifi, XCircle } from 'lucide-react';
import { AdminPageShell } from '../components/AdminPageShell';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import {
  fetchQueueHealthCheck,
  formatWaitMs,
  pingMatchmakerHealth,
  type SystemHealthCheck,
} from '../../lib/adminApi';
import { supabase } from '../../lib/supabase';
import { formatDateTime } from '../lib/adminFormat';

type OverallStatus = 'ok' | 'degraded' | 'error' | 'checking';

function StatusIcon({ status }: { status: SystemHealthCheck['status'] }) {
  if (status === 'ok') return <CheckCircle size={18} style={{ color: '#7fe2b8' }} />;
  if (status === 'warn') return <AlertTriangle size={18} style={{ color: '#fbbf24' }} />;
  if (status === 'error') return <XCircle size={18} style={{ color: '#f87171' }} />;
  return <RefreshCw size={18} style={{ color: 'var(--text-muted)' }} className="admin-spin" />;
}

function HealthCard({ check, icon }: { check: SystemHealthCheck; icon: React.ReactNode }) {
  const borderColor =
    check.status === 'ok'
      ? 'rgba(127,226,184,0.25)'
      : check.status === 'warn'
      ? 'rgba(251,191,36,0.3)'
      : check.status === 'error'
      ? 'rgba(248,113,113,0.3)'
      : 'var(--border-color)';

  const bgColor =
    check.status === 'ok'
      ? 'rgba(127,226,184,0.04)'
      : check.status === 'warn'
      ? 'rgba(251,191,36,0.04)'
      : check.status === 'error'
      ? 'rgba(248,113,113,0.05)'
      : 'transparent';

  return (
    <div
      className="admin-panel"
      style={{
        padding: '1.25rem',
        borderColor,
        background: `${bgColor}`,
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>{check.name}</h3>
            <StatusIcon status={check.status} />
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.3rem 0 0' }}>{check.detail}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
        {check.latency_ms != null && (
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: '0 0 0.15rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Latency</p>
            <p
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                margin: 0,
                color:
                  check.latency_ms < 500 ? '#7fe2b8' : check.latency_ms < 1500 ? '#fbbf24' : '#f87171',
              }}
            >
              {check.latency_ms}ms
            </p>
          </div>
        )}
        <div>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: '0 0 0.15rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Checked</p>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, margin: 0 }}>{formatDateTime(check.checked_at)}</p>
        </div>
      </div>
    </div>
  );
}

async function pingSupabaseRealtime(): Promise<SystemHealthCheck> {
  const start = Date.now();
  try {
    if (!supabase) throw new Error('Supabase not configured');
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Realtime timeout (5s)')), 5000);
      const ch = supabase!
        .channel(`admin-health-${Date.now()}`)
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timer);
            void supabase!.removeChannel(ch);
            resolve();
          }
        });
    });
    const latency = Date.now() - start;
    return {
      name: 'Supabase Realtime',
      status: 'ok',
      latency_ms: latency,
      detail: `WebSocket subscribed in ${latency}ms`,
      checked_at: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'Supabase Realtime',
      status: 'error',
      latency_ms: Date.now() - start,
      detail: err instanceof Error ? err.message : 'Failed',
      checked_at: new Date().toISOString(),
    };
  }
}

async function pingDatabaseRpc(): Promise<SystemHealthCheck> {
  const start = Date.now();
  try {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.rpc('admin_dashboard_overview');
    const latency = Date.now() - start;
    return {
      name: 'Supabase Database (RPC)',
      status: error ? 'error' : 'ok',
      latency_ms: latency,
      detail: error ? error.message : `Query returned in ${latency}ms`,
      checked_at: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'Supabase Database (RPC)',
      status: 'error',
      latency_ms: Date.now() - start,
      detail: err instanceof Error ? err.message : 'Failed',
      checked_at: new Date().toISOString(),
    };
  }
}

export function SystemHealthPage() {
  const [checks, setChecks] = useState<SystemHealthCheck[]>([]);
  const [queueHealth, setQueueHealth] = useState<{
    stale_entries: number;
    orphaned_in_date: number;
    longest_wait_ms: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runChecks = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Set all to "checking" immediately
    setChecks([
      { name: 'matchmaker edge fn', status: 'checking', latency_ms: null, detail: 'Pinging…', checked_at: new Date().toISOString() },
      { name: 'Supabase Realtime', status: 'checking', latency_ms: null, detail: 'Connecting…', checked_at: new Date().toISOString() },
      { name: 'Supabase Database (RPC)', status: 'checking', latency_ms: null, detail: 'Querying…', checked_at: new Date().toISOString() },
    ]);

    try {
      const [matchmaker, realtime, db, qh] = await Promise.all([
        pingMatchmakerHealth(),
        pingSupabaseRealtime(),
        pingDatabaseRpc(),
        fetchQueueHealthCheck().catch(() => null),
      ]);
      setChecks([matchmaker, realtime, db]);
      setQueueHealth(qh);
      setLastRun(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void runChecks();
    const id = setInterval(() => void runChecks(), 60_000);
    return () => clearInterval(id);
  }, [runChecks]);

  const overallStatus: OverallStatus =
    loading ? 'checking'
    : checks.some((c) => c.status === 'error') ? 'error'
    : checks.some((c) => c.status === 'warn') ? 'degraded'
    : checks.length > 0 ? 'ok'
    : 'checking';

  const overallConfig = {
    ok: { label: 'All systems operational', color: '#7fe2b8', bg: 'rgba(127,226,184,0.08)', border: 'rgba(127,226,184,0.25)' },
    degraded: { label: 'Some systems degraded', color: '#fbbf24', bg: 'rgba(251,191,36,0.06)', border: 'rgba(251,191,36,0.25)' },
    error: { label: 'System errors detected', color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.3)' },
    checking: { label: 'Running checks…', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.03)', border: 'var(--border-color)' },
  }[overallStatus];

  return (
    <AdminPageShell
      title="System Health"
      subtitle="Edge function status, database latency, and queue hygiene · auto-checks every 60s"
      actions={
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          disabled={loading}
          onClick={() => void runChecks()}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={14} className={loading ? 'admin-spin' : undefined} />
          {loading ? 'Checking…' : 'Run checks'}
        </button>
      }
    >
      {error ? <AdminErrorBanner message={error} /> : null}

      {/* Overall status banner */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderRadius: 12,
          background: overallConfig.bg,
          border: `1px solid ${overallConfig.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          transition: 'all 0.3s ease',
        }}
      >
        {overallStatus === 'ok' ? (
          <CheckCircle size={22} style={{ color: '#7fe2b8', flexShrink: 0 }} />
        ) : overallStatus === 'error' ? (
          <XCircle size={22} style={{ color: '#f87171', flexShrink: 0 }} />
        ) : (
          <Activity size={22} style={{ color: overallConfig.color, flexShrink: 0 }} />
        )}
        <div>
          <p style={{ fontWeight: 700, fontSize: '1rem', color: overallConfig.color, margin: 0 }}>
            {overallConfig.label}
          </p>
          {lastRun && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
              Last checked: {formatDateTime(lastRun)}
            </p>
          )}
        </div>
      </div>

      {/* Health cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {checks.map((check) => {
          const iconMap: Record<string, React.ReactNode> = {
            'matchmaker edge fn': <Server size={18} />,
            'Supabase Realtime': <Wifi size={18} />,
            'Supabase Database (RPC)': <Database size={18} />,
          };
          return <HealthCard key={check.name} check={check} icon={iconMap[check.name] ?? <Activity size={18} />} />;
        })}
      </div>

      {/* Queue hygiene */}
      {queueHealth !== null && (
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} style={{ color: 'var(--color-secondary)' }} />
              Queue hygiene
            </h2>
            <span className="admin-panel-meta">Live snapshot</span>
          </div>
          <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div
              style={{
                textAlign: 'center',
                padding: '1rem',
                borderRadius: 10,
                background: queueHealth.stale_entries > 0 ? 'rgba(251,191,36,0.06)' : 'rgba(127,226,184,0.04)',
                border: `1px solid ${queueHealth.stale_entries > 0 ? 'rgba(251,191,36,0.25)' : 'rgba(127,226,184,0.15)'}`,
              }}
            >
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: queueHealth.stale_entries > 0 ? '#fbbf24' : '#7fe2b8', margin: '0 0 0.25rem' }}>
                {queueHealth.stale_entries}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Stale entries <br /><span style={{ fontSize: '0.7rem', opacity: 0.7 }}>(no heartbeat &gt;30m)</span></p>
            </div>
            <div
              style={{
                textAlign: 'center',
                padding: '1rem',
                borderRadius: 10,
                background: queueHealth.orphaned_in_date > 0 ? 'rgba(248,113,113,0.06)' : 'rgba(127,226,184,0.04)',
                border: `1px solid ${queueHealth.orphaned_in_date > 0 ? 'rgba(248,113,113,0.25)' : 'rgba(127,226,184,0.15)'}`,
              }}
            >
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: queueHealth.orphaned_in_date > 0 ? '#f87171' : '#7fe2b8', margin: '0 0 0.25rem' }}>
                {queueHealth.orphaned_in_date}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Orphaned in_date <br /><span style={{ fontSize: '0.7rem', opacity: 0.7 }}>(stuck status)</span></p>
            </div>
            <div
              style={{
                textAlign: 'center',
                padding: '1rem',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
              }}
            >
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-secondary)', margin: '0 0 0.25rem' }}>
                {queueHealth.longest_wait_ms != null ? formatWaitMs(queueHealth.longest_wait_ms) : '—'}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Longest in_date wait</p>
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
