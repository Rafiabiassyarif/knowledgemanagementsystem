import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText, 
  Cpu, 
  Sparkles, 
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

export const SuperadminLayout: React.FC = () => {
  const { currentUser, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Guard: if not logged in or role is not superadmin, redirect to login
  if (!currentUser || currentUser.role !== 'superadmin') {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/superadmin', label: 'Platform Overview', icon: LayoutDashboard, end: true },
    { to: '/superadmin/organizations', label: 'Organizations (BUMD)', icon: Building2 },
    { to: '/superadmin/users', label: 'Users & Permissions', icon: Users },
    { to: '/superadmin/documents', label: 'Global Documents', icon: FileText },
    { to: '/superadmin/knowledge', label: 'Knowledge Base', icon: Cpu },
    { to: '/superadmin/ai-engine', label: 'RAG & AI Engine', icon: Sparkles },
    { to: '/superadmin/activity', label: 'Audit Trail & Activity', icon: Activity },
    { to: '/superadmin/settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col antialiased">
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 bg-slate-950 flex-col justify-between border-r border-slate-800/80 shrink-0">
          <div>
            {/* Brand Header */}
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white tracking-tight block">KMS SUPERADMIN</span>
                  <span className="text-[10px] text-blue-400 font-mono">GLOBAL INSTANCE</span>
                </div>
              </div>
            </div>

            {/* Platform Badge */}
            <div className="p-3 mx-3 my-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Status Platform</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Operasional
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Multi-Tenant Core · 5 BUMD</p>
            </div>

            {/* Navigation items */}
            <div className="px-3 py-1">
              <span className="px-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Platform Console
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
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
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
            <div className="flex items-center justify-between mb-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs text-rose-400 font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar Sesi Superadmin
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
              <span className="text-xs font-bold text-white">KMS SUPERADMIN</span>
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
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
          <div className="p-4 border-t border-slate-800 absolute bottom-0 left-0 right-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium"
            >
              <LogOut className="w-4 h-4" />
              Keluar Superadmin
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900 text-slate-100 overflow-y-auto">
          {/* Top Bar */}
          <header className="h-14 bg-slate-950/80 backdrop-blur-xs border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-1.5 text-slate-400 hover:text-white"
              >
                <Menu className="w-5 h-5" />
              </button>
              <span className="text-xs font-semibold text-slate-200">
                Konsol Tata Kelola Superadmin Global
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                title="Lihat Portal Pengguna"
              >
                <span>Portal Pengguna</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <button
                onClick={handleLogout}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-md transition-colors border border-rose-500/20"
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
