import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { OrganizationDetailPage } from './pages/OrganizationDetailPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { UsersPage } from './pages/UsersPage';
import { ActivityPage } from './pages/ActivityPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { JoinOrgPage } from './pages/JoinOrgPage';
import { LandingPage } from './pages/LandingPage';
// SEMBUNYI SEMENTARA: halaman manajemen paket & kuota belum dipublikasikan
// import { QuotaManagementPage } from './pages/QuotaManagementPage';
import { CdnMonitoringPage } from './pages/CdnMonitoringPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/join-org" element={<Navigate to="/app/join-org" replace />} />

          {/* Unified Application Routes for all roles at /app */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="projects" element={<OrganizationsPage />} />
            <Route path="projects/:id" element={<OrganizationDetailPage />} />
            <Route path="organizations" element={<Navigate to="/app/projects" replace />} />
            <Route path="organizations/:id" element={<OrganizationDetailPage />} />
            <Route path="chat" element={<Navigate to="/app/documents" replace />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="knowledge" element={<Navigate to="/app/documents" replace />} />
            {/* SEMBUNYI SEMENTARA: /app/quota diarahkan ke dashboard selama fitur paket disembunyikan */}
            <Route path="quota" element={<Navigate to="/app" replace />} />
            <Route path="cdn" element={<CdnMonitoringPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="admin" element={<Navigate to="/app" replace />} />
            <Route path="admin/quota" element={<Navigate to="/app" replace />} />
            <Route path="admin/cdn" element={<Navigate to="/app/cdn" replace />} />
            <Route path="admin/organizations" element={<Navigate to="/app/organizations" replace />} />
            <Route path="admin/settings" element={<Navigate to="/app" replace />} />
            <Route path="join-org" element={<Navigate to="/app/projects" replace />} />
            <Route path="activity" element={<ActivityPage />} />
          </Route>

          {/* Legacy & Superadmin redirects to unified /app */}
          <Route path="/superadmin/*" element={<Navigate to="/app" replace />} />
          <Route path="/superadmin" element={<Navigate to="/app" replace />} />
          <Route path="/organizations" element={<Navigate to="/app/organizations" replace />} />
          <Route path="/organizations/:id" element={<Navigate to="/app/organizations" replace />} />
          <Route path="/chat" element={<Navigate to="/app/documents" replace />} />
          <Route path="/documents" element={<Navigate to="/app/documents" replace />} />
          <Route path="/knowledge" element={<Navigate to="/app/documents" replace />} />
          <Route path="/users" element={<Navigate to="/app/users" replace />} />
          <Route path="/activity" element={<Navigate to="/app/activity" replace />} />
          <Route path="/settings" element={<Navigate to="/app" replace />} />

          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
