import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { MobileNav } from './MobileNav';
import { DocumentViewerModal } from '../common/DocumentViewerModal';
import { ChunkInspectorModal } from '../common/ChunkInspectorModal';
import { CreateProjectModal } from '../common/CreateProjectModal';
import { X } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { currentUser, currentOrganization, organizations, sidebarCollapsed } = useApp();
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [dismissOnboarding, setDismissOnboarding] = useState(false);

  // Guard: if user is not logged in, redirect to login page
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Admin memakai konsol pengelolaan tersendiri, bukan portal pengguna.
  if (currentUser.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex overflow-hidden antialiased transition-colors duration-200">
      {/* Desktop Sidebar (Permanent >= 1024px) */}
      <div className={`hidden lg:block shrink-0 h-screen transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-20' : 'w-64'
        }`}>
        <Sidebar />
      </div>

      {/* Mobile / Tablet Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile / Tablet Drawer Sidebar */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-2xl transform transition-transform duration-200 ease-in-out ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <Sidebar onCloseMobile={() => setMobileDrawerOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden pb-16 lg:pb-0">
        <TopHeader onOpenMobileMenu={() => setMobileDrawerOpen(true)} />

        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-h-full flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav onOpenMenu={() => setMobileDrawerOpen(true)} />

      {/* Global Modals for Document & Chunk preview */}
      <DocumentViewerModal />
      <ChunkInspectorModal />

      {/* Onboarding opsional untuk akun baru yang belum memiliki project sama sekali */}
      <CreateProjectModal
        isOpen={!dismissOnboarding && organizations.length === 0}
        isMandatoryOnboarding={true}
        onClose={() => setDismissOnboarding(true)}
      />
    </div>
  );
};
