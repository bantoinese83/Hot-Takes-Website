import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  ExternalLink,
  Flame,
  Globe,
  Mail,
  MapPin,
  Rocket,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { AdminPageShell } from '../components/AdminPageShell';
import { AdminRefreshButton } from '../components/AdminRefreshButton';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { AdminSuccessBanner } from '../components/AdminSuccessBanner';
import { AdminStatCard } from '../components/AdminStatCard';
import { AdminConfirmDialog } from '../components/AdminConfirmDialog';
import { GrowthSignupChart } from '../components/GrowthSignupChart';
import {
  bucketApproxLabel,
  downloadCsv,
  filterByQuery,
  maskEmailForDisplay,
} from '../lib/growthHelpers';
import { formatDateTime, formatRelativeTime, formatShortId, tierLabel, asArray } from '../lib/adminFormat';
import { useAdminAuth } from '../../lib/useAdminAuth';
import {
  deleteLaunchWaitlistSignup,
  fetchGrowthSnapshot,
  removeFromLineWaitlist,
  updateAdminProfile,
  updateLaunchSettings,
  type GrowthSnapshot,
  type LaunchWaitlistDailyBucket,
  type LaunchWaitlistGeoBucket,
  type LaunchWaitlistSignupRow,
  type LaunchWaitlistSourceBucket,
  type LineWaitlistRow,
  type PlusWaitlistRow,
} from '../../lib/adminApi';

type GrowthTab = 'launch' | 'line' | 'plus';

function LaunchProgressBar({ percent, unlocked }: { percent: number; unlocked: boolean }) {
  const p = Math.min(100, Math.max(0, percent));
  return (
    <div
      className={`growth-launch-bar${unlocked ? ' growth-launch-bar--unlocked' : ''}`}
      role="progressbar"
      aria-valuenow={p}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="growth-launch-bar-fill" style={{ width: `${p}%` }} />
    </div>
  );
}

