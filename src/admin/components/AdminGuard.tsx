import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../lib/useAdminAuth';

export function AdminGuard() {
  const { session, isAdmin, loading, error, signOut } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="admin-login-shell">
        <p className="admin-loading">Checking session…</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return (
      <div className="admin-login-shell">
        <div className="admin-login-card">
          <h1>Access denied</h1>
          <p>{error ?? 'Your account is not allowlisted for the Hot Take admin dashboard.'}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Sign in with the email in <code>website_admins</code> (same as Supabase Auth).
          </p>
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            style={{ marginTop: '1rem' }}
            onClick={() => {
              void signOut().then(() => navigate('/admin/login'));
            }}
          >
            Sign out and try another account
          </button>
          <p style={{ marginTop: '1rem' }}>
            <a href="/">← Marketing site</a>
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
