import React, { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { useApp } from '../../context/AppContext';
import { 
  Zap, 
  Check, 
  Sparkles, 
  Crown, 
  ShieldCheck, 
  FileText, 
  Database,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsage?: number;
  maxQuota?: number;
}

export const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({
  isOpen,
  onClose,
  currentUsage = 0,
  maxQuota = 5
}) => {
  const { currentUser } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'enterprise'>('pro');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const currentPlan = currentUser?.plan || 'free';

  const handleUpgrade = async (plan: 'pro' | 'enterprise') => {
    if (!currentUser) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/documents/upgrade-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, plan })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message || `Paket ${plan.toUpperCase()} berhasil diaktifkan!`);
        // Refresh page/context after short delay
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        alert(data.message || 'Gagal upgrade paket.');
      }
    } catch (err: any) {
      alert(err?.message || 'Terjadi kesalahan saat memproses upgrade.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Paket & Kuota Dokumen RAG"
      subtitle="Tingkatkan kuota unggah untuk menambah kapasitas dokumen & knowledge base RAG Anda"
    >
      <div className="space-y-6">
        {/* Current Quota Status Banner */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Status Kuota Akun
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                currentPlan === 'enterprise'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                  : currentPlan === 'pro'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                Paket {currentPlan}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-white mt-1">
              {currentPlan === 'enterprise' ? 'Dokumen Tanpa Batas' : `${currentUsage} dari ${maxQuota} Dokumen Terpakai`}
            </p>
          </div>

          {currentPlan !== 'enterprise' && (
            <div className="w-full sm:w-48">
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentUsage >= maxQuota 
                      ? 'bg-rose-500' 
                      : currentUsage / maxQuota > 0.7 
                        ? 'bg-amber-500' 
                        : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(100, (currentUsage / maxQuota) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block text-right font-medium">
                {Math.max(0, maxQuota - currentUsage)} kuota tersisa
              </span>
            </div>
          )}
        </div>

        {successMessage ? (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{successMessage}</h4>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Memperbarui sesi akun...</p>
          </div>
        ) : (
          /* Plan Comparison Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pro Plan */}
            <div className={`rounded-xl border p-4.5 flex flex-col justify-between transition-all relative ${
              selectedPlan === 'pro'
                ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/20 dark:bg-blue-950/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800'
            }`}>
              <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                Paling Populer
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Paket Pro</h4>
                    <p className="text-[11px] text-slate-400">Untuk profesional & tim kecil</p>
                  </div>
                </div>

                <div className="mt-3.5 flex items-baseline gap-1">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">Rp 99.000</span>
                  <span className="text-xs text-slate-400">/bulan</span>
                </div>

                <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span><strong>100 Dokumen</strong> & Knowledge Base</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Penyimpanan CDN Kroombox otomatis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Prioritas pemrosesan RAG AI</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Ukuran berkas hingga 50 MB</span>
                  </li>
                </ul>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleUpgrade('pro')}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{currentPlan === 'pro' ? 'Perpanjang Paket Pro' : 'Pilih Paket Pro'}</span>
                </button>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className={`rounded-xl border p-4.5 flex flex-col justify-between transition-all ${
              selectedPlan === 'enterprise'
                ? 'border-purple-600 ring-2 ring-purple-600/20 bg-purple-50/20 dark:bg-purple-950/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800'
            }`}>
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Paket Enterprise</h4>
                    <p className="text-[11px] text-slate-400">Kapasitas penuh tanpa batas</p>
                  </div>
                </div>

                <div className="mt-3.5 flex items-baseline gap-1">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">Rp 299.000</span>
                  <span className="text-xs text-slate-400">/bulan</span>
                </div>

                <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span><strong>Dokumen Tanpa Batas</strong> (Unlimited)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span>Kapasitas CDN berkecepatan tinggi</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span>Akses RAG Jev AI multi-organisasi</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span>Dukungan teknis prioritas 24/7</span>
                  </li>
                </ul>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleUpgrade('enterprise')}
                  className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>{currentPlan === 'enterprise' ? 'Paket Aktif Saat Ini' : 'Pilih Enterprise'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-400 dark:text-slate-500">
          Semua dokumen yang diunggah disimpan dengan aman di <strong>Kroombox Edge CDN</strong> dan diindeks otomatis ke mesin pencarian RAG AI.
        </div>
      </div>
    </BottomSheet>
  );
};
