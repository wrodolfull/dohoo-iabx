import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Extensions from './pages/Extensions';
import RingGroups from './pages/RingGroups';
import URABuilder from './pages/URABuilder';
import URAEditor from './pages/URAEditor';
import Trunks from './pages/Trunks';
import InboundRoutes from './pages/InboundRoutes';
import OutboundRoutes from './pages/OutboundRoutes';
import Users from './pages/Users';
import UserManagement from './pages/UserManagement';
import Tenants from './pages/Tenants';
import Plans from './pages/Plans';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';
import Schedules from './pages/Schedules';
import ActiveCalls from './pages/ActiveCalls';
import FreeSwitchAdmin from './pages/FreeSwitchAdmin';
import CallCenterDashboard from './pages/CallCenterDashboard';
import AdvancedReports from './pages/AdvancedReports';
import CTIDashboard from '@/components/CTIDashboard';
import WebPhone from '@/components/WebPhone';
import { Toaster } from 'sonner';
import RingGroupsDashboard from './pages/RingGroupsDashboard';
import RingGroupsAnalytics from './pages/RingGroupsAnalytics';
import RingGroupsPerformance from './pages/RingGroupsPerformance';
import { TenantProvider } from './contexts/TenantContext';

// Componente para redirecionamento baseado em autenticação
const AuthRedirect = () => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="extensions" element={<Extensions />} />
                <Route path="ring-groups" element={<RingGroups />} />
                <Route path="ring-groups-dashboard" element={<RingGroupsDashboard />} />
                <Route path="ring-groups-analytics" element={<RingGroupsAnalytics />} />
                <Route path="ring-groups-performance" element={<RingGroupsPerformance />} />
                <Route path="ura-builder" element={<URABuilder />} />
                <Route path="trunks" element={<Trunks />} />
                <Route path="inbound-routes" element={<InboundRoutes />} />
                <Route path="outbound-routes" element={<OutboundRoutes />} />
                <Route path="users" element={<Users />} />
                <Route path="user-management" element={<UserManagement />} />
                <Route path="tenants" element={<Tenants />} />
                <Route path="plans" element={<Plans />} />
                <Route path="reports" element={<Reports />} />
                <Route path="active-calls" element={<ActiveCalls />} />
                <Route path="schedules" element={<Schedules />} />
                <Route path="reports" element={<Reports />} />
                <Route path="advanced-reports" element={<AdvancedReports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="freeswitch-admin" element={<FreeSwitchAdmin />} />
                <Route path="webphone" element={<WebPhone />} />
                <Route path="cti" element={<CTIDashboard />} />
              </Route>
              {/* Rota para redirecionamento baseado em autenticação */}
              <Route path="*" element={<AuthRedirect />} />
            </Routes>
          </div>
          <Toaster position="top-right" />
        </Router>
      </TenantProvider>
    </AuthProvider>
  );
}

export default App;
