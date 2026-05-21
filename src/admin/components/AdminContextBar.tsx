import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, Users, Video } from 'lucide-react';
import { useAdminOps } from '../hooks/useAdminOps';

export function AdminContextBar() {
  const { pathname } = useLocation();
  const { overview, loading } = useAdminOps();

  if (loading && !overview) return null;

  const waiting = overview?.waiting_count ?? 0;
  const reports = overview?.reports_total ?? 0;
  const reports24h = overview?.reports_24h ?? 0;
  const activeDates = overview?.active_dates_count ?? 0;

  const alerts: { key: string; icon: typeof Video; message: string; to: string; show: boolean }[] = [
    {
      key: 'reports',
      icon: AlertTriangle,
      message:
        reports > 0
          ? `${reports} open report${reports === 1 ? '' : 's'}${reports24h > 0 ? ` · ${reports24h} in 24h` : ''}`
          : '',
      to: '/admin/moderation',
      show: reports > 0 && !pathname.startsWith('/admin/moderation'),
    },
    {
      key: 'queue',
      icon: Video,
      message: `${waiting} in line${activeDates > 0 ? ` · ${activeDates} live date${activeDates === 1 ? '' : 's'}` : ''}`,
      to: '/admin/queue',
      show: waiting > 0 && !pathname.startsWith('/admin/queue'),
    },
    {
      key: 'ready',
      icon: Users,
      message: `${overview?.profiles_matching_complete ?? 0} profiles match-ready`,
      to: '/admin/users',
      show:
        waiting === 0 &&
        reports === 0 &&
        pathname === '/admin' &&
        (overview?.profiles_matching_complete ?? 0) > 0,
    },
  ];

  const visible = alerts.filter((a) => a.show && a.message);
  if (visible.length === 0) return null;

  return (
    <div className="admin-context-bar" role="status">
      {visible.map((a) => {
        const Icon = a.icon;
        return (
          <Link key={a.key} to={a.to} className={`admin-context-pill admin-context-pill--${a.key}`}>
            <Icon size={15} aria-hidden />
            <span>{a.message}</span>
            <span className="admin-context-pill-cta">View →</span>
          </Link>
        );
      })}
    </div>
  );
}
