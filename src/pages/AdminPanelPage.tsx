import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * AdminPanelPage (Admin Control Center) has been retired in favor of
 * separate dedicated pages:
 * - /app/quota -> QuotaManagementPage (Manajemen Paket & Kuota)
 * - /app/cdn -> CdnMonitoringPage (Monitoring CDN & RAG AI)
 * - /app/organizations -> OrganizationsPage (Organisasi / BUMD)
 * - /app/settings -> SystemSettingsPage (Pengaturan Sistem & API)
 */
export const AdminPanelPage: React.FC<any> = () => {
  return <Navigate to="/app/quota" replace />;
};
