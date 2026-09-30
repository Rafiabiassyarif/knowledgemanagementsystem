import React from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
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
  ShieldCheck,
  LogOut,
  FolderLock,
  MessageSquare,
  UserPlus,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { currentUser, currentOrganization, logout, sidebarCollapsed, toggleSidebarCollapsed } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    if (!currentUser) return [];

    if (currentUser.role === 'superadmin') {
      return [
        { to: '/app', label: 'Overview', icon: LayoutDashboard },
        { to: '/app/organizations', label: 'Organisasi', icon: Building2 },
        { to: '/app/documents', label: 'Dokumen', icon: FileText },
        { to: '/app/users', label: 'Pengguna', icon: Users },
        { to: '/app/activity', label: 'Log Aktivitas', icon: Activity },
      ];
    } else if (currentUser.role === 'admin') {
      if (!currentOrganization) {
        // Admin belum membuat organisasi: Hanya tampilkan menu Buat Organisasi
        return [
          { to: '/app', label: 'Buat Organisasi', icon: Building2 },
        ];
      }

      // Ketika sudah create organisasi, baru fitur-fiturnya muncul semua:
      return [
        { to: '/app', label: 'Overview', icon: LayoutDashboard },
        { to: '/app/documents', label: 'Dokumen Organisasi', icon: FileText },
        { to: '/app/users', label: 'Kelola Anggota', icon: Users },
        { to: '/app/activity', label: 'Log Aktivitas', icon: Activity },
      ];
    } else {
      // Regular User - Super simple experience: Just AI Chat and Change Organization
      return [
        { to: '/app/chat', label: 'Tanya AI', icon: Sparkles },
        { to: '/app/join-org', label: currentOrganization ? 'Organisasi Saya' : 'Gabung Organisasi', icon: Building2 },
      ];
    }
  };

  const navLinks = getNavLinks();

  const isLinkActive = (to: string) => {
    // Regular User
    if (currentUser?.role === 'user') {
      if (to === '/app/chat') {
        return location.pathname === '/app/chat' || (location.pathname === '/app' && Boolean(currentOrganization));
      }
      if (to === '/app/join-org') {
        return location.pathname === '/app/join-org' || (location.pathname === '/app' && !currentOrganization);
      }
    }
    // Superadmin & Admin
    if (to === '/app') {
      return location.pathname === '/app';
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <aside className={`w-full h-full bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 flex flex-col justify-between border-r border-slate-200/80 dark:border-slate-800/80 select-none transition-all duration-300`}>
      <div>
        {/* Brand Lockup */}
        <div className={`h-14 ${sidebarCollapsed ? 'px-2 justify-center' : 'px-4 justify-between'} flex items-center border-b border-slate-100 dark:border-slate-800/80`}>
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-blue-500/25 tracking-wider shrink-0">
                  KMS
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-none truncate">
                    KMS Platform
                  </span>
                  <div className="mt-1 flex items-center">
                    <span className="text-[9px] font-semibold tracking-wider font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60 truncate">
                      {currentUser?.role === 'superadmin'
                        ? 'SUPERADMIN'
                        : currentOrganization
                          ? currentOrganization.code
                          : currentUser?.role === 'admin'
                            ? 'ADMIN'
                            : 'USER'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleSidebarCollapsed}
                className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Tutup kecil sidebar (Hanya ikon)"
                aria-label="Tutup kecil sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-blue-500/20 group transition-all cursor-pointer"
              title="Buka penuh sidebar"
              aria-label="Buka penuh sidebar"
            >
              <span className="group-hover:hidden">KMS</span>
              <PanelLeftOpen className="w-4 h-4 hidden group-hover:block transition-all" />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <div className={`${sidebarCollapsed ? 'px-2' : 'px-3'} py-3`}>
          {!sidebarCollapsed ? (
            <span className="px-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
              {currentUser?.role === 'superadmin'
                ? 'Menu Superadmin'
                : currentUser?.role === 'admin'
                  ? (currentOrganization ? 'Menu Admin' : 'Setup Organisasi')
                  : 'Menu Pengguna'}
            </span>
          ) : (
            <div className="h-px bg-slate-100 dark:bg-slate-800 mx-2 mb-2" />
          )}

          <nav className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = isLinkActive(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/app' || item.to === '/'}
                  onClick={onCloseMobile}
                  className={`relative group flex items-center ${sidebarCollapsed
                    ? 'justify-center px-0 py-2.5 rounded-xl'
                    : 'gap-2.5 px-3 py-2 rounded-xl'
                    } text-xs font-medium transition-all ${active
                      ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/30 ring-1 ring-blue-500/40'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/70'
                    }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  {/* Left active bar indicator (only when expanded) */}
                  {active && !sidebarCollapsed && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white/50 rounded-r-full" />
                  )}

                  {/* Blue glow dot indicator (collapsed mode) */}
                  {active && sidebarCollapsed && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full shadow-sm shadow-white/50" />
                  )}

                  <Icon className={`${sidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'} shrink-0`} />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}

                  {/* Floating tooltip when collapsed */}
                  {sidebarCollapsed && (
                    <div className="hidden lg:group-hover:flex absolute left-full ml-3 px-2.5 py-1 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50 border border-slate-700/50 pointer-events-none animate-in fade-in slide-in-from-left-1 duration-150">
                      {item.label}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Locked Features Helper when Admin has not created an organization */}
          {!currentOrganization && currentUser?.role === 'admin' && (
            !sidebarCollapsed ? (
              <div className="mx-1 mt-4 p-3.5 rounded-xl bg-amber-50/80 dark:bg-slate-800/70 border border-amber-200/70 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 shadow-2xs">
                <p className="font-semibold text-amber-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FolderLock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Fitur Terkunci</span>
                </p>
                <p className="text-[10px] leading-relaxed text-slate-600 dark:text-slate-400">
                  Fitur Dokumen, Kelola Anggota, dan Log Aktivitas akan otomatis terbuka setelah Anda membuat 1 organisasi.
                </p>
              </div>
            ) : (
              <div
                className="mt-3 flex justify-center text-amber-600 dark:text-amber-400 relative group cursor-help"
                title="Fitur Terkunci: Buat 1 organisasi untuk membuka fitur"
              >
                <FolderLock className="w-5 h-5" />
                <div className="hidden lg:group-hover:flex absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-amber-300 text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-50 border border-slate-800 pointer-events-none">
                  Buat 1 organisasi untuk membuka fitur
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* User Session Footer with Logout */}
      <div className={`p-3 border-t border-slate-100 dark:border-slate-800 ${sidebarCollapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        {!sidebarCollapsed ? (
          <>
            <div className="flex items-center gap-2.5 px-2 py-1.5 mb-2">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-white font-semibold text-xs flex items-center justify-center shrink-0 border border-blue-100 dark:border-slate-700">
                  {currentUser?.avatarInitials || 'US'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{currentUser?.name || 'User'}</p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser?.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900/60 bg-slate-50 dark:bg-slate-800/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs text-rose-600 dark:text-rose-400 font-medium transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar Akun</span>
            </button>
          </>
        ) : (
          <>
            <div
              className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-white font-semibold text-xs flex items-center justify-center relative group cursor-pointer border border-blue-100 dark:border-slate-700 overflow-hidden"
              title={`${currentUser?.name} (${currentUser?.role})`}
            >
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                currentUser?.avatarInitials || 'US'
              )}
              <div className="hidden lg:group-hover:flex absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50 border border-slate-800 pointer-events-none">
                {currentUser?.name}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900/60 bg-slate-50 dark:bg-slate-800/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors relative group cursor-pointer"
              title="Keluar Akun"
              aria-label="Keluar Akun"
            >
              <LogOut className="w-4 h-4" />
              <div className="hidden lg:group-hover:flex absolute left-full ml-3 px-2.5 py-1 bg-rose-950 text-rose-200 text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50 border border-rose-900 pointer-events-none">
                Keluar Akun
              </div>
            </button>
          </>
        )}
      </div>
    </aside>
  );
};
