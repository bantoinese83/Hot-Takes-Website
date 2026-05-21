import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Brain, GitBranch, Loader2, Sparkles, X, User, Heart, AlertCircle, Trash2 } from 'lucide-react';
import { AdminPageShell } from '../components/AdminPageShell';
import { AdminRefreshButton } from '../components/AdminRefreshButton';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { AdminConfirmDialog } from '../components/AdminConfirmDialog';
import { AdminSuccessBanner } from '../components/AdminSuccessBanner';
import { AdminCopyButton } from '../components/AdminCopyButton';
import { ActivityFeedTable } from '../components/ActivityFeedTable';
import { IntelMarkdown } from '../components/IntelMarkdown';
import { useAdminAuth } from '../../lib/useAdminAuth';
import {
  addUserBlock,
  adminDeleteUser,
  fetchAdminProfile,
  fetchUserActivity,
  fetchUserRelationships,
  removeFromLineWaitlist,
  removeFromQueue,
  updateAdminProfile,
  simulatePairing,
  type AdminProfileDetail,
  type ActivityFeedItem,
  type SimulatedMatch,
  type UserRelationshipItem,
} from '../../lib/adminApi';
import { formatDateTime, formatShortId, tierLabel } from '../lib/adminFormat';
import { resolveIntelRuntime, type IntelRuntime } from '../lib/intelProvider';
import { intelChat } from '../lib/intelLlm';
import { INTEL_AGENT_MAP } from '../lib/intelAgents';