export function GrowthPage() {
  const { adminInfo } = useAdminAuth();
  const isSuperadmin = Boolean(adminInfo?.is_superadmin);

  const [snapshot, setSnapshot] = useState<GrowthSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<GrowthTab>('launch');
  const [search, setSearch] = useState('');
  const [revealEmails, setRevealEmails] = useState(false);
  const [goalDraft, setGoalDraft] = useState('');
  const [headlineDraft, setHeadlineDraft] = useState('');
  const [deleteSignupId, setDeleteSignupId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchGrowthSnapshot();
      setSnapshot(res);
      const prog = res.launch?.progress;
      if (prog) {
        setGoalDraft(String(prog.waitlist_goal ?? ''));
        setHeadlineDraft(prog.headline ?? '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load growth data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const launch = snapshot?.launch;
  const progress = launch?.progress;
  const line = asArray<LineWaitlistRow>(snapshot?.line_waitlist);
  const plus = asArray<PlusWaitlistRow>(snapshot?.plus_waitlist);
  const launchRecent = asArray<LaunchWaitlistSignupRow>(launch?.recent);

  const filteredLaunch = useMemo(
    () =>
      filterByQuery(launchRecent, search, (r) =>
        [r.email, r.source, r.id, bucketApproxLabel(r.lat_bucket, r.lng_bucket)].join(' '),
      ),
    [launchRecent, search],
  );

  const filteredLine = useMemo(
    () =>
      filterByQuery(line, search, (r) =>
        [r.name, r.user_id, r.location_label ?? '', r.notify_line_live ? 'notify' : ''].join(' '),
      ),
    [line, search],
  );

  const filteredPlus = useMemo(
    () =>
      filterByQuery(plus, search, (r) =>
        [r.name, r.user_id, r.location_label ?? '', r.subscription_tier ?? ''].join(' '),
      ),
    [plus, search],
  );

  const geoPct =
    launch && launch.total > 0 ? Math.round((100 * launch.with_geo_count) / launch.total) : 0;

  const exportLaunchCsv = () => {
    downloadCsv(
      `launch-waitlist-${new Date().toISOString().slice(0, 10)}.csv`,
      ['email', 'source', 'created_at', 'lat_bucket', 'lng_bucket'],
      launchRecent.map((r) => [
        r.email,
        r.source,
        r.created_at,
        r.lat_bucket != null ? String(r.lat_bucket) : '',
        r.lng_bucket != null ? String(r.lng_bucket) : '',
      ]),
    );
  };

  const saveLaunchSettings = async (e: FormEvent) => {
    e.preventDefault();
    const goal = Number(goalDraft);
    if (!Number.isFinite(goal) || goal < 1) {
      setError('Waitlist goal must be a positive number');
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await updateLaunchSettings({
        waitlist_goal: goal,
        headline: headlineDraft.trim() || undefined,
      });
      setSuccess('Launch gate settings saved');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save settings');
    } finally {
      setBusy(false);
    }
  };

  const toggleReleased = async () => {
    if (!progress) return;
    setBusy(true);
    setError(null);
    try {
      await updateLaunchSettings({ is_released: !progress.unlocked });
      setSuccess(progress.unlocked ? 'Launch gate locked again' : 'App marked as released');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Release toggle failed');
    } finally {
      setBusy(false);
    }
  };

  const confirmDeleteSignup = async () => {
    if (!deleteSignupId) return;
    setBusy(true);
    setError(null);
    try {
      await deleteLaunchWaitlistSignup(deleteSignupId);
      setSuccess('Signup removed');
      setDeleteSignupId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const subtitle = progress
    ? `${progress.signup_count.toLocaleString()} / ${progress.waitlist_goal.toLocaleString()} iOS launch · ${line.length} line · ${plus.length} Plus`
    : `${line.length} line notify · ${plus.length} Plus interest`;

  return (
    <AdminPageShell
      title="Growth & waitlists"
      subtitle={subtitle}
      actions={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
    >
      {error ? <AdminErrorBanner message={error} /> : null}
      {success ? <AdminSuccessBanner message={success} onDismiss={() => setSuccess(null)} /> : null}

      {snapshot?.as_of ? (
        <p className="admin-live-meta">
          Live data · updated {formatRelativeTime(snapshot.as_of)} ago
        </p>
      ) : null}

      {!launch && !loading ? (
        <p className="admin-hint-banner">
          Deploy migration <code>20260530120000_admin_growth_launch_waitlist.sql</code> for iOS launch
          waitlist stats, charts, and gate controls.
        </p>
      ) : null}

      {progress ? (
        <section className="growth-launch-hero admin-panel">
          <div className="growth-launch-hero-top">
            <div>
              <p className="growth-launch-eyebrow">
                <Rocket size={14} aria-hidden />
                iOS launch gate
                {progress.unlocked ? (
                  <span className="growth-badge growth-badge--ok">Unlocked</span>
                ) : (
                  <span className="growth-badge">{progress.remaining.toLocaleString()} to go</span>
                )}
              </p>
              <h2 className="growth-launch-title">{progress.headline}</h2>
              <p className="growth-launch-sub">
                Marketing meter mirrors <code>get_launch_waitlist_progress</code>
                {progress.released_at ? ` · released ${formatDateTime(progress.released_at)}` : ''}
              </p>
            </div>
            <a href="/" target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn--ghost">
              <ExternalLink size={14} aria-hidden />
              View site meter
            </a>
          </div>
          <LaunchProgressBar percent={progress.percent} unlocked={progress.unlocked} />
          <p className="growth-launch-counts">
            <Flame size={14} aria-hidden />
            <strong>{progress.signup_count.toLocaleString()}</strong>
            <span> / {progress.waitlist_goal.toLocaleString()} signups ({progress.percent}%)</span>
          </p>
        </section>
      ) : null}

      <div className="admin-stat-grid growth-stat-grid">
        <AdminStatCard
          label="Launch signups"
          value={launch?.total ?? (loading ? '…' : '—')}
          sub={launch ? `${launch.signups_24h} today · ${launch.signups_7d} this week` : 'iOS marketing waitlist'}
          highlight={Boolean(progress?.unlocked)}
        />
        <AdminStatCard
          label="With map location"
          value={launch ? `${geoPct}%` : '—'}
          sub={launch ? `${launch.with_geo_count} of ${launch.total} signups` : undefined}
        />
        <AdminStatCard label="Line notifications" value={line.length} sub="Users waiting for line density" />
        <AdminStatCard label="Plus interest" value={plus.length} sub="In-app Plus waitlist tier" />
      </div>

      {launch ? (
        <div className="admin-grid-2 growth-charts-row">
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2>Signups (30 days)</h2>
            </div>
            <GrowthSignupChart data={asArray<LaunchWaitlistDailyBucket>(launch.daily)} />
          </div>
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2>By source</h2>
            </div>
            {asArray<LaunchWaitlistSourceBucket>(launch.by_source).length === 0 ? (
              <p className="admin-empty">No source breakdown yet.</p>
            ) : (
              <ul className="growth-source-list">
                {asArray<LaunchWaitlistSourceBucket>(launch.by_source).map((s) => (
                  <li key={s.source}>
                    <span className="growth-source-name">{s.source}</span>
                    <span className="growth-source-bar-wrap">
                      <span
                        className="growth-source-bar"
                        style={{
                          width: `${Math.max(4, (100 * s.signups) / Math.max(launch.total, 1))}%`,
                        }}
                      />
                    </span>
                    <span className="growth-source-count">{s.signups}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {launch && asArray<LaunchWaitlistGeoBucket>(launch.geo_buckets).length > 0 ? (
        <div className="admin-panel growth-geo-panel">
          <div className="admin-panel-header">
            <h2>
              <MapPin size={16} aria-hidden />
              Top map clusters
            </h2>
            <span className="admin-panel-meta">~0.1° privacy buckets</span>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table admin-table--compact">
              <thead>
                <tr>
                  <th>Approx. cell</th>
                  <th>Signups</th>
                </tr>
              </thead>
              <tbody>
                {asArray<LaunchWaitlistGeoBucket>(launch.geo_buckets)
                  .slice(0, 12)
                  .map((b) => (
                    <tr key={`${b.lat_bucket}-${b.lng_bucket}`}>
                      <td>{bucketApproxLabel(b.lat_bucket, b.lng_bucket)}</td>
                      <td>{b.signup_count}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {isSuperadmin && progress ? (
        <div className="admin-panel growth-settings-panel">
          <div className="admin-panel-header">
            <h2>Launch gate controls</h2>
            <span className="admin-panel-meta">Superadmin</span>
          </div>
          <form className="growth-settings-form" onSubmit={(e) => void saveLaunchSettings(e)}>
            <label>
              Waitlist goal
              <input
                type="number"
                min={1}
                value={goalDraft}
                onChange={(e) => setGoalDraft(e.target.value)}
                disabled={busy}
              />
            </label>
            <label>
              Marketing headline
              <input
                type="text"
                value={headlineDraft}
                onChange={(e) => setHeadlineDraft(e.target.value)}
                placeholder="Unlock Hot Take on iOS"
                disabled={busy}
              />
            </label>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
              Save settings
            </button>
            <button
              type="button"
              className={`admin-btn${progress.unlocked ? ' admin-btn--ghost' : ' admin-btn--primary'}`}
              disabled={busy}
              onClick={() => void toggleReleased()}
            >
              {progress.unlocked ? 'Lock gate (manual)' : 'Force release app'}
            </button>
          </form>
        </div>
      ) : null}

      <div className="growth-toolbar">
        <div className="admin-segmented" role="tablist" aria-label="Waitlist views">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'launch'}
            className={tab === 'launch' ? 'admin-segmented-btn admin-segmented-btn--active' : 'admin-segmented-btn'}
            onClick={() => setTab('launch')}
          >
            <Mail size={14} aria-hidden />
            Launch ({launchRecent.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'line'}
            className={tab === 'line' ? 'admin-segmented-btn admin-segmented-btn--active' : 'admin-segmented-btn'}
            onClick={() => setTab('line')}
          >
            <Users size={14} aria-hidden />
            Line ({line.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'plus'}
            className={tab === 'plus' ? 'admin-segmented-btn admin-segmented-btn--active' : 'admin-segmented-btn'}
            onClick={() => setTab('plus')}
          >
            <Globe size={14} aria-hidden />
            Plus ({plus.length})
          </button>
        </div>

        <form
          className="admin-search-row growth-search"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <Search size={16} aria-hidden className="growth-search-icon" />
          <input
            type="search"
            placeholder={
              tab === 'launch' ? 'Filter emails, source, id…' : 'Filter name, location, id…'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        {tab === 'launch' && launchRecent.length > 0 ? (
          <div className="growth-toolbar-actions">
            <label className="growth-reveal-toggle">
              <input
                type="checkbox"
                checked={revealEmails}
                onChange={(e) => setRevealEmails(e.target.checked)}
              />
              Show full emails
            </label>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={exportLaunchCsv}>
              <Download size={14} aria-hidden />
              Export CSV
            </button>
          </div>
        ) : null}
      </div>

      {tab === 'launch' ? (
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2>iOS launch waitlist</h2>
            <span className="admin-panel-meta">
              {filteredLaunch.length} shown
              {search ? ` (filtered from ${launchRecent.length})` : ''}
            </span>
          </div>
          {loading ? (
            <p className="admin-loading">Loading…</p>
          ) : !launch ? (
            <p className="admin-empty">Launch waitlist data unavailable until migration is deployed.</p>
          ) : filteredLaunch.length === 0 ? (
            <p className="admin-empty">
              {launchRecent.length === 0 ? 'No marketing signups yet.' : 'No rows match your filter.'}
            </p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Source</th>
                    <th>Joined</th>
                    <th>Map</th>
                    {isSuperadmin ? <th></th> : null}
                  </tr>
                </thead>
                <tbody>
                  {filteredLaunch.map((r) => (
                    <tr key={r.id}>
                      <td className="growth-email-cell">
                        {maskEmailForDisplay(r.email, revealEmails)}
                      </td>
                      <td>
                        <span className="growth-source-chip">{r.source}</span>
                      </td>
                      <td>{formatDateTime(r.created_at)}</td>
                      <td>
                        {r.lat_bucket != null ? (
                          <span className="growth-geo-yes" title={bucketApproxLabel(r.lat_bucket, r.lng_bucket)}>
                            <MapPin size={12} aria-hidden />
                            Yes
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      {isSuperadmin ? (
                        <td>
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost admin-btn--danger"
                            disabled={busy}
                            title="Remove signup"
                            onClick={() => setDeleteSignupId(r.id)}
                          >
                            <Trash2 size={14} aria-hidden />
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {tab === 'line' ? (
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2>Line live notifications</h2>
            <span className="admin-panel-meta">{filteredLine.length} users</span>
          </div>
          {loading ? (
            <p className="admin-loading">Loading…</p>
          ) : filteredLine.length === 0 ? (
            <p className="admin-empty">
              {line.length === 0 ? 'No one on the line waitlist.' : 'No rows match your filter.'}
            </p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Joined</th>
                    <th>Last notified</th>
                    <th>Notify flag</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLine.map((r) => (
                    <tr key={r.user_id}>
                      <td>
                        <Link to={`/admin/users/${r.user_id}`} className="admin-link">
                          {r.name ?? formatShortId(r.user_id)}
                        </Link>
                      </td>
                      <td>{r.location_label ?? '—'}</td>
                      <td>{formatDateTime(r.created_at)}</td>
                      <td>{r.last_notified_at ? formatDateTime(r.last_notified_at) : '—'}</td>
                      <td>{r.notify_line_live ? 'On' : 'Off'}</td>
                      <td>
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost"
                          disabled={busy}
                          onClick={() => {
                            setBusy(true);
                            void removeFromLineWaitlist(r.user_id)
                              .then(() => load())
                              .catch((err) =>
                                setError(err instanceof Error ? err.message : 'Remove failed'),
                              )
                              .finally(() => setBusy(false));
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {tab === 'plus' ? (
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2>Plus waitlist</h2>
            <span className="admin-panel-meta">{filteredPlus.length} users</span>
          </div>
          {loading ? (
            <p className="admin-loading">Loading…</p>
          ) : filteredPlus.length === 0 ? (
            <p className="admin-empty">
              {plus.length === 0 ? 'No Plus waitlist signups yet.' : 'No rows match your filter.'}
            </p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Joined</th>
                    <th>Tier</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlus.map((r) => (
                    <tr key={r.user_id}>
                      <td>
                        <Link to={`/admin/users/${r.user_id}`} className="admin-link">
                          {r.name ?? formatShortId(r.user_id)}
                        </Link>
                      </td>
                      <td>{r.location_label ?? '—'}</td>
                      <td>{r.plus_waitlisted_at ? formatDateTime(r.plus_waitlisted_at) : '—'}</td>
                      <td>{tierLabel(r.subscription_tier)}</td>
                      <td>
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost"
                          disabled={busy}
                          onClick={() => {
                            setBusy(true);
                            void updateAdminProfile(r.user_id, { subscription_tier: 'free' })
                              .then(() => load())
                              .catch((err) =>
                                setError(err instanceof Error ? err.message : 'Update failed'),
                              )
                              .finally(() => setBusy(false));
                          }}
                        >
                          Clear Plus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      <AdminConfirmDialog
        open={deleteSignupId != null}
        title="Remove launch signup?"
        message="This deletes the email from the marketing waitlist and refreshes the public counter. Cannot be undone."
        confirmLabel="Delete"
        danger
        busy={busy}
        onCancel={() => setDeleteSignupId(null)}
        onConfirm={() => void confirmDeleteSignup()}
      />
    </AdminPageShell>
  );
}
