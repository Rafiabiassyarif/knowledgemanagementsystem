import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Sun, Moon } from 'lucide-react';

interface AuthLayoutProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  children
}) => {
  const { theme, toggleTheme } = useApp();
  const location = useLocation();
  const isLogin = location.pathname.includes('/login');
  const isRegister = location.pathname.includes('/register');

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex flex-col justify-center items-center py-10 px-4 sm:px-6 relative overflow-hidden font-sans antialiased selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Top Right Floating Controls: Home link & Dark Mode Toggle */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          aria-label="Ubah Tema"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-200" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 animate-in spin-in-180 duration-200" />
          )}
        </button>
      </div>

      {/* Subtle modern background texture & ambient lighting */}
      <div 
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.1] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none animate-float-reverse" />

      {/* Main Comfortably Sized Card (Max width ~480px) */}
      <div className="relative z-10 w-full max-w-[460px] sm:max-w-[480px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-400 ease-out">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/60 dark:shadow-black/50 p-7 sm:p-9 transition-colors">
          {/* Card Header with Brand Icon */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center justify-center gap-2.5 mb-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
                KMS
              </div>
              <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                KMS BUMD<span className="text-blue-600">.</span>
              </span>
            </Link>
            {title && (
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Segmented Tab Control (Login & Register) */}
          {(isLogin || isRegister) && (
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-6 text-xs sm:text-sm font-semibold transition-colors">
              <Link
                to="/login"
                className={`flex-1 py-2 text-center rounded-xl transition-all ${
                  isLogin 
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Masuk
              </Link>
              <Link
                to="/register"
                className={`flex-1 py-2 text-center rounded-xl transition-all ${
                  isRegister 
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Daftar
              </Link>
            </div>
          )}

          {/* Form Content */}
          {children}
        </div>

        {/* Minimal Footer */}
        <div className="mt-5 text-center text-xs text-slate-400 dark:text-slate-500">
          Knowledge Management System BUMD · 2026
        </div>
      </div>
    </div>
  );
};
