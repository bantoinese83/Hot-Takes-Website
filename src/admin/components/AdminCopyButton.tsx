import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

type Props = {
  value: string;
  label?: string;
};

export function AdminCopyButton({ value, label = 'Copy ID' }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <button type="button" className="admin-btn admin-btn--ghost admin-btn--compact" onClick={() => void copy()}>
      {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
      {copied ? 'Copied' : label}
    </button>
  );
}
