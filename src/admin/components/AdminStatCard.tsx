type Props = {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
};

export function AdminStatCard({ label, value, sub, highlight }: Props) {
  return (
    <div className={`admin-stat-card${highlight ? ' admin-stat-card--alert' : ''}`}>
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value">{value}</div>
      {sub ? <div className="admin-stat-sub">{sub}</div> : null}
    </div>
  );
}
