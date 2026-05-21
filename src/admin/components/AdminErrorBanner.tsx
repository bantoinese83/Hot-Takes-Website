type Props = {
  message: string;
  degraded?: boolean;
};

export function AdminErrorBanner({ message, degraded }: Props) {
  return (
    <div className={`admin-banner${degraded ? ' admin-banner--warn' : ' admin-banner--error'}`} role="alert">
      {message}
    </div>
  );
}
