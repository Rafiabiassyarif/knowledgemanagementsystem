import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { siteData } from './siteData';
import { useApp } from '../context/AppContext';

/**
 * Elongated Floating Header Bar with Centered Navigation
 * Membentang panjang sampai ujung (w-full) dengan menu navigasi
 * tepat berada di tengah-tengah (center).
 */
export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useApp();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="fixed top-3.5 left-0 right-0 z-40 px-3 sm:px-6 lg:px-8 pointer-events-none flex justify-center">
      <div
        className={`pointer-events-auto transition-all duration-300 rounded-full border px-4 sm:px-6 py-2 flex items-center justify-between md:grid md:grid-cols-3 w-full max-w-[1400px] shadow-sm ${
          isScrolled
            ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100'
            : 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100'
        }`}
      >
        {/* Kolom 1 (Kiri): Logo Brand */}
        <div className="flex items-center justify-start">
          <Link
            to="/"
            className="flex items-center gap-2 group focus:outline-none shrink-0"
            aria-label={`${siteData.brand.name} - Beranda`}
          >
            <div className="flex items-center gap-1">
              <span className="w-2 h-4 rounded-full bg-blue-600 rotate-12 inline-block transform" />
              <span className="w-1.5 h-3 rounded-full bg-blue-400 rotate-12 inline-block transform" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              KNOWBASE
            </span>
          </Link>
        </div>

        {/* Kolom 2 (Tengah): Menu Navigasi Persis di Tengah Layar */}
        <nav
          className="hidden md:flex items-center justify-center gap-6 lg:gap-8 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300"
          aria-label="Navigasi Utama"
        >
          {siteData.navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150 py-1 whitespace-nowrap"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Kolom 3 (Kanan): Mode Gelap/Terang, Masuk, Register + Tombol Menu Mobile */}
        <div className="flex items-center justify-end gap-2 sm:gap-2.5">
          {/* Tombol Toggle Dark/Light Mode */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            aria-label={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 animate-in spin-in-90 duration-300" />
            )}
          </button>

          {/* Tombol Masuk (Desktop) */}
          <Link
            to="/login"
            className="hidden md:inline-flex items-center px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-all duration-200"
          >
            Masuk
          </Link>

          {/* Tombol Register (Desktop) */}
          <Link
            to="/register"
            className="hidden md:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Register
          </Link>

          {/* Tombol Hamburger Mobile */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Dropdown Mengambang */}
      {mobileMenuOpen && (
        <div className="md:hidden pointer-events-auto fixed top-16 left-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-1 text-center" aria-label="Navigasi Mobile">
            {siteData.navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={closeMobileMenu}
                className="text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-blue-50/60 dark:hover:bg-slate-800"
              >
                {link.name}
              </a>
            ))}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 mt-2">
              <Link
                to="/login"
                onClick={closeMobileMenu}
                className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                onClick={closeMobileMenu}
                className="py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Register
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
