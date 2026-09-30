import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Lock, Mail, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Mohon masukkan email dan kata sandi Anda.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = login(email, password);
      setIsLoading(false);

      if (!res.success) {
        setErrorMessage(res.message || 'Email atau kata sandi tidak sesuai.');
        return;
      }

      navigate('/app');
    }, 350);
  };

  return (
    <AuthLayout
      subtitle="Masuk ke portal KMS BUMD untuk mengakses basis pengetahuan &amp; Tanya AI"
    >
      {/* Error Alert with shake animation */}
      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-700 flex items-start gap-2.5 animate-shake">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-snug font-medium">{errorMessage}</div>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleLogin}>
        {/* Email Field */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Alamat Email
          </label>
          <div className="relative group">
            <Mail className="w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
            <input
              type="email"
              required
              placeholder="nama@organisasi.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              Kata Sandi
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline"
            >
              Lupa sandi?
            </Link>
          </div>
          <div className="relative group">
            <Lock className="w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs sm:text-sm pl-10 pr-10 py-2.5 sm:py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">Ingat sesi saya</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="group w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
        >
          {isLoading ? (
            <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Masuk Sekarang</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
};
