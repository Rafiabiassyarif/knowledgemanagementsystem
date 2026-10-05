import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import {
  Mail,
  ArrowLeft,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  Check
} from 'lucide-react';
import { api } from '../services/api';

type Step = 'email' | 'otp' | 'new_password' | 'success';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // Step state: 'email' -> 'otp' -> 'new_password' -> 'success'
  const [step, setStep] = useState<Step>('email');

  // Input states
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [verifiedCode, setVerifiedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mailSent, setMailSent] = useState(false);
  const [mailError, setMailError] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [copiedCode, setCopiedCode] = useState(false);

  // Refs for 6-digit OTP input boxes
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const otpCode = otpDigits.join('');

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Redirect countdown on success
  useEffect(() => {
    if (step !== 'success') return;
    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/login', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, navigate]);

  // Handle 6-digit OTP box inputs
  const handleDigitChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }

    // If pasted multiple digits
    if (clean.length > 1) {
      const chars = clean.slice(0, 6).split('');
      const next = [...otpDigits];
      chars.forEach((c, i) => {
        if (index + i < 6) next[index + i] = c;
      });
      setOtpDigits(next);
      const targetIdx = Math.min(5, index + chars.length);
      inputRefs.current[targetIdx]?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = clean.slice(-1);
    setOtpDigits(next);

    // Auto advance to next box
    if (index < 5 && clean) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const chars = pasted.split('');
    const next = ['', '', '', '', '', ''];
    chars.forEach((c, i) => {
      if (i < 6) next[i] = c;
    });
    setOtpDigits(next);
    inputRefs.current[Math.min(5, chars.length)]?.focus();
  };

  const autofillCode = (code: string) => {
    const chars = code.replace(/\D/g, '').slice(0, 6).split('');
    const next = ['', '', '', '', '', ''];
    chars.forEach((c, i) => {
      if (i < 6) next[i] = c;
    });
    setOtpDigits(next);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Step 1: Send OTP to Email
  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Masukkan alamat email Anda.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const res = await api.auth.forgotPassword(cleanEmail);
      const isSent = Boolean(res?.mailSent);
      setMailSent(isSent);
      setMailError(res?.mailError || '');

      if (isSent) {
        setGeneratedCode('');
        setOtpDigits(['', '', '', '', '', '']);
      } else {
        setGeneratedCode(res?.code || '');
        setOtpDigits(['', '', '', '', '', '']);
      }

      setResendCooldown(60);
      setStep('otp');
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      setError(err?.message || 'Gagal mengirim kode verifikasi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP Code (Harus valid sebelum bisa lanjut ke password baru)
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanCode = otpCode.trim();
    if (cleanCode.length < 6) {
      setError('Masukkan 6 digit kode verifikasi dengan lengkap.');
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.verifyResetCode(email.trim().toLowerCase(), cleanCode);
      setVerifiedCode(cleanCode);
      setStep('new_password');
    } catch (err: any) {
      setError(err?.message || 'Kode verifikasi tidak valid atau telah kedaluwarsa. Silakan periksa kembali.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Save New Password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!verifiedCode) {
      setError('Kode verifikasi belum divalidasi. Silakan masukkan kode terlebih dahulu.');
      setStep('otp');
      return;
    }

    if (newPassword.length < 6) {
      setError('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.resetPassword({
        email: email.trim().toLowerCase(),
        code: verifiedCode,
        newPassword
      });
      setStep('success');
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan kata sandi baru. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={
        step === 'email'
          ? 'Lupa Kata Sandi'
          : step === 'otp'
          ? 'Verifikasi Kode'
          : step === 'new_password'
          ? 'Buat Kata Sandi Baru'
          : 'Sandi Berhasil Diubah'
      }
      subtitle={
        step === 'email'
          ? 'Masukkan email Anda untuk menerima kode verifikasi pemulihan sandi'
          : step === 'otp'
          ? 'Masukkan 6 digit kode yang telah dikirim ke email Anda'
          : step === 'new_password'
          ? 'Kode terverifikasi! Masukkan kata sandi baru untuk akun Anda'
          : 'Kata sandi akun Anda telah berhasil diperbarui'
      }
    >
      {/* ======================================================== */}
      {/* LANGKAH 1: INPUT EMAIL                                   */}
      {/* ======================================================== */}
      {step === 'email' && (
        <form onSubmit={handleSendCode} className="space-y-5 animate-in fade-in duration-300">
          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs shadow-xs animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Email
            </label>
            <div className="relative group">
              <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
              <input
                type="email"
                required
                autoFocus
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-xs font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="group relative w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer overflow-hidden"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Kirim Kode Verifikasi</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold transition-colors group py-1"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Kembali ke Halaman Masuk</span>
            </Link>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* LANGKAH 2: VERIFIKASI KODE 6 DIGIT                      */}
      {/* (Kolom kata sandi baru BELUM BISA diakses sebelum kode valid) */}
      {/* ======================================================== */}
      {step === 'otp' && (
        <form onSubmit={handleVerifyCode} className="space-y-5 animate-in fade-in duration-300">
          {/* Target Email Chip */}
          <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Kode dikirim ke:</span>
                <span className="font-bold text-slate-900 dark:text-white truncate block">{email}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setError('');
              }}
              className="px-2.5 py-1 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 font-semibold text-xs transition-colors shrink-0 cursor-pointer"
            >
              Ubah Email
            </button>
          </div>

          {/* Status Email Terkirim */}
          {mailSent && (
            <div className="p-3.5 rounded-2xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-xs animate-in fade-in">
              <div className="flex items-center gap-2.5 text-blue-800 dark:text-blue-300 font-medium">
                <CheckCircle2 className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>
                  Kode verifikasi 6 digit telah dikirim ke kotak masuk email Anda. Silakan cek inbox atau folder Spam.
                </span>
              </div>
            </div>
          )}

          {/* Status Email Belum Terkirim (Pemberitahuan Aktivasi) */}
          {!mailSent && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs space-y-2.5 animate-in fade-in">
              <div className="flex items-start gap-2.5 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <span className="font-bold block">
                    {mailError.includes('Gmail API') || mailError.includes('disabled')
                      ? 'Gmail API Belum Diaktifkan di Google Cloud'
                      : 'Email Pengirim Belum Terhubung'}
                  </span>
                  <span className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed block mt-0.5">
                    {mailError.includes('Gmail API') || mailError.includes('disabled')
                      ? 'Proyek Google Cloud Anda membutuhkan izin aktivasi Gmail API. Klik tombol di bawah untuk mengaktifkannya.'
                      : 'Hubungkan akun Google pengirim (gzzzefan@gmail.com) agar email otomatis terkirim ke kotak masuk penerima.'}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {mailError.includes('Gmail API') || mailError.includes('disabled') ? (
                  <a
                    href="https://console.cloud.google.com/apis/library/gmail.googleapis.com?project=845976119055"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <span>Aktifkan Gmail API di Google Cloud (1-Klik)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <a
                    href="/api/auth/google/connect"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    <span>Hubungkan Gmail Pengirim (1-Klik OAuth)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                )}
                {generatedCode && (
                  <button
                    type="button"
                    onClick={() => autofillCode(generatedCode)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                    title="Klik untuk mengisi kode uji"
                  >
                    Kode Uji: {generatedCode}
                    {copiedCode ? <Check className="w-3 h-3 text-blue-600 inline ml-1" /> : null}
                  </button>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs shadow-xs animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
          )}

          {/* 6-DIGIT OTP CELLS */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 text-center">
              Masukkan 6 Digit Kode
            </label>
            <div className="flex items-center justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-extrabold rounded-2xl border transition-all duration-150 ${
                    digit
                      ? 'border-blue-600 dark:border-blue-500 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 focus:bg-white dark:focus:bg-slate-800'
                  } focus:outline-none`}
                />
              ))}
            </div>
          </div>

          {/* TOMBOL VERIFIKASI KODE */}
          <button
            type="submit"
            disabled={isLoading || otpCode.length < 6}
            className="group relative w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer overflow-hidden"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Verifikasi Kode</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {/* RESEND & CANCEL ACTIONS */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              type="button"
              disabled={resendCooldown > 0 || isLoading}
              onClick={() => handleSendCode()}
              className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline font-semibold disabled:opacity-50 disabled:no-underline cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>
                {resendCooldown > 0
                  ? `Kirim ulang kode (${resendCooldown}s)`
                  : 'Kirim Ulang Kode'}
              </span>
            </button>

            <Link
              to="/login"
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium transition-colors"
            >
              Batal
            </Link>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* LANGKAH 3: BUAT KATA SANDI BARU                          */}
      {/* (Hanya terbuka setelah kode OTP terverifikasi)           */}
      {/* ======================================================== */}
      {step === 'new_password' && (
        <form onSubmit={handleSavePassword} className="space-y-5 animate-in fade-in duration-300">
          {/* Badge Kode Terverifikasi */}
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 flex items-center gap-3 text-xs">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="font-bold text-blue-900 dark:text-blue-200 block">Kode Terverifikasi</span>
              <span className="text-[11px] text-blue-700 dark:text-blue-400 block">
                Akun: <b>{email}</b> siap dibuatkan kata sandi baru.
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs shadow-xs animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span className="leading-relaxed font-medium">{error}</span>
            </div>
          )}

          {/* NEW PASSWORD FIELD */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Kata Sandi Baru
            </label>
            <div className="relative group">
              <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full text-sm pl-11 pr-11 py-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-xs font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
                title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* CONFIRM PASSWORD FIELD */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Konfirmasi Kata Sandi Baru
            </label>
            <div className="relative group">
              <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                placeholder="Ulangi kata sandi baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full text-sm pl-11 pr-11 py-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-xs font-medium"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
                title={showConfirm ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isLoading || newPassword.length < 6 || confirmPassword.length < 6}
            className="group relative w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer overflow-hidden mt-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4.5 h-4.5" />
                <span>Simpan Kata Sandi Baru</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* ======================================================== */}
      {/* LANGKAH 4: SUKSES                                        */}
      {/* ======================================================== */}
      {step === 'success' && (
        <div className="text-center space-y-5 py-4 animate-in fade-in duration-300">
          <div className="relative w-18 h-18 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-500/30 animate-in zoom-in-75 duration-300">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Kata Sandi Berhasil Diperbarui!
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
              Akun Anda sekarang telah menggunakan kata sandi baru. Dialihkan ke halaman login dalam{' '}
              <span className="font-bold text-blue-600 dark:text-blue-400">{redirectCountdown} detik</span>...
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/login"
              className="group w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Masuk Sekarang</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};
