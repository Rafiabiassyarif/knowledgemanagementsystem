import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, CheckCircle2, ShieldCheck, FileCheck } from 'lucide-react';
import KnowledgeNetwork from './KnowledgeNetwork';

/**
 * Hero Component (Split Layout: Teks di Kiri, Jaringan Knowledge 3D di Kanan)
 * Tampilan profesional korporat, bersih, tanpa ikon kartun/emotikon berlebihan.
 */
export default function Hero() {
  const shouldReduceMotion = useReducedMotion();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative pt-24 sm:pt-28 pb-10 sm:pb-12 bg-white dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 w-full transition-colors duration-200">

      {/* Background Soft Blue Ambient Diffuse Glow */}
      <div
        className="absolute top-1/4 right-1/4 w-[650px] h-[520px] rounded-full pointer-events-none opacity-100 dark:opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(219,234,254,0.5) 0%, rgba(240,249,255,0.2) 50%, transparent 75%)',
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 z-10">

        {/* Split Grid: Kiri Teks Web, Kanan Jaringan 3D */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">

          {/* === SISI KIRI: Teks & Aksi Web === */}
          <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 text-center lg:text-left space-y-6"
          >
            {/* Headline Proporsional & Elegan */}
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-normal tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                <span className="text-blue-600 dark:text-blue-400 font-bold block sm:inline">AI Knowledge</span> Powered by KnowBase
                <br />
                <span>Pahami Setiap </span>
                <span className="font-extrabold text-slate-950 dark:text-blue-200">Dokumen</span>
              </h1>
            </div>

            {/* Subheadline Sederhana & Jelas */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg mx-auto lg:mx-0 leading-relaxed font-normal">
              Tanya jawab langsung dengan isi dokumen Anda. Dapatkan jawaban instan dengan rujukan halaman yang akurat.
            </p>

            {/* Tombol CTA Aksi */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-1">
              {/* Tombol Utama: ke halaman register */}
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all duration-200 shadow-[0_10px_25px_-5px_rgba(37,99,235,0.45)] hover:shadow-[0_12px_30px_-5px_rgba(37,99,235,0.6)]"
              >
                <span>Mulai Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Tombol Sekunder */}
              <button
                type="button"
                onClick={() => scrollToSection('fitur')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-800 font-semibold text-sm transition-all duration-200 shadow-2xs hover:shadow-sm cursor-pointer"
              >
                <span>Pelajari Fitur</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Indikator Keunggulan Profesional (Tanpa Emotikon) */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              <div className="flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Rujukan Halaman Asli</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Enkripsi AES-256</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>99.4% Akurasi Semantik</span>
              </div>
            </div>
          </motion.div>

          {/* === SISI KANAN: Jaringan Knowledge AI Terhubung Multi-Node === */}
          <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="lg:col-span-6 flex items-center justify-center relative w-full pt-4 lg:pt-0"
          >
            <KnowledgeNetwork />
          </motion.div>

        </div>

      </div>
    </section>
  );
}
