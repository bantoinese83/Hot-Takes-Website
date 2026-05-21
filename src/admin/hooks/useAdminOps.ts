import { createContext, useContext } from 'react';
import type { AdminOpsSnapshot } from './useAdminOpsSnapshot';

export const AdminOpsContext = createContext<AdminOpsSnapshot | null>(null);

export function useAdminOps(): AdminOpsSnapshot {
  const ctx = useContext(AdminOpsContext);
  if (!ctx) {
    throw new Error('useAdminOps must be used within AdminOpsProvider');
  }
  return ctx;
}
