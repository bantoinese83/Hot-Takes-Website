import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { AdminSessionInfo } from './adminApi';

export type AdminAuthContextValue = {
  session: Session | null;
  adminInfo: AdminSessionInfo | null;
  isAdmin: boolean;
  isSuperadmin: boolean;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
};

export const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
