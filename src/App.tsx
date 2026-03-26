import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AwardsPage } from './pages/AwardsPage';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminOverview } from './pages/admin/AdminOverview';
import { SiteSettingsPage } from './pages/admin/SiteSettingsPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LeaderboardPage />} />
        <Route path="/awards" element={<AwardsPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Admin (protected) */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }>
          <Route index element={<AdminOverview />} />
          <Route path="settings" element={<SiteSettingsPage />} />
          <Route path="users" element={
            <ProtectedRoute requiredRole="superadmin">
              <UserManagementPage />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
