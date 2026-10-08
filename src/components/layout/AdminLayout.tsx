import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  HardDrive,
  Activity,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  ExternalLink
} from 'lucide-react';
import { DocumentViewerModal } from '../common/DocumentViewerModal';
import { ChunkInspectorModal } from '../common/ChunkInspectorModal';

/**
 * Konsol khusus Admin: mengelola SELURUH project, pengguna, dokumen,
 * CDN/RAG, dan log aktivitas platform. Terpisah dari portal pengguna (/app).
 */
export const AdminLayout: React.FC = () => {
  const { currentUser, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Guard: hanya admin yang boleh masuk konsol ini
  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/admin', label: 'Overview Platform', icon: LayoutDashboard, end: true },
    { to: '/admin/projects', label: 'Semua Project', icon: FolderKanban },
    { to: '/admin/users', label: 'Pengguna & Hak Akses', icon: Users },
    { to: '/admin/documents', label: 'Semua Dokumen', icon: FileText },
    { to: '/admin/cdn', label: 'Monitoring CDN & RAG', icon: HardDrive },
    { to: '/admin/activity', label: 'Log Aktivitas', icon: Activity },
    { to: '/admin/settings', label: 'Pengaturan Sistem', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 bg-slate-900 dark:bg-slate-950 flex-col justify-between border-r border-slate-800 shrink-0">
          <div>
            {/* Brand Header */}
            <div className="h-16 px-5 flex items-center gap-2.5 border-b border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white tracking-tight block">KONSOL ADMIN</span>
                <span className="text-[10px] text-blue-400 font-mono">KNOWBASE · SEMUA PROJECT</span>
              </div>
            </div>

            {/* Platform Badge */}
            <div className="p-3 mx-3 my-3 rounded-lg bg-slate-800/60 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Status Platform</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Operasional
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Akses penuh seluruh project</p>
            </div>

            {/* Navigation items */}
            <div className="px-3 py-1">
              <span className="px-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Menu Admin
              </span>
              <nav className="space-y-0.5">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white font-semibold shadow-xs'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Session Footer with Logout */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/80">
            <div className="min-w-0 mb-2">
              <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs text-rose-400 font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar Akun
            </button>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        <div
          className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 transform transition-transform duration-200 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <span className="text-xs font-bold text-white">KONSOL ADMIN</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="p-3 space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Bar */}
          <header className="h-14 bg-white/90 dark:bg-slate-950/80 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <Menu className="w-5 h-5" />
              </button>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Konsol Admin — Pengelolaan Seluruh Project
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/app"
                className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                title="Buka Portal Pengguna"
              >
                <span>Portal Pengguna</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <button
                onClick={handleLogout}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-colors border border-rose-200 dark:border-rose-500/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>

      <DocumentViewerModal />
      <ChunkInspectorModal />
    </div>
  );
};
