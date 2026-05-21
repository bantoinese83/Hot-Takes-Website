import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../lib/useAdminAuth';
import { isSupabaseConfigured } from '../../lib/supabase';
import '../admin.css';

export function AdminLoginPage() {
  const { session, isAdmin, signIn, error, loading } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/admin';

  useEffect(() => {
    if (!loading && session && isAdmin) {
      navigate(from, { replace: true });
    }
  }, [loading, session, isAdmin, from, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login-shell">
      <div className="admin-login-card">
        <h1>Hot Take Admin</h1>
        <p>
          Sign in with your allowlisted Supabase Auth account. First-time admins must use the same email as in{' '}
          <code>website_admins</code>.
        </p>
        {!isSupabaseConfigured ? (
          <p className="admin-error">Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.</p>
        ) : null}
        {(localError || error) && !isAdmin ? <p className="admin-error">{localError ?? error}</p> : null}
        <form onSubmit={(e) => void onSubmit(e)}>
          <div className="admin-field">
            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="admin-field">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="admin-btn admin-btn--primary" disabled={submitting || !isSupabaseConfigured}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p style={{ marginTop: '1.25rem', fontSize: '0.85rem' }}>
          <Link to="/">← Marketing site</Link>
        </p>
      </div>
    </div>
  );
}
