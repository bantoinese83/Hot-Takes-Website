import { useEffect } from 'react';
import { X } from 'lucide-react';

type Props = {
  message: string;
  onDismiss?: () => void;
  autoHideMs?: number;
};

export function AdminSuccessBanner({ message, onDismiss, autoHideMs = 6000 }: Props) {
  useEffect(() => {
    if (!onDismiss || autoHideMs <= 0) return;
    const id = window.setTimeout(onDismiss, autoHideMs);
    return () => window.clearTimeout(id);
  }, [message, onDismiss, autoHideMs]);

  return (
    <div className="admin-banner admin-banner--ok admin-banner--dismissible" role="status">
      <span>{message}</span>
      {onDismiss ? (
        <button type="button" className="admin-banner-dismiss" onClick={onDismiss} aria-label="Dismiss">
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}
