import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Mail, ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 350);
  };

  return (
    <AuthLayout
      title="Atur Ulang Sandi"
      subtitle="Kirim tautan instruksi pemulihan ke alamat email terdaftar"
    >
      {isSubmitted ? (
        <div className="text-center space-y-4 py-3 animate-in fade-in duration-200">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200/80 animate-in zoom-in-75 duration-200 shadow-2xs">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Tautan Pemulihan Terkirim
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Instruksi pemulihan kata sandi telah dikirim ke:
            </p>
            <div className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs sm:text-sm font-mono font-semibold text-slate-800 dark:text-slate-200 mt-1">
              {email}
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/login"
              className="group w-full py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <span>Kembali ke Halaman Masuk</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Alamat Email Terdaftar
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

          <button
            type="submit"
            disabled={isLoading}
            className="group w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
          >
            {isLoading ? (
              <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Kirim Tautan Pemulihan</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              <span>Kembali ke Halaman Masuk</span>
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
