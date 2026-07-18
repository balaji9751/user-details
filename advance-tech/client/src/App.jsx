import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ToastContext';

// Pages
import Home from './pages/Home';
import Login from './pages/admin/Login';
import DashboardLayout from './pages/admin/dashboard/DashboardLayout';
import Overview from './pages/admin/dashboard/Overview';
import UsersList from './pages/admin/dashboard/UsersList';
import Reports from './pages/admin/dashboard/Reports';
import Downloads from './pages/admin/dashboard/Downloads';
import Settings from './pages/admin/dashboard/Settings';
import TallyConnectivity from './pages/admin/dashboard/TallyConnectivity';
import { NotFound } from './pages/ErrorPages';

// Auth Route Guard
function PrivateRoute({ children }) {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Redirect home to admin login */}
          <Route path="/" element={<Navigate to="/admin/login" replace />} />
          
          {/* Admin Authentication */}
          <Route path="/admin/login" element={<Login />} />

          {/* Secure Admin Dashboard */}
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="users" element={<UsersList />} />
            <Route path="reports" element={<Reports />} />
            <Route path="downloads" element={<Downloads />} />
            <Route path="settings" element={<Settings />} />
            <Route path="tally" element={<TallyConnectivity />} />
          </Route>

          {/* Fallback 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
