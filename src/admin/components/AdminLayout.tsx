import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  Bell,
  DollarSign,
  Flag,
  Globe,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Brain,
  MessageSquareQuote,
  Rocket,
  ScrollText,
  Settings,
  ShieldAlert,
  TrendingUp,
  Users,
  Video,
  Clapperboard,
} from 'lucide-react';
import { useAdminAuth } from '../../lib/useAdminAuth';
import { AdminOpsProvider } from '../hooks/AdminOpsProvider';
import { useAdminOps } from '../hooks/useAdminOps';
import { AdminGlobalSearch } from './AdminGlobalSearch';
import '../admin.css';

type NavItem = {
  to: string;
  end?: boolean;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: 'waiting' | 'reports' | null;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Monitor',
    items: [
      { to: '/admin', end: true, label: 'Overview', icon: LayoutDashboard, badge: null },
      { to: '/admin/analytics', label: 'Analytics', icon: TrendingUp, badge: null },
      { to: '/admin/geography', label: 'Geography', icon: Globe, badge: null },
      { to: '/admin/activity', label: 'Activity log', icon: ScrollText, badge: null },
      { to: '/admin/pairing', label: 'Pairing funnel', icon: Activity, badge: null },
      { to: '/admin/dates', label: 'Date quality', icon: Clapperboard, badge: null },
      { to: '/admin/health', label: 'System health', icon: HeartPulse, badge: null },
      { to: '/admin/revenue', label: 'Revenue', icon: DollarSign, badge: null },
    ],
  },
  {
    title: 'Operations',
    items: [
      { to: '/admin/moderation', label: 'Moderation', icon: Flag, badge: 'reports' },
      { to: '/admin/trust', label: 'Trust radar', icon: ShieldAlert, badge: null },
      { to: '/admin/queue', label: 'Live queue', icon: Video, badge: 'waiting' },
      { to: '/admin/push', label: 'Push composer', icon: Bell, badge: null },
      { to: '/admin/users', label: 'Users', icon: Users, badge: null },
      { to: '/admin/growth', label: 'Waitlists', icon: Rocket, badge: null },
      { to: '/admin/community', label: 'Community votes', icon: MessageSquareQuote, badge: null },
      { to: '/admin/intel', label: 'Intel team', icon: Brain, badge: null },
    ],
  },
];

function AdminLayoutInner() {
  const { adminInfo, signOut, isSuperadmin } = useAdminAuth();
  const { overview } = useAdminOps();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const badgeCount = (key: 'waiting' | 'reports' | null) => {
    if (key === 'waiting') return overview?.waiting_count ?? 0;
    if (key === 'reports') return overview?.reports_total ?? 0;
    return 0;
  };

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items,
  }));

  return (
    <div className="admin-root">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <img src="/app-logo.png" alt="Hot Take" width={36} height={36} />
          <div className="admin-sidebar-brand-text">
            <span>Ops Console</span>
            <span className="admin-sidebar-brand-sub">Hot Take</span>
          </div>
        </div>

        <AdminGlobalSearch />

        <div className="admin-sidebar-nav">
          {sections.map((section) => (
            <div key={section.title} className="admin-nav-section">
              <p className="admin-nav-section-title">{section.title}</p>
              {section.items.map(({ to, end, label, icon: Icon, badge }) => {
                const n = badge ? badgeCount(badge) : 0;
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
                  >
                    <Icon size={18} aria-hidden strokeWidth={2} />
                    <span className="admin-nav-label">{label}</span>
                    {n > 0 ? <span className="admin-nav-badge">{n > 99 ? '99+' : n}</span> : null}
                  </NavLink>
                );
              })}
            </div>
          ))}

          {isSuperadmin ? (
            <div className="admin-nav-section">
              <p className="admin-nav-section-title">System</p>
              <NavLink
                to="/admin/settings"
                className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
              >
                <Settings size={18} aria-hidden strokeWidth={2} />
                <span className="admin-nav-label">Settings</span>
              </NavLink>
            </div>
          ) : null}
        </div>

        <div className="admin-sidebar-footer">
          <p className="admin-sidebar-email">{adminInfo?.email ?? '—'}</p>
          <p className="admin-sidebar-role">
            <span className="admin-badge">{adminInfo?.role ?? 'admin'}</span>
          </p>
          {(overview?.waiting_count ?? 0) > 0 || (overview?.reports_total ?? 0) > 0 ? (
            <p className="admin-sidebar-pulse">
              {(overview?.waiting_count ?? 0) > 0 ? `${overview?.waiting_count} in line` : null}
              {(overview?.waiting_count ?? 0) > 0 && (overview?.reports_total ?? 0) > 0 ? ' · ' : null}
              {(overview?.reports_total ?? 0) > 0 ? `${overview?.reports_total} reports` : null}
            </p>
          ) : null}
          <button type="button" className="admin-btn admin-btn--ghost admin-btn--block" onClick={() => void handleSignOut()}>
            <LogOut size={16} aria-hidden /> Sign out
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
}

export function AdminLayout() {
  return (
    <AdminOpsProvider>
      <AdminLayoutInner />
    </AdminOpsProvider>
  );
}
