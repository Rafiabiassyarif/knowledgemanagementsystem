import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { OrganizationDetailPage } from './pages/OrganizationDetailPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { AskAIPage } from './pages/AskAIPage';
import { UsersPage } from './pages/UsersPage';
import { ActivityPage } from './pages/ActivityPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { JoinOrgPage } from './pages/JoinOrgPage';
import { LandingPage } from './pages/LandingPage';

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
            <Route path="organizations" element={<OrganizationsPage />} />
            <Route path="organizations/:id" element={<OrganizationDetailPage />} />
            <Route path="chat" element={<AskAIPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="knowledge" element={<Navigate to="/app/documents" replace />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="join-org" element={<JoinOrgPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="settings" element={<Navigate to="/app" replace />} />
          </Route>

          {/* Legacy & Superadmin redirects to unified /app */}
          <Route path="/superadmin/*" element={<Navigate to="/app" replace />} />
          <Route path="/superadmin" element={<Navigate to="/app" replace />} />
          <Route path="/chat" element={<Navigate to="/app/chat" replace />} />
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
