import { RefreshCw } from 'lucide-react';

type Props = {
  onClick: () => void;
  loading?: boolean;
  label?: string;
};

export function AdminRefreshButton({ onClick, loading, label = 'Refresh' }: Props) {
  return (
    <button type="button" className="admin-btn admin-btn--ghost" onClick={onClick} disabled={loading}>
      <RefreshCw size={16} aria-hidden className={loading ? 'admin-spin' : undefined} />
      {loading ? 'Loading…' : label}
    </button>
  );
}
