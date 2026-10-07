import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, FolderKanban, HardDrive, MessageSquare, Menu } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MobileNavProps {
  onOpenMenu: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenMenu }) => {
  const { currentUser } = useApp();
  const location = useLocation();

  const getItems = () => {
    if (currentUser?.role === 'admin' || currentUser?.role === 'superadmin') {
      return [
        { to: '/app', label: 'Overview', icon: LayoutDashboard },
        { to: '/app/documents', label: 'Dokumen', icon: FileText },
        { to: '/app/cdn', label: 'CDN & RAG', icon: HardDrive },
        { to: '/app/projects', label: 'Project', icon: FolderKanban },
      ];
    }

    return [
      { to: '/app', label: 'Overview', icon: LayoutDashboard },
      { to: '/app/documents', label: 'Dokumen', icon: FileText },
      { to: '/app/projects', label: 'Project', icon: FolderKanban },
    ];
  };

  const isLinkActive = (to: string) => {
    if (to === '/app') {
      return location.pathname === '/app';
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  const items = getItems();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-2 py-1 flex items-center justify-around shadow-lg">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isLinkActive(item.to);
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
              active
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        );
      })}

      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-lg text-[10px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span>Menu</span>
      </button>
    </nav>
  );
};
