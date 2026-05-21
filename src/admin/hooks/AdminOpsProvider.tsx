import { type ReactNode } from 'react';
import { useAdminOpsSnapshot } from './useAdminOpsSnapshot';
import { AdminOpsContext } from './useAdminOps';

export function AdminOpsProvider({ children }: { children: ReactNode }) {
  const snapshot = useAdminOpsSnapshot(45_000);
  return <AdminOpsContext.Provider value={snapshot}>{children}</AdminOpsContext.Provider>;
}
