import type { ReactNode } from 'react';

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function AdminEmptyState({ title, description, action }: Props) {
  return (
    <div className="admin-empty-state">
      <p className="admin-empty-state-title">{title}</p>
      {description ? <p className="admin-empty-state-desc">{description}</p> : null}
      {action ? <div className="admin-empty-state-action">{action}</div> : null}
    </div>
  );
}
