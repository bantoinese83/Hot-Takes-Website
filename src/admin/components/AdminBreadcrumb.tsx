import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export type AdminBreadcrumbItem = {
  label: string;
  to?: string;
};

type Props = {
  items: AdminBreadcrumbItem[];
};

export function AdminBreadcrumb({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <nav className="admin-breadcrumb" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="admin-breadcrumb-item">
            {i > 0 ? <ChevronRight size={14} aria-hidden className="admin-breadcrumb-sep" /> : null}
            {item.to && !isLast ? (
              <Link to={item.to} className="admin-breadcrumb-link">
                {item.label}
              </Link>
            ) : (
              <span className="admin-breadcrumb-current" aria-current={isLast ? 'page' : undefined}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
