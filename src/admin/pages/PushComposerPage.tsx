import { useCallback, useEffect, useState } from 'react';
import { Bell, Eye, EyeOff, MapPin, Send, Smartphone, Users, Zap } from 'lucide-react';
import { AdminPageShell } from '../components/AdminPageShell';
import { AdminRefreshButton } from '../components/AdminRefreshButton';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { AdminSuccessBanner } from '../components/AdminSuccessBanner';
import {
  estimatePushAudience,
  fetchPushHistory,
  sendAdminPush,
  type PushHistoryRow,
  type SendPushInput,
} from '../../lib/adminApi';
import { formatDateTime, formatRelativeTime } from '../lib/adminFormat';

type PushTarget = SendPushInput['target'];

const TARGET_OPTIONS: { value: PushTarget; label: string; desc: string }[] = [
  { value: 'all', label: 'All users', desc: 'Everyone with push enabled' },
  { value: 'plus', label: 'Plus subscribers', desc: 'Paying customers only' },
  { value: 'free', label: 'Free users', desc: 'Non-paying users only' },
  { value: 'location', label: 'By city', desc: 'Filter by location label' },
];

function PhonePreview({ title, body, deepLink }: { title: string; body: string; deepLink: string }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--border-color)',
        borderRadius: 20,
        padding: '1.5rem 1rem',
        maxWidth: 300,
        margin: '0 auto',
      }}
    >
      {/* Status bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', opacity: 0.4, fontSize: '0.7rem' }}>
        <span>9:41</span>
        <span>● ● ●</span>
      </div>

      {/* Notification bubble */}
      <div
        style={{
          background: 'rgba(30,32,36,0.98)',
          backdropFilter: 'blur(20px)',
          borderRadius: 14,
          padding: '0.75rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'var(--gradient-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Bell size={18} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {title || 'Notification title'}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>now</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
              {body || 'Your notification body will appear here…'}
            </p>
            {deepLink && (
              <p style={{ fontSize: '0.65rem', color: 'var(--color-accent)', margin: '0.3rem 0 0', opacity: 0.8 }}>
                → {deepLink}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Lock screen style */}
      <div style={{ textAlign: 'center', marginTop: '1.5rem', opacity: 0.3, fontSize: '0.7rem' }}>
        Slide to unlock
      </div>
    </div>
  );
}

export function PushComposerPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [target, setTarget] = useState<PushTarget>('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [history, setHistory] = useState<PushHistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [scheduleAt, setScheduleAt] = useState('');

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const rows = await fetchPushHistory();
      setHistory(rows);
    } catch {
      // Gracefully ignore — table may not exist
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  // Debounced audience estimation
  useEffect(() => {
    const timer = setTimeout(async () => {
      setAudienceLoading(true);
      try {
        const count = await estimatePushAudience(target, locationFilter || undefined);
        setAudienceCount(count);
      } catch {
        setAudienceCount(null);
      } finally {
        setAudienceLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [target, locationFilter]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setError('Title and body are required.');
      return;
    }
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await sendAdminPush({
        title: title.trim(),
        body: body.trim(),
        deep_link: deepLink.trim() || undefined,
        target,
        target_location: locationFilter.trim() || undefined,
      });
      setSuccess(
        res.sent > 0
          ? `Push sent to ${res.sent.toLocaleString()} recipients!`
          : 'Push queued successfully.'
      );
      setTitle('');
      setBody('');
      setDeepLink('');
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed. Edge function may not be deployed.');
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminPageShell
      title="Push Composer"
      subtitle="Compose and send push notifications to app users"
      actions={<AdminRefreshButton onClick={() => void loadHistory()} loading={historyLoading} />}
    >
      {error ? <AdminErrorBanner message={error} /> : null}
      {success ? <AdminSuccessBanner message={success} onDismiss={() => setSuccess(null)} /> : null}

      <div className="admin-grid-2">
        {/* Compose panel */}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Send size={16} style={{ color: 'var(--color-accent)' }} />
              Compose
            </h2>
            <button
              type="button"
              className="admin-btn admin-btn--ghost admin-btn--compact"
              onClick={() => setShowPreview((p) => !p)}
            >
              {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
              {showPreview ? 'Hide preview' : 'Show preview'}
            </button>
          </div>
          <div className="admin-form-stack">
            <label className="admin-field">
              <span>Title</span>
              <input
                type="text"
                maxLength={65}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="🔥 Hot Takes is live right now!"
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {title.length}/65 chars
              </span>
            </label>
            <label className="admin-field">
              <span>Body</span>
              <textarea
                rows={3}
                maxLength={178}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="3 people near you are waiting for a date. Jump in now →"
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {body.length}/178 chars
              </span>
            </label>
            <label className="admin-field">
              <span>Deep link (optional)</span>
              <input
                type="text"
                value={deepLink}
                onChange={(e) => setDeepLink(e.target.value)}
                placeholder="hottake://queue or https://hottakedate.com"
              />
            </label>

            <div>
              <span className="admin-field" style={{ display: 'block', marginBottom: '0.5rem' }}>
                <span>Target audience</span>
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {TARGET_OPTIONS.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => setTarget(opt.value)}
                    role="radio"
                    aria-checked={target === opt.value}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setTarget(opt.value)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: 10,
                      border: `1px solid ${target === opt.value ? 'var(--color-accent)' : 'var(--border-color)'}`,
                      background: target === opt.value ? 'rgba(255,84,78,0.08)' : 'rgba(255,255,255,0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <p style={{ fontWeight: 600, fontSize: '0.82rem', color: target === opt.value ? 'var(--color-accent)' : 'var(--text-primary)', margin: 0 }}>
                      {opt.label}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>{opt.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {target === 'location' && (
              <label className="admin-field">
                <span>City filter</span>
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="New York, Los Angeles, …"
                />
              </label>
            )}

            {/* Audience estimate */}
            <div
              className="admin-hint-card"
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
            >
              <Users size={16} style={{ color: 'var(--color-secondary)', flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600 }}>
                  Estimated reach:{' '}
                  <span style={{ color: 'var(--color-secondary)' }}>
                    {audienceLoading ? '…' : audienceCount != null ? audienceCount.toLocaleString() : '—'}
                  </span>{' '}
                  users
                </p>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Actual delivery depends on push token registration
                </p>
              </div>
            </div>

            <label className="admin-field">
              <span>Schedule (optional — leave blank to send now)</span>
              <input
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
              />
            </label>

            <button
              type="button"
              id="push-send-btn"
              className="admin-btn admin-btn--primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
              disabled={sending || !title.trim() || !body.trim()}
              onClick={() => void handleSend()}
            >
              <Zap size={15} />
              {sending ? 'Sending…' : scheduleAt ? 'Schedule push' : 'Send now'}
            </button>
          </div>
        </div>

        {/* Preview panel */}
        {showPreview && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Smartphone size={16} style={{ color: 'var(--color-secondary)' }} />
                Live preview
              </h2>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <PhonePreview title={title} body={body} deepLink={deepLink} />
              {target === 'location' && locationFilter && (
                <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                  <MapPin size={12} style={{ marginRight: 4 }} />
                  Sending to users in: <strong>{locationFilter}</strong>
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Send history */}
      <div className="admin-panel" style={{ marginTop: '1.5rem' }}>
        <div className="admin-panel-header">
          <h2>Send history</h2>
          <span className="admin-panel-meta">Last {history.length} pushes</span>
        </div>
        {historyLoading ? (
          <p className="admin-loading">Loading history…</p>
        ) : history.length === 0 ? (
          <p className="admin-empty" style={{ padding: '1.5rem' }}>
            No push history yet.{' '}
            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              (Requires a <code>push_notification_log</code> table in your database.)
            </span>
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Title</th>
                  <th>Target</th>
                  <th>Recipients</th>
                  <th>Sent by</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id}>
                    <td>{formatRelativeTime(row.created_at)} ago</td>
                    <td style={{ fontWeight: 500 }}>{row.title ?? '—'}</td>
                    <td>
                      <span className="admin-badge admin-badge--muted">{row.target_filter ?? row.kind ?? 'all'}</span>
                    </td>
                    <td>{row.recipient_count?.toLocaleString() ?? '—'}</td>
                    <td className="admin-panel-meta">{row.sent_by ?? '—'}</td>
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
