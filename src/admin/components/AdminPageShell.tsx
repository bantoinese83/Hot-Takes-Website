import type { ReactNode } from 'react';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminContextBar } from './AdminContextBar';
import { AdminSuccessBanner } from './AdminSuccessBanner';
import { useFlashMessage } from '../hooks/useFlashMessage';
import type { AdminBreadcrumbItem } from './AdminBreadcrumb';

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumbs?: AdminBreadcrumbItem[];
  children: ReactNode;
};

export function AdminPageShell({ title, subtitle, actions, breadcrumbs, children }: Props) {
  const { message: flash, clear: clearFlash } = useFlashMessage();

  return (
    <>
      <AdminPageHeader
        title={title}
        subtitle={subtitle}
        actions={actions}
        breadcrumbs={breadcrumbs}
      />
      <div className="admin-page">
        <AdminContextBar />
        {flash ? <AdminSuccessBanner message={flash} onDismiss={clearFlash} /> : null}
        <div className="admin-page-inner">{children}</div>
      </div>
    </>
  );
}
