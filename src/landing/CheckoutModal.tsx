import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X, CheckCircle2, ArrowRight, User, CreditCard, QrCode, Tag, Copy, Check,
  ExternalLink, Lock
} from 'lucide-react';

/**
 * CheckoutModal Component
 * Dialog Checkout & Pendaftaran Workspace (Wide 2-column Enterprise SaaS layout).
 * Simulasi pemesanan lokal: form -> pembayaran -> sukses.
 */
export interface CheckoutPlan {
  id: string;
  name: string;
  badge: string;
  description: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  isPopular: boolean;
  isCustomPrice?: boolean;
  customPriceText?: string;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: CheckoutPlan | null;
  isAnnual: boolean;
}

type CheckoutStep = 'form' | 'payment' | 'success';
type PaymentMethod = 'qris' | 'va_bca' | 'va_mandiri' | 'credit_card';

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  workspaceName: string;
}

interface FormErrors extends Partial<Record<keyof FormState, string>> {}

export default function CheckoutModal({ isOpen, onClose, selectedPlan, isAnnual }: CheckoutModalProps) {
  const [step, setStep] = useState<CheckoutStep>('form');

  // Data Pelanggan & Workspace
  const [formData, setFormData] = useState<FormState>({
    fullName: '',
    email: '',
    phone: '',
    workspaceName: '',
  });

  // Promo Code
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; percent: number; text: string } | null>(null);
  const [promoError, setPromoError] = useState('');

  // Metode Pembayaran
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qris');

  const [errors, setErrors] = useState<FormErrors>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setErrors({});
      setAppliedPromo(null);
      setPromoCode('');
      setPromoError('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !selectedPlan) return null;

  // Hitung Biaya
  const basePrice = isAnnual
    ? (selectedPlan.annualPrice || selectedPlan.monthlyPrice || 99000)
    : (selectedPlan.monthlyPrice || 99000);

  const subtotal = selectedPlan.isCustomPrice
    ? 450000
    : basePrice;

  const discountAmount = appliedPromo ? Math.round(subtotal * appliedPromo.percent) : 0;
  const taxableTotal = subtotal - discountAmount;
  const taxAmount = Math.round(taxableTotal * 0.11); // PPN 11%
  const grandTotal = taxableTotal + taxAmount;

  // Handle Input Form
  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Terapkan Promo
  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (code === 'KNOWBASE' || code === 'DISKON10' || code === 'HEMAT10') {
      setAppliedPromo({ code, percent: 0.15, text: 'Diskon 15%' });
      setPromoError('');
    } else if (code === '') {
      setPromoError('Silakan masukkan kode kupon');
    } else {
      setPromoError('Kode promo tidak valid atau kedaluwarsa');
    }
  };

  // Validasi Form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Nama lengkap wajib diisi (min. 3 karakter)';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Format alamat email tidak valid';
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 8) {
      newErrors.phone = 'Nomor telepon/WhatsApp wajib diisi';
    }
    if (!formData.workspaceName.trim()) {
      newErrors.workspaceName = 'Nama institusi / ruang kerja wajib diisi';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setStep('payment');
  };

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep('success');
    }, 1000);
  };

  const workspaceSlug = formData.workspaceName
    ? formData.workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-')
    : 'perusahaan-anda';

  const handleCopyCredentials = () => {
    const text = `Alamat Workspace: https://${workspaceSlug}.knowbase.id\nEmail Admin: ${formData.email}\nPassword: KB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {step === 'form' && 'Formulir Pendaftaran & Pemesanan'}
              {step === 'payment' && 'Pilihan Saluran Pembayaran'}
              {step === 'success' && 'Pembayaran Terverifikasi & Ruang Kerja Aktif'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Paket: <span className="font-semibold text-slate-800">{selectedPlan.name}</span>
              {' • '}{isAnnual ? 'Periode Tahunan (Hemat 20%)' : 'Periode Bulanan'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Konten Scrollable Modal */}
        <div className="overflow-y-auto p-6 sm:p-7 flex-1 text-xs sm:text-sm">

          {/* TAHAP 1: FORMULIR DATA */}
          {step === 'form' && (
            <form onSubmit={handleProceedToPayment}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">

                {/* KOLOM KIRI: Data Pelanggan & Workspace */}
                <div className="md:col-span-7 space-y-4">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Data Penanggung Jawab & Organisasi</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Budi Santoso"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                          errors.fullName ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
                        }`}
                      />
                      {errors.fullName && (
                        <p className="text-[11px] text-red-500 mt-1">{errors.fullName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Resmi / Kantor <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="nama@perusahaan.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                          errors.email ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
                        }`}
                      />
                      {errors.email && (
                        <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nomor WhatsApp / HP <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="081234567890"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                          errors.phone ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
                        }`}
                      />
                      {errors.phone && (
                        <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Institusi / Organisasi <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: PT Sumber Rezeki"
                        value={formData.workspaceName}
                        onChange={(e) => handleInputChange('workspaceName', e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                          errors.workspaceName ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
                        }`}
                      />
                      {errors.workspaceName && (
                        <p className="text-[11px] text-red-500 mt-1">{errors.workspaceName}</p>
                      )}
                    </div>
                  </div>

                  {/* Subdomain Preview */}
                  <div className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span>Subdomain Ruang Kerja:</span>
                    <strong className="text-blue-700 font-mono">https://{workspaceSlug}.knowbase.id</strong>
                  </div>

                  {/* Kupon Diskon */}
                  <div className="pt-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kupon Diskon (Opsional)
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Masukkan kode (contoh: KNOWBASE)"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs uppercase font-mono focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        Gunakan
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-[11px] text-red-500 mt-1">{promoError}</p>
                    )}
                    {appliedPromo && (
                      <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Kupon {appliedPromo.code} berhasil dipasang ({appliedPromo.text})
                      </p>
                    )}
                  </div>
                </div>

                {/* KOLOM KANAN: Ringkasan Paket & Rincian Biaya */}
                <div className="md:col-span-5 bg-slate-50 rounded-2xl p-5 border border-slate-200/90 space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Paket Terpilih
                    </div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="font-bold text-base text-slate-900">
                        {selectedPlan.name}
                      </span>
                      <span className="font-mono font-bold text-base text-blue-600">
                        Rp {subtotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isAnnual ? 'Penagihan tahunan (Hemat 20%)' : 'Penagihan rutin per bulan'}
                    </p>
                  </div>

                  {/* Rincian Angka */}
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Biaya Langganan:</span>
                      <span className="font-mono">Rp {subtotal.toLocaleString('id-ID')}</span>
                    </div>

                    {appliedPromo && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Potongan Kupon ({appliedPromo.code}):</span>
                        <span className="font-mono">-Rp {discountAmount.toLocaleString('id-ID')}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>PPN (11%):</span>
                      <span className="font-mono">Rp {taxAmount.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="pt-2.5 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
                      <span>Total Tagihan:</span>
                      <span className="text-lg font-mono text-slate-950 font-extrabold">
                        Rp {grandTotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Tombol Aksi */}
                  <button
                    type="submit"
                    className="w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>Pilih Metode Pembayaran</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 text-center pt-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>Enkripsi SSL 256-bit • Pembayaran Aman & Resmi</span>
                  </div>
                </div>

              </div>
            </form>
          )}

          {/* TAHAP 2: PILIHAN METODE PEMBAYARAN */}
          {step === 'payment' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">

              {/* Kolom Kiri: Pilihan Saluran */}
              <div className="md:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Pilih Saluran Pembayaran
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('form')}
                    className="text-xs text-blue-600 font-medium hover:underline cursor-pointer"
                  >
                    Ubah Data Pelanggan
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* QRIS */}
                  <div
                    onClick={() => setPaymentMethod('qris')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                      paymentMethod === 'qris'
                        ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-900">QRIS Instan</div>
                      <div className="text-[10px] text-slate-500">GoPay, OVO, BCA, Livin'</div>
                    </div>
                  </div>

                  {/* Virtual Account BCA */}
                  <div
                    onClick={() => setPaymentMethod('va_bca')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                      paymentMethod === 'va_bca'
                        ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                      BCA
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-900">BCA Virtual Account</div>
                      <div className="text-[10px] text-slate-500">Verifikasi Otomatis</div>
                    </div>
                  </div>

                  {/* Virtual Account Mandiri */}
                  <div
                    onClick={() => setPaymentMethod('va_mandiri')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                      paymentMethod === 'va_mandiri'
                        ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                      MDR
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-900">Mandiri Virtual Account</div>
                      <div className="text-[10px] text-slate-500">ATM & Livin' by Mandiri</div>
                    </div>
                  </div>

                  {/* Kartu Kredit / Debit */}
                  <div
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                      paymentMethod === 'credit_card'
                        ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-900">Kartu Kredit / Debit</div>
                      <div className="text-[10px] text-slate-500">Visa / Mastercard / JCB</div>
                    </div>
                  </div>
                </div>

                {/* Petunjuk Pembayaran Terpilih */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                  {paymentMethod === 'qris' && (
                    <div className="space-y-2">
                      <div className="mx-auto w-32 h-32 bg-white border border-slate-300 rounded-lg p-2 flex flex-col items-center justify-center">
                        <QrCode className="w-20 h-20 text-slate-800" />
                        <span className="text-[9px] font-mono text-slate-500">KNOWBASE-OFFICIAL</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Pindai kode QRIS di atas dengan aplikasi mobile banking atau e-wallet Anda.
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'va_bca' && (
                    <div className="space-y-1.5 py-1">
                      <div className="text-xs text-slate-500">Nomor Virtual Account BCA:</div>
                      <div className="font-mono text-lg font-bold text-slate-900 bg-white py-1.5 px-4 rounded-lg border border-slate-300 inline-block tracking-wider">
                        8277 0812 3456 7890
                      </div>
                      <p className="text-[11px] text-slate-500">Nama Penerima: <strong>KnowBase Solusi Digital</strong></p>
                    </div>
                  )}

                  {paymentMethod === 'va_mandiri' && (
                    <div className="space-y-1.5 py-1">
                      <div className="text-xs text-slate-500">Nomor Rekening Mandiri VA:</div>
                      <div className="font-mono text-lg font-bold text-slate-900 bg-white py-1.5 px-4 rounded-lg border border-slate-300 inline-block tracking-wider">
                        8988 9123 4567 8901
                      </div>
                      <p className="text-[11px] text-slate-500">Nama Penerima: <strong>KnowBase Solusi Digital</strong></p>
                    </div>
                  )}

                  {paymentMethod === 'credit_card' && (
                    <div className="space-y-2 max-w-sm mx-auto text-left py-1">
                      <input
                        type="text"
                        placeholder="Nomor Kartu (4xxx xxxx xxxx xxxx)"
                        defaultValue="4000 1234 5678 9010"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="MM/YY" defaultValue="12/28" className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono" />
                        <input type="text" placeholder="CVV" defaultValue="789" className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Kolom Kanan: Rincian Akhir & Tombol Konfirmasi */}
              <div className="md:col-span-5 bg-slate-50 rounded-2xl p-5 border border-slate-200/90 space-y-4">
                <div>
                  <span className="text-[11px] text-slate-500">Total Pembayaran:</span>
                  <div className="text-2xl font-bold font-mono text-slate-950 mt-0.5">
                    Rp {grandTotal.toLocaleString('id-ID')}
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1.5 border-t border-slate-200 pt-3">
                  <div className="flex justify-between">
                    <span>Organisasi:</span>
                    <strong className="text-slate-800">{formData.workspaceName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <strong className="text-slate-800 truncate max-w-[170px]">{formData.email}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Paket:</span>
                    <strong className="text-slate-800">{selectedPlan.name}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Memverifikasi Pembayaran...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Konfirmasi Pembayaran Selesai</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* TAHAP 3: STATUS SUKSES & WORKSPACE AKTIF */}
          {step === 'success' && (
            <div className="max-w-xl mx-auto space-y-5 text-center py-4">

              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-7 h-7 stroke-[3]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">
                  Pembayaran Berhasil Diverifikasi
                </h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Ruang kerja dokumen Anda telah siap dan dapat langsung diakses oleh seluruh anggota tim.
                </p>
              </div>

              {/* Rincian Kredensial Administrator */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-3 text-xs">
                <div className="font-semibold text-slate-800 pb-2 border-b border-slate-200 flex justify-between items-center">
                  <span>Data Akses Workspace</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">Status: Aktif</span>
                </div>

                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500 font-sans">URL Sistem:</span>
                    <span className="text-blue-600 font-semibold">https://{workspaceSlug}.knowbase.id</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500 font-sans">Email Admin:</span>
                    <span className="text-slate-800">{formData.email || 'admin@perusahaan.com'}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500 font-sans">Kata Sandi Awal:</span>
                    <span className="text-slate-900 font-bold">KB-PASS99</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCopyCredentials}
                    className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-300 cursor-pointer"
                  >
                    {copiedKey ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">Tersalin ke Clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Kredensial Akses</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Tombol Selesai */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  to="/login"
                  onClick={onClose}
                  className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Masuk ke Workspace Sekarang</span>
                </Link>

                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
