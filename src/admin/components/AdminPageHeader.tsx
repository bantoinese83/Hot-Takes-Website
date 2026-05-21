import type { ReactNode } from 'react';
import { AdminBreadcrumb, type AdminBreadcrumbItem } from './AdminBreadcrumb';
import { useAdminOps } from '../hooks/useAdminOps';
import { formatRelativeTime } from '../lib/adminFormat';

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumbs?: AdminBreadcrumbItem[];
};

export function AdminPageHeader({ title, subtitle, actions, breadcrumbs }: Props) {
  const { refreshedAt } = useAdminOps();

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-main">
        {breadcrumbs && breadcrumbs.length > 0 ? <AdminBreadcrumb items={breadcrumbs} /> : null}
        <h1>{title}</h1>
        {subtitle ? <p className="admin-topbar-subtitle">{subtitle}</p> : null}
        {refreshedAt ? (
          <p className="admin-topbar-meta">Live data · updated {formatRelativeTime(refreshedAt.toISOString())}</p>
        ) : null}
      </div>
      {actions ? <div className="admin-topbar-actions">{actions}</div> : null}
    </header>
  );
}
