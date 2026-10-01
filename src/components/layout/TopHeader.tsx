import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Menu, 
  User as UserIcon, 
  LogOut, 
  ChevronDown,
  Sun,
  Moon,
  FolderKanban,
  Plus,
  Check
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { UserProfileModal } from '../common/UserProfileModal';
import { CreateProjectModal } from '../common/CreateProjectModal';

interface TopHeaderProps {
  onOpenMobileMenu: () => void;
  onOpenSearch?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenMobileMenu }) => {
  const { currentUser, currentOrganization, organizations, switchProject, logout, theme, toggleTheme } = useApp();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel = currentUser?.role === 'superadmin' 
    ? 'Superadmin Platform' 
    : currentUser?.role === 'admin' 
      ? 'Admin Organisasi' 
      : 'Pengguna';

  return (
    <>
      <header className="sticky top-0 z-30 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between transition-colors">
        {/* Zone 1: Mobile Hamburger / Left Context - Active Project Switcher */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Project Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs max-w-[200px] sm:max-w-[300px]"
              title="Ganti atau Kelola Project"
            >
              <FolderKanban className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="truncate">
                {currentOrganization ? currentOrganization.name : 'Pilih / Buat Project'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-0.5" />
            </button>

            {projectDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProjectDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in duration-100">
                  <div className="px-3.5 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Project Aktif ({organizations.length})
                    </span>
                    <button
                      onClick={() => {
                        setProjectDropdownOpen(false);
                        setCreateProjectModalOpen(true);
                      }}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Buat Project</span>
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
                    {organizations.map(p => {
                      const isActive = currentOrganization?.id === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            switchProject(p.id);
                            setProjectDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="truncate font-medium">{p.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">{p.code} · {p.type}</p>
                          </div>
                          {isActive && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Zone 2: Actions & User Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            aria-label="Ubah Tema"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-200" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 animate-in spin-in-180 duration-200" />
            )}
          </button>

          {/* User Account Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-left cursor-pointer"
              title="Profil Pengguna"
            >
              <div className="relative">
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser?.name}
                    className="w-8 h-8 rounded-full object-cover shadow-2xs border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-900 via-blue-900 to-indigo-900 text-white font-semibold text-xs flex items-center justify-center tracking-tight shadow-2xs">
                    {currentUser?.avatarInitials || 'US'}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" title="Online" />
              </div>
              <div className="hidden lg:flex flex-col">
                <span className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[120px] leading-tight">
                  {currentUser?.name || 'Pengguna'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none mt-0.5">
                  {currentUser?.role === 'superadmin' ? 'Superadmin' : currentUser?.role === 'admin' ? 'Admin' : 'Pengguna'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            </button>

            {profileDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setProfileDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl py-1.5 z-50 animate-in fade-in duration-100">
                  {/* User Profile Card Header */}
                  <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {currentUser?.avatarUrl ? (
                          <img
                            src={currentUser.avatarUrl}
                            alt={currentUser?.name}
                            className="w-10 h-10 rounded-full object-cover shadow-xs border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-900 via-blue-900 to-indigo-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                            {currentUser?.avatarInitials || 'US'}
                          </div>
                        )}
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentUser?.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{currentUser?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items - Simple & Clean */}
                  <div className="p-1 space-y-0.5 text-xs">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors font-medium text-left cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                      <span>Profil Saya</span>
                    </button>
                  </div>

                  {/* Sign Out Footer */}
                  <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800 px-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors font-medium cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Keluar Akun</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={createProjectModalOpen}
        onClose={() => setCreateProjectModalOpen(false)}
      />
    </>
  );
};

