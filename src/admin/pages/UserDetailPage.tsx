import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AdminPageShell } from '../components/AdminPageShell';
import { AdminRefreshButton } from '../components/AdminRefreshButton';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { AdminConfirmDialog } from '../components/AdminConfirmDialog';
import { AdminSuccessBanner } from '../components/AdminSuccessBanner';
import { AdminCopyButton } from '../components/AdminCopyButton';
import { useAdminAuth } from '../../lib/useAdminAuth';
import {
  addUserBlock,
  adminDeleteUser,
  fetchAdminProfile,
  removeFromLineWaitlist,
  removeFromQueue,
  updateAdminProfile,
  type AdminProfileDetail,
} from '../../lib/adminApi';
import { formatDateTime, formatShortId, tierLabel } from '../lib/adminFormat';

export function UserDetailPage() {
  const { adminInfo } = useAdminAuth();
  const isSuperadmin = Boolean(adminInfo?.is_superadmin);
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AdminProfileDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<'queue' | 'waitlist' | 'block' | 'delete' | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [tier, setTier] = useState('free');
  const [notifyLine, setNotifyLine] = useState(false);
  const [keepAway, setKeepAway] = useState(false);
  const [opsNote, setOpsNote] = useState('');
  const [resetAge, setResetAge] = useState(false);
  const [resetMatching, setResetMatching] = useState(false);
  const [blockReporterId, setBlockReporterId] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const p = await fetchAdminProfile(userId);
      setProfile(p);
      setTier(p.subscription_tier ?? 'free');
      setNotifyLine(Boolean(p.notify_line_live));
      setKeepAway(Boolean(p.keep_matching_when_away));
      setOpsNote(p.admin_ops_note ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSave = async () => {
    if (!userId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateAdminProfile(userId, {
        subscription_tier: tier,
        notify_line_live: notifyLine,
        keep_matching_when_away: keepAway,
        admin_ops_note: opsNote,
        reset_age_affirmation: resetAge,
        reset_matching_complete: resetMatching,
      });
      setProfile(updated);
      setResetAge(false);
      setResetMatching(false);
      setSuccess('Profile updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const runQueueRemove = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      await removeFromQueue(userId);
      setSuccess('Removed from queue.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Queue remove failed');
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  const runWaitlistRemove = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      await removeFromLineWaitlist(userId);
      setSuccess('Removed from line waitlist.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Waitlist remove failed');
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  const runDeleteAccount = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      await adminDeleteUser(userId);
      navigate('/admin/users', { replace: true, state: { flash: 'Account deleted.' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setSaving(false);
      setConfirm(null);
      setDeleteConfirmText('');
    }
  };

  const runBlock = async () => {
    if (!userId || !blockReporterId.trim()) return;
    setSaving(true);
    try {
      await addUserBlock(blockReporterId.trim(), userId);
      setSuccess('Block created.');
      setBlockReporterId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Block failed');
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  if (!userId) {
    return (
      <AdminPageShell title="User">
        <AdminErrorBanner message="Missing user id in URL." />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      title={profile?.name ?? 'User'}
      subtitle={profile ? `${tierLabel(profile.subscription_tier)} · ${profile.location_label ?? 'No location'}` : `ID ${formatShortId(userId, 12)}`}
      breadcrumbs={[
        { label: 'Users', to: '/admin/users' },
        { label: profile?.name ?? formatShortId(userId) },
      ]}
      actions={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
    >
      {profile?.in_queue ? (
        <div className="admin-hint-card" role="note">
          <strong>Currently in queue</strong> (status: {profile.queue_status ?? 'waiting'}) —{' '}
          <Link to="/admin/queue">view live queue</Link> before removing.
        </div>
      ) : null}

      {error ? <AdminErrorBanner message={error} /> : null}
      {success ? <AdminSuccessBanner message={success} onDismiss={() => setSuccess(null)} /> : null}

      {loading && !profile ? (
        <p className="admin-loading">Loading profile…</p>
      ) : profile ? (
        <div className="admin-grid-2">
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2>Profile</h2>
            </div>
            <dl className="admin-dl">
              <dt>User id</dt>
              <dd>
                <div className="admin-id-row">
                  <span className="admin-mono">{profile.id}</span>
                  <AdminCopyButton value={profile.id} />
                </div>
              </dd>
              <dt>Hot take</dt>
              <dd>{profile.hot_take ?? '—'}</dd>
              <dt>Category</dt>
              <dd>{profile.hot_take_category ?? '—'}</dd>
              <dt>Location</dt>
              <dd>{profile.location_label ?? '—'}</dd>
              <dt>Matching complete</dt>
              <dd>{profile.matching_profile_completed_at ? formatDateTime(profile.matching_profile_completed_at) : 'No'}</dd>
              <dt>Age affirmed</dt>
              <dd>{profile.age_affirmed_at ? formatDateTime(profile.age_affirmed_at) : 'No'}</dd>
              <dt>In queue</dt>
              <dd>{profile.in_queue ? (profile.queue_status ?? 'yes') : 'No'}</dd>
              <dt>Line waitlist</dt>
              <dd>{profile.on_line_waitlist ? 'Yes' : 'No'}</dd>
              <dt>Referral</dt>
              <dd>{profile.referral_code ?? '—'}</dd>
              {profile.admin_ops_note ? (
                <>
                  <dt>Ops note</dt>
                  <dd>{profile.admin_ops_note}</dd>
                </>
              ) : null}
            </dl>
          </div>

          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2>Edit & actions</h2>
            </div>
            <div className="admin-form-stack">
              <label className="admin-field">
                <span>Subscription tier</span>
                <select value={tier} onChange={(e) => setTier(e.target.value)}>
                  <option value="free">free</option>
                  <option value="plus_waitlist">plus_waitlist</option>
                  <option value="plus">plus</option>
                </select>
              </label>
              <label className="admin-field admin-field--row">
                <input type="checkbox" checked={notifyLine} onChange={(e) => setNotifyLine(e.target.checked)} />
                <span>Notify when line is live</span>
              </label>
              <label className="admin-field admin-field--row">
                <input type="checkbox" checked={keepAway} onChange={(e) => setKeepAway(e.target.checked)} />
                <span>Keep matching when away</span>
              </label>
              <label className="admin-field">
                <span>Ops note (internal)</span>
                <textarea rows={3} value={opsNote} onChange={(e) => setOpsNote(e.target.value)} placeholder="Support notes — not shown in app" />
              </label>
              <label className="admin-field admin-field--row">
                <input type="checkbox" checked={resetAge} onChange={(e) => setResetAge(e.target.checked)} />
                <span>Reset age affirmation on save</span>
              </label>
              <label className="admin-field admin-field--row">
                <input type="checkbox" checked={resetMatching} onChange={(e) => setResetMatching(e.target.checked)} />
                <span>Reset matching complete on save</span>
              </label>
              <button type="button" className="admin-btn admin-btn--primary" style={{ width: 'auto' }} disabled={saving} onClick={() => void onSave()}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>

              <hr className="admin-divider" />

              <div className="admin-action-row">
                <button type="button" className="admin-btn admin-btn--ghost" disabled={!profile.in_queue || saving} onClick={() => setConfirm('queue')}>
                  Remove from queue
                </button>
                <button type="button" className="admin-btn admin-btn--ghost" disabled={!profile.on_line_waitlist || saving} onClick={() => setConfirm('waitlist')}>
                  Remove line waitlist
                </button>
                <Link to="/admin/moderation" className="admin-btn admin-btn--ghost" style={{ textDecoration: 'none' }}>
                  Moderation
                </Link>
              </div>

              <label className="admin-field">
                <span>Block this user (blocker user id)</span>
                <input placeholder="Reporter or other blocker UUID" value={blockReporterId} onChange={(e) => setBlockReporterId(e.target.value)} />
              </label>
              <button type="button" className="admin-btn admin-btn--danger" style={{ width: 'auto' }} disabled={!blockReporterId.trim() || saving} onClick={() => setConfirm('block')}>
                Create block
              </button>

              {isSuperadmin ? (
                <>
                  <hr className="admin-divider" />
                  <p className="admin-danger-copy">Permanent account erasure. Cannot be undone.</p>
                  <button type="button" className="admin-btn admin-btn--danger" style={{ width: 'auto' }} disabled={saving} onClick={() => setConfirm('delete')}>
                    Delete account
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <AdminConfirmDialog
        open={confirm === 'queue'}
        title="Remove from queue?"
        message={`Remove ${profile?.name ?? formatShortId(userId)} from the live queue immediately.`}
        danger
        busy={saving}
        confirmLabel="Remove"
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runQueueRemove()}
      />
      <AdminConfirmDialog
        open={confirm === 'waitlist'}
        title="Remove from line waitlist?"
        message="They will no longer receive line-live push notifications."
        danger
        busy={saving}
        confirmLabel="Remove"
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runWaitlistRemove()}
      />
      <AdminConfirmDialog
        open={confirm === 'delete'}
        title="Delete account permanently?"
        message={
          <>
            <p>
              Removes all app data and the Supabase auth user for <strong>{profile?.name ?? formatShortId(userId, 36)}</strong>.
              Type <strong>DELETE</strong> to confirm.
            </p>
            <input className="admin-confirm-input" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="DELETE" />
          </>
        }
        danger
        busy={saving}
        confirmLabel="Delete permanently"
        confirmDisabled={deleteConfirmText !== 'DELETE'}
        onCancel={() => {
          setConfirm(null);
          setDeleteConfirmText('');
        }}
        onConfirm={() => void runDeleteAccount()}
      />
      <AdminConfirmDialog
        open={confirm === 'block'}
        title="Create user block?"
        message={
          <>
            Blocker: <span className="admin-mono">{formatShortId(blockReporterId, 36)}</span>
            <br />
            Blocked: <span className="admin-mono">{userId}</span>
          </>
        }
        danger
        busy={saving}
        confirmLabel="Block"
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runBlock()}
      />
    </AdminPageShell>
  );
}
