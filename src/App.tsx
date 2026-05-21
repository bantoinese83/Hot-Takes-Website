import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MarketingSite } from './marketing/MarketingSite';
import { AdminAuthProvider } from './lib/adminAuth';
import { AdminLayout } from './admin/components/AdminLayout';
import { AdminGuard } from './admin/components/AdminGuard';
import { AdminLoginPage } from './admin/pages/AdminLoginPage';
import { DashboardPage } from './admin/pages/DashboardPage';
import { ModerationPage } from './admin/pages/ModerationPage';
import { QueuePage } from './admin/pages/QueuePage';
import { UsersPage } from './admin/pages/UsersPage';
import { PairingPage } from './admin/pages/PairingPage';
import { CommunityPage } from './admin/pages/CommunityPage';
import { AnalyticsPage } from './admin/pages/AnalyticsPage';
import { GeographyPage } from './admin/pages/GeographyPage';
import { ActivityPage } from './admin/pages/ActivityPage';
import { GrowthPage } from './admin/pages/GrowthPage';
import { UserDetailPage } from './admin/pages/UserDetailPage';
import { SettingsPage } from './admin/pages/SettingsPage';
import { IntelPage } from './admin/pages/IntelPage';
import { RevenueHealthPage } from './admin/pages/RevenueHealthPage';
import { TrustRadarPage } from './admin/pages/TrustRadarPage';
import { PushComposerPage } from './admin/pages/PushComposerPage';
import { DateQualityPage } from './admin/pages/DateQualityPage';
import { SystemHealthPage } from './admin/pages/SystemHealthPage';
import { JoinInvitePage } from './pages/JoinInvitePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MarketingSite />} />
        <Route path="/join" element={<JoinInvitePage />} />
        <Route path="/privacy" element={<MarketingSite />} />
        <Route
          path="/admin/*"
          element={
            <AdminAuthProvider>
              <Routes>
                <Route path="login" element={<AdminLoginPage />} />
                <Route element={<AdminGuard />}>
                  <Route element={<AdminLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="geography" element={<GeographyPage />} />
                    <Route path="activity" element={<ActivityPage />} />
                    <Route path="moderation" element={<ModerationPage />} />
                    <Route path="queue" element={<QueuePage />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="users/:userId" element={<UserDetailPage />} />
                    <Route path="growth" element={<GrowthPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="pairing" element={<PairingPage />} />
                    <Route path="community" element={<CommunityPage />} />
                    <Route path="intel" element={<IntelPage />} />
                    <Route path="revenue" element={<RevenueHealthPage />} />
                    <Route path="trust" element={<TrustRadarPage />} />
                    <Route path="push" element={<PushComposerPage />} />
                    <Route path="dates" element={<DateQualityPage />} />
                    <Route path="health" element={<SystemHealthPage />} />
                  </Route>
                </Route>
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </AdminAuthProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
