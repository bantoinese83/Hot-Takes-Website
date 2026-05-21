import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import { adminLinkSession, type AdminSessionInfo } from './adminApi';
import { AdminAuthContext } from './useAdminAuth';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [adminInfo, setAdminInfo] = useState<AdminSessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAdmin = useCallback(async () => {
    if (!session) {
      setAdminInfo(null);
      return;
    }
    try {
      const info = await adminLinkSession();
      setAdminInfo(info);
      if (!info.is_admin) {
        setError('This account is not on the Hot Take admin allowlist.');
      } else {
        setError(null);
      }
    } catch (err) {
      setAdminInfo(null);
      setError(err instanceof Error ? err.message : 'Failed to verify admin access.');
    }
  }, [session]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setAdminInfo(null);
      return;
    }
    void refreshAdmin();
  }, [session, refreshAdmin]);

  const isAdmin = !!adminInfo?.is_admin;
  const isSuperadmin = !!adminInfo?.is_superadmin;

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured. Check your .env file.');
    }
    setError(null);
    setLoading(true);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInErr) throw signInErr;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
      setLoading(false);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setAdminInfo(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      adminInfo,
      isAdmin,
      isSuperadmin,
      loading,
      error,
      signIn,
      signOut,
      refreshAdmin,
    }),
    [session, adminInfo, isAdmin, isSuperadmin, loading, error, signIn, signOut, refreshAdmin],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
