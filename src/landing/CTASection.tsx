import React from 'react';
import { ShieldCheck, CheckCircle2, FileCheck } from 'lucide-react';
import { siteData } from './siteData';

/**
 * CTASection Component (Clean Trust & Reassurance Banner)
 * Menampilkan pesan penutup dan jaminan keamanan tanpa tombol berulang.
 */
export default function CTASection() {
  const { ctaSection } = siteData;

  return (
    <section className="py-10 sm:py-12 bg-gradient-to-b from-blue-50/40 via-blue-100/20 to-white dark:from-slate-950 dark:via-slate-900/60 dark:to-slate-950 relative overflow-hidden border-t border-slate-100 dark:border-slate-800 w-full transition-colors duration-200">

      {/* Background Soft Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] rounded-full pointer-events-none opacity-100 dark:opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(191,219,254,0.45) 0%, rgba(219,234,254,0.18) 50%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 text-center space-y-4 z-10">

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-semibold">
          <FileCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Jaminan Layanan</span>
        </div>

        {/* Headline */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-normal text-slate-800 dark:text-slate-100 tracking-tight leading-tight text-balance">
          Mulai Transformasi <span className="font-bold text-slate-950 dark:text-white">Knowledge Base Anda</span>
        </h2>

        {/* Subheadline */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed font-normal">
          {ctaSection.subheadline}
        </p>

        {/* Footnote Reassurance */}
        <div className="pt-3 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Setup instan di bawah 5 menit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Enkripsi terisolasi per workspace</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{ctaSection.footnote}</span>
          </div>
        </div>

      </div>
    </section>
  );
}
