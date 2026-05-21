import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AdminPageShell } from '../components/AdminPageShell';
import { AdminRefreshButton } from '../components/AdminRefreshButton';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { AdminConfirmDialog } from '../components/AdminConfirmDialog';
import {
  addWebsiteAdmin,
  listWebsiteAdmins,
  removeWebsiteAdmin,
  type WebsiteAdminRow,
} from '../../lib/adminApi';
import { useAdminAuth } from '../../lib/useAdminAuth';

export function SettingsPage() {
  const { adminInfo } = useAdminAuth();
  const [admins, setAdmins] = useState<WebsiteAdminRow[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'superadmin'>('admin');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [removeEmail, setRemoveEmail] = useState<string | null>(null);

  const isSuperadmin = adminInfo?.is_superadmin ?? adminInfo?.role === 'superadmin';

  const load = useCallback(async () => {
    if (!isSuperadmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await listWebsiteAdmins();
      setAdmins(res.admins ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  }, [isSuperadmin]);

  useEffect(() => {
    void load();
  }, [load]);

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await addWebsiteAdmin(email, role);
      setEmail('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add admin');
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async () => {
    if (!removeEmail) return;
    setBusy(true);
    try {
      await removeWebsiteAdmin(removeEmail);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove admin');
    } finally {
      setBusy(false);
      setRemoveEmail(null);
    }
  };

  if (!isSuperadmin) {
    return (
      <AdminPageShell title="Settings" subtitle="Admin access management">
        <p className="admin-empty">Superadmin role required to manage website admins.</p>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      title="Settings"
      subtitle="Manage who can access this ops console"
      actions={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
    >
        {error ? <AdminErrorBanner message={error} /> : null}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2>Add admin</h2>
          </div>
          <form className="admin-form-stack" style={{ padding: '1rem' }} onSubmit={(e) => void onAdd(e)}>
            <label className="admin-field">
              <span>Email (must match Supabase Auth)</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label className="admin-field">
              <span>Role</span>
              <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'superadmin')}>
                <option value="admin">admin</option>
                <option value="superadmin">superadmin</option>
              </select>
            </label>
            <button type="submit" className="admin-btn admin-btn--primary" style={{ width: 'auto' }} disabled={busy}>
              Add / update
            </button>
          </form>
        </div>
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h2>Allowlist</h2>
          </div>
          {loading ? (
            <p className="admin-loading">Loading…</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Last seen</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a) => (
                    <tr key={a.id}>
                      <td>{a.email}</td>
                      <td>
                        <span className="admin-badge">{a.role}</span>
                      </td>
                      <td>{a.last_seen_at ? new Date(a.last_seen_at).toLocaleString() : '—'}</td>
                      <td>
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                          disabled={a.email === adminInfo?.email}
                          onClick={() => setRemoveEmail(a.email)}
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
      <AdminConfirmDialog
        open={Boolean(removeEmail)}
        title="Remove admin?"
        message={`Remove ${removeEmail} from website_admins?`}
        danger
        busy={busy}
        confirmLabel="Remove"
        onCancel={() => setRemoveEmail(null)}
        onConfirm={() => void onRemove()}
      />
    </AdminPageShell>
  );
}
