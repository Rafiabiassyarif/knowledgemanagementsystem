import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AuthLayout } from '../components/layout/AuthLayout';
import { User, Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerUser } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic 3-stage Strength Calculation
  const isWeak = password.length > 0 && password.length < 6;
  const isMedium = password.length >= 6 && (!/\d/.test(password) || !/[a-zA-Z]/.test(password));
  const isStrong = password.length >= 8 && /\d/.test(password) && /[a-zA-Z]/.test(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Mohon lengkapi semua data pendaftaran.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    setIsLoading(true);

    (async () => {
      try {
        const res = await registerUser({
          name,
          email,
          password,
          department: 'Umum'
        });

        if (!res.success) {
          setErrorMessage(res.message);
          return;
        }

        navigate(res.requiresOrgJoin ? '/app/join-org' : '/app');
      } finally {
        setIsLoading(false);
      }
    })();
  };

  return (
    <AuthLayout
      title="Buat Akun Baru"
      subtitle="Daftar akun untuk mengunggah dokumen, berkas &amp; foto repositori RAG"
    >
      {/* Error Alert with shake animation */}
      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-700 flex items-start gap-2.5 animate-shake">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-snug font-medium">{errorMessage}</div>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Nama Lengkap */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Nama Lengkap
          </label>
          <div className="relative group">
            <User className="w-4.5 h-4.5 text-slate-400 group-focus-within:text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
            <input
              type="text"
              required
              placeholder="Contoh: Bambang Wicaksono"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Alamat Email */}
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

        {/* Kata Sandi & Konfirmasi Sandi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Kata Sandi
            </label>
            <div className="relative group">
              <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Min. 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs sm:text-sm pl-9 pr-8 py-2.5 sm:py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Konfirmasi Sandi
            </label>
            <div className="relative group">
              <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Ulangi sandi"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full text-xs sm:text-sm pl-9 pr-4 py-2.5 sm:py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Mini 3-Segment Strength Bar */}
        {password && (
          <div className="space-y-1 pt-0.5 animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5">
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${isWeak ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : isStrong ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${isMedium ? 'bg-amber-500' : isStrong ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-colors ${isStrong ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              <span className="text-xs text-slate-500 font-medium ml-1.5">
                {isWeak ? 'Lemah' : isMedium ? 'Sedang' : isStrong ? 'Kuat' : ''}
              </span>
            </div>
          </div>
        )}

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
              <span>Daftar Akun Pengguna</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
};