export function UserDetailPage() {
  const { adminInfo } = useAdminAuth();
  const isSuperadmin = Boolean(adminInfo?.is_superadmin);
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AdminProfileDetail | null>(null);
  const [activity, setActivity] = useState<ActivityFeedItem[]>([]);
  const [hasMoreActivity, setHasMoreActivity] = useState(false);
  const [simMatches, setSimMatches] = useState<SimulatedMatch[]>([]);
  const [loadingSim, setLoadingSim] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMoreActivity, setLoadingMoreActivity] = useState(false);
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
  const [relationships, setRelationships] = useState<UserRelationshipItem[]>([]);
  const [loadingRelationships, setLoadingRelationships] = useState(false);

  // AI Briefing State
  const [intelRuntime, setIntelRuntime] = useState<IntelRuntime | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState('');
  const [showAi, setShowAi] = useState(false);

  useEffect(() => {
    void resolveIntelRuntime().then(setIntelRuntime);
  }, []);

  const runAiAnalysis = async () => {
    if (!profile || !intelRuntime?.canRun) return;
    setAiLoading(true);
    setAiOutput('');
    setShowAi(true);

    const agent = INTEL_AGENT_MAP['user-analyst'];
    const contextJson = JSON.stringify({
      user: profile,
      activity_recent: activity.slice(0, 50),
    }, null, 2);

    try {
      await intelChat({
        provider: intelRuntime.provider,
        ollamaModels: intelRuntime.ollamaModels,
        ollamaModel: agent.model,
        messages: [
          { role: 'system', content: agent.systemPrompt },
          { role: 'user', content: `USER DATA:\n${contextJson}\n\nAnalyze this user.` }
        ],
        onToken: (t) => setAiOutput(prev => prev + t),
      });
    } catch (err) {
      setAiOutput('AI analysis failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAiLoading(false);
    }
  };

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const [p, actRes] = await Promise.all([
        fetchAdminProfile(userId),
        fetchUserActivity(userId, 50, 0),
      ]);
      setProfile(p);
      setActivity(actRes.activity);
      setHasMoreActivity(actRes.has_more);
      setTier(p.subscription_tier ?? 'free');
      setNotifyLine(Boolean(p.notify_line_live));
      setKeepAway(Boolean(p.keep_matching_when_away));
      setOpsNote(p.admin_ops_note ?? '');

      // Load simulation
      setLoadingSim(true);
      const sim = await simulatePairing(userId);
      setSimMatches(sim.top_matches);

      // Load relationship graph
      setLoadingRelationships(true);
      try {
        const rel = await fetchUserRelationships(userId);
        setRelationships(rel.items);
      } catch {
        // Non-fatal
      } finally {
        setLoadingRelationships(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
      setLoadingSim(false);
    }
  }, [userId]);


  const onLoadMoreActivity = async () => {
    if (!userId || loadingMoreActivity) return;
    setLoadingMoreActivity(true);
    try {
      const res = await fetchUserActivity(userId, 50, activity.length);
      setActivity((prev) => [...prev, ...res.activity]);
      setHasMoreActivity(res.has_more);
    } catch (err) {
      console.error('Failed to load more activity:', err);
    } finally {
      setLoadingMoreActivity(false);
    }
  };

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
      actions={
        <div className="admin-action-row">
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            style={{ borderColor: 'rgba(255, 84, 78, 0.4)' }}
            disabled={!intelRuntime?.canRun || loading || aiLoading}
            onClick={() => void runAiAnalysis()}
          >
            {aiLoading ? (
              <Loader2 size={15} className="admin-spin" />
            ) : (
              <Brain size={15} style={{ color: 'var(--color-accent)' }} />
            )}
            Analyze user
          </button>
          <AdminRefreshButton onClick={() => void load()} loading={loading} />
        </div>
      }
    >
      {showAi && (
        <div className="admin-panel intel-output" style={{ marginBottom: '1.25rem', borderColor: 'rgba(255, 84, 78, 0.3)' }}>
          <div className="admin-panel-header" style={{ borderBottomColor: 'rgba(255, 84, 78, 0.15)' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} style={{ color: 'var(--color-accent)' }} />
              Behavioral analysis
            </h2>
            <button type="button" className="admin-btn admin-btn--ghost admin-btn--compact" onClick={() => setShowAi(false)}>
              <X size={14} />
            </button>
          </div>
          <div className="intel-markdown" style={{ padding: '1rem' }}>
            {aiOutput ? (
              <IntelMarkdown content={aiOutput} />
            ) : (
              <div className="admin-loading" style={{ padding: '1rem' }}>
                <Loader2 size={24} className="admin-spin" style={{ margin: '0 auto 0.5rem' }} />
                <p>Consulting Intel team…</p>
              </div>
            )}
          </div>
        </div>
      )}

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
        <>
          <div className="admin-grid-2">
            <div className="admin-panel">
              <div className="admin-panel-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="admin-avatar-lg" />
                ) : (
                  <div className="admin-avatar-lg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--border-color)', color: 'var(--text-muted)' }}>
                    <User size={32} />
                  </div>
                )}
                <div>
                  <h2 style={{ marginBottom: '0.15rem' }}>{profile.name ?? 'Unnamed User'}</h2>
                  <div className="admin-id-row">
                    <span className="admin-panel-meta">{profile.id}</span>
                    <AdminCopyButton value={profile.id} />
                  </div>
                </div>
              </div>
              
              <div style={{ padding: '1rem' }}>
                <h3 className="admin-section-title">Identity & Bio</h3>
                <dl className="admin-dl">
                  <dt>Hot take</dt>
                  <dd style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>"{profile.hot_take ?? '—'}"</dd>
                  <dt>Category</dt>
                  <dd>{profile.hot_take_category ?? '—'}</dd>
                  <dt>Gender</dt>
                  <dd>{profile.gender_identity ?? '—'}</dd>
                  <dt>Birthdate</dt>
                  <dd>{profile.birthdate ? `${profile.birthdate} (${Math.floor((new Date().getTime() - new Date(profile.birthdate).getTime()) / 31557600000)} y/o)` : '—'}</dd>
                  <dt>Ethnicity</dt>
                  <dd>{profile.ethnicity_self?.join(', ') || '—'}</dd>
                  <dt>Religion</dt>
                  <dd>{profile.religion_self ?? '—'}</dd>
                  <dt>Politics</dt>
                  <dd>{profile.politics_self ?? '—'}</dd>
                  <dt>Intent</dt>
                  <dd>{profile.intent_self ?? '—'}</dd>
                  <dt>Height</dt>
                  <dd>{profile.height_cm ? `${profile.height_cm} cm` : '—'}</dd>
                  <dt>Kids / Smoking</dt>
                  <dd>{profile.kids_self ?? '—'} / {profile.smoking_self ?? '—'}</dd>
                  <dt>Matching ready</dt>
                  <dd>{profile.matching_profile_completed_at ? formatDateTime(profile.matching_profile_completed_at) : 'No'}</dd>
                  <dt>Age affirmed</dt>
                  <dd>{profile.age_affirmed_at ? formatDateTime(profile.age_affirmed_at) : 'No'}</dd>
                </dl>

                <h3 className="admin-section-title" style={{ marginTop: '1.5rem' }}>Photos</h3>
                <div className="admin-profile-photo-grid">
                  {(profile.profile_photo_urls || []).map((url, i) => (
                    <img key={i} src={url} alt="" className="admin-profile-photo" />
                  ))}
                  {(!profile.profile_photo_urls || profile.profile_photo_urls.length === 0) && (
                    <p className="admin-empty" style={{ gridColumn: '1 / -1' }}>No profile photos uploaded.</p>
                  )}
                </div>
              </div>
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
                <button type="button" className="admin-btn admin-btn--primary" style={{ width: 'auto' }} disabled={saving} onClick={() => void onSave()}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>

                <hr className="admin-divider" />

                <h3 className="admin-section-title">System Status</h3>
                <dl className="admin-dl admin-dl--compact">
                  <dt>In queue</dt>
                  <dd>{profile.in_queue ? <span className="admin-badge">{profile.queue_status ?? 'waiting'}</span> : 'No'}</dd>
                  <dt>Location</dt>
                  <dd>{profile.location_label ?? '—'} <span className="admin-panel-meta">({profile.latitude?.toFixed(2)}, {profile.longitude?.toFixed(2)})</span></dd>
                  <dt>Ready</dt>
                  <dd>{profile.matching_profile_completed_at ? 'Yes' : 'No'}</dd>
                  <dt>Contrarian</dt>
                  <dd>{profile.match_contrarian_mode ? 'On' : 'Off'}</dd>
                </dl>

                <div className="admin-action-row" style={{ marginTop: '1rem' }}>
                  <button type="button" className="admin-btn admin-btn--ghost" disabled={!profile.in_queue || saving} onClick={() => setConfirm('queue')}>
                    Remove from queue
                  </button>
                  <button type="button" className="admin-btn admin-btn--ghost" disabled={!profile.on_line_waitlist || saving} onClick={() => setConfirm('waitlist')}>
                    Remove line waitlist
                  </button>
                </div>

                {isSuperadmin && (
                  <>
                    <hr className="admin-divider" />
                    <p className="admin-danger-copy" style={{ marginBottom: '0.5rem' }}>Permanent account erasure. Cannot be undone.</p>
                    <button type="button" className="admin-btn admin-btn--danger" style={{ width: 'auto' }} disabled={saving} onClick={() => setConfirm('delete')}>
                      <Trash2 size={14} />
                      Delete account
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="admin-grid-2" style={{ marginTop: '1.25rem' }}>
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Heart size={16} style={{ color: 'var(--color-accent)' }} />
                  Top potential matches
                </h2>
                <span className="admin-panel-meta">Simulated rank</span>
              </div>
              <div style={{ padding: '0.75rem' }}>
                <div className="admin-hint-card" style={{ marginBottom: '1rem', background: 'rgba(255, 255, 255, 0.03)' }}>
                  <div style={{ display: 'flex', gap: '0.65rem' }}>
                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--text-muted)' }} />
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      This simulation ranks active profiles based on your current <strong>pairing weights</strong>. 
                      Lower scores indicate stronger potential matches.
                    </p>
                  </div>
                </div>

                {loadingSim ? (
                  <div className="admin-loading"><Loader2 className="admin-spin" /></div>
                ) : simMatches.length === 0 ? (
                  <p className="admin-empty">No potential matches found.</p>
                ) : (
                  simMatches.map((m) => (
                    <Link key={m.id} to={`/admin/users/${m.id}`} className="admin-simulate-card admin-link-silent">
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt="" className="admin-avatar-sm" />
                      ) : (
                        <div className="admin-avatar-sm admin-avatar-sm--fallback">{m.name?.charAt(0) || '?'}</div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{m.name || 'Unnamed'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {m.location_label || 'Unknown'} • {m.compatible ? <span style={{ color: '#4ade80' }}>Compatible</span> : <span style={{ color: '#f87171' }}>Incompatible</span>}
                        </div>
                      </div>
                      <div className="admin-simulate-score">
                        <span className="admin-simulate-score-val">{m.score.toFixed(3)}</span>
                        <span className="admin-simulate-score-label">Score</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              <p className="admin-footnote" style={{ padding: '0 0.75rem 0.75rem' }}>
                Simulation uses current <strong>pairing weights</strong>. Lower score is better.
              </p>
            </div>

            <div className="admin-panel">
              <div className="admin-panel-header">
                <h2>User activity timeline</h2>
                <span className="admin-panel-meta">Aggregated events</span>
              </div>
              <ActivityFeedTable items={activity} />
              {hasMoreActivity && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    disabled={loadingMoreActivity}
                    onClick={() => void onLoadMoreActivity()}
                  >
                    {loadingMoreActivity ? 'Loading…' : 'Load more activity'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Relationship graph panel */}
          {relationships.length > 0 || loadingRelationships ? (
            <div className="admin-panel" style={{ marginTop: '1.25rem' }}>
              <div className="admin-panel-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <GitBranch size={16} style={{ color: 'var(--color-secondary)' }} />
                  Interaction history
                </h2>
                <span className="admin-panel-meta">
                  {loadingRelationships ? '…' : `${relationships.length} interactions`}
                </span>
              </div>
              {loadingRelationships ? (
                <p className="admin-loading">Loading relationships…</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table admin-table--compact">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Partner</th>
                        <th>Outcome</th>
                        <th>Detail</th>
                        <th>When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relationships.map((item, i) => {
                        const typeConfig = {
                          date: { label: 'Date', color: '#83cfff', bg: 'rgba(131,207,255,0.12)' },
                          block: { label: 'Block', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
                          report_filed: { label: 'Report filed', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
                          report_received: { label: 'Report received', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
                        }[item.type];
                        return (
                          <tr key={`${item.type}-${item.partner_id}-${i}`}>
                            <td>
                              <span
                                style={{
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: 20,
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  color: typeConfig.color,
                                  background: typeConfig.bg,
                                }}
                              >
                                {typeConfig.label}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                {item.partner_avatar ? (
                                  <img src={item.partner_avatar} alt="" className="admin-avatar-sm" style={{ width: 22, height: 22 }} />
                                ) : (
                                  <div
                                    style={{
                                      width: 22, height: 22, borderRadius: '50%',
                                      background: 'var(--border-color)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                  >
                                    <User size={11} style={{ color: 'var(--text-muted)' }} />
                                  </div>
                                )}
                                <Link
                                  to={`/admin/users/${item.partner_id}`}
                                  className="admin-link"
                                  style={{ fontSize: '0.82rem' }}
                                >
                                  {item.partner_name ?? formatShortId(item.partner_id)}
                                </Link>
                              </div>
                            </td>
                            <td>
                              {item.outcome ? (
                                <span className="admin-badge admin-badge--muted" style={{ fontSize: '0.72rem' }}>
                                  {item.outcome}
                                </span>
                              ) : '—'}
                            </td>
                            <td style={{ maxWidth: 160, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {item.detail ?? '—'}
                            </td>
                            <td className="admin-panel-meta">{formatDateTime(item.at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </>
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
