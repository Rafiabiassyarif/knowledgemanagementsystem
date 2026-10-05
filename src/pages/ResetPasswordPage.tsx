import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { KeyRound, CheckCircle2, ArrowRight, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export const ResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }
    if (password !== confirm) {
      setError('Konfirmasi kata sandi tidak sama.');
      return;
    }
    setIsLoading(true);
    try {
      await api.auth.resetPassword(token, password);
      setIsDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 2200);
    } catch (err: any) {
      setError(err?.message || 'Tautan tidak valid atau sudah kedaluwarsa.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Tautan Tidak Valid" subtitle="Tautan pemulihan tidak lengkap">
        <div className="text-center space-y-4 py-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200/80">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Tautan ini tidak memuat token pemulihan. Silakan minta tautan baru.
          </p>
          <Link
            to="/forgot-password"
            className="w-full py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <span>Minta Tautan Baru</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Atur Ulang Sandi"
      subtitle="Masukkan kata sandi baru untuk akun Anda"
    >
      {isDone ? (
        <div className="text-center space-y-4 py-3 animate-in fade-in duration-200">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200/80">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Kata Sandi Diperbarui</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Kata sandi akun Anda sudah berhasil diubah. Anda akan diarahkan ke halaman masuk...
            </p>
          </div>
          <Link
            to="/login"
            className="w-full py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <span>Masuk Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Kata Sandi Baru
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ulangi Kata Sandi Baru
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <span>{isLoading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}</span>
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>

          <Link to="/login" className="block text-center text-xs text-slate-500 hover:text-blue-600">
            Batal dan kembali ke halaman masuk
          </Link>
        </form>
      )}
    </AuthLayout>
  );
};
