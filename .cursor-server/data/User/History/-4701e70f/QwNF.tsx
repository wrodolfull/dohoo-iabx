import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Extensions from './pages/Extensions';
import RingGroups from './pages/RingGroups';
import URABuilder from './pages/URABuilder';
import Trunks from './pages/Trunks';
import InboundRoutes from './pages/InboundRoutes';
import OutboundRoutes from './pages/OutboundRoutes';
import Users from './pages/Users';
import Tenants from './pages/Tenants';
import Plans from './pages/Plans';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';
import Schedules from './pages/Schedules';
import ActiveCalls from './pages/ActiveCalls';
import { Toaster } from 'sonner';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="extensions" element={<Extensions />} />
              <Route path="ring-groups" element={<RingGroups />} />
              <Route path="ura-builder" element={<URABuilder />} />
              <Route path="trunks" element={<Trunks />} />
              <Route path="inbound-routes" element={<InboundRoutes />} />
              <Route path="outbound-routes" element={<OutboundRoutes />} />
              <Route path="users" element={<Users />} />
              <Route path="tenants" element={<Tenants />} />
              <Route path="plans" element={<Plans />} />
              <Route path="reports" element={<Reports />} />
              <Route path="active-calls" element={<ActiveCalls />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              <Route path="schedules" element={<Schedules />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </div>
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  );
}

export default App;
