import React from 'react';
import { motion } from 'motion/react';
import {
  Building2,
  UploadCloud,
  Cpu,
  SearchCheck,
  ArrowRight,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { siteData } from './siteData';

const stepIcons = [Building2, UploadCloud, Cpu, SearchCheck];

/**
 * HowItWorks Component (Roadmap Style)
 * Menampilkan alur kerja berurutan dengan rel penghubung (roadmap timeline),
 * node penanda milestone yang saling tersambung, dan indikator progresif.
 */
export default function HowItWorks() {
  const { howItWorks } = siteData;

  return (
    <section id="cara-kerja" className="py-10 sm:py-14 bg-gradient-to-b from-white via-slate-50/50 to-white dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950 relative w-full overflow-hidden transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">

        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10 space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Cara Kerja
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Unggah dokumen dan mulai tanya jawab dalam 4 langkah mudah.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP CONNECTED ROADMAP (Tampil di Layar Besar lg:flex)                 */}
        {/* ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:block relative mb-12"
        >

          {/* Main Continuous Connecting Track Line */}
          <div
            className="absolute top-10 left-[8%] right-[8%] h-1 bg-gradient-to-r from-blue-300 via-blue-500 to-indigo-600 rounded-full z-0"
            aria-hidden="true"
          />

          {/* Animated Glow Flow Pulse across the track */}
          <div
            className="absolute top-10 left-[8%] right-[8%] h-1 bg-gradient-to-r from-transparent via-white/80 to-transparent rounded-full z-0 animate-pulse pointer-events-none"
            aria-hidden="true"
          />

          {/* 4 Connected Milestone Nodes & Cards */}
          <div className="grid grid-cols-4 gap-6 relative z-10">
            {howItWorks.steps.map((step, idx) => {
              const Icon = stepIcons[idx] || SearchCheck;
              const isLast = idx === howItWorks.steps.length - 1;

              return (
                <div key={step.step} className="flex flex-col items-center text-center group">

                  {/* Milestone Hub Node (Lingkaran Node di Atas Garis Rel) */}
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-3xl bg-white dark:bg-slate-900 p-1.5 shadow-[0_8px_25px_-4px_rgba(37,99,235,0.25)] border-2 border-blue-500 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:border-blue-600 group-hover:shadow-[0_12px_30px_-4px_rgba(37,99,235,0.4)]">
                      <div className="w-full h-full rounded-2xl bg-blue-50/80 dark:bg-blue-950/60 group-hover:bg-blue-600 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors duration-300 flex flex-col items-center justify-center">
                        <Icon className="w-6 h-6 mb-0.5" />
                        <span className="font-mono text-[10px] font-bold tracking-wider">
                          STEP {step.step}
                        </span>
                      </div>
                    </div>

                    {/* Sequential Connector Arrow Badge between stages */}
                    {!isLast && (
                      <div className="absolute top-1/2 -right-6 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 shadow-xs flex items-center justify-center z-20">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Roadmap Content Card */}
                  <div className="w-full bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-300 flex-1 flex flex-col justify-between text-left">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">
                        <span>TAHAP {step.step}</span>
                        <span className="text-slate-400 dark:text-slate-500 font-normal">{step.tag}</span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {step.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                        {step.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                      <span>Progres Alur</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        {isLast ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-emerald-600 dark:text-emerald-400">Siap Operasi</span>
                          </>
                        ) : (
                          <>
                            <span>Lanjut</span>
                            <ArrowRight className="w-3 h-3" />
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </motion.div>

        {/* ========================================================================= */}
        {/* MOBILE & TABLET VERTICAL ROADMAP (Tampil di Layar < lg)                  */}
        {/* ========================================================================= */}
        <div className="lg:hidden relative pl-8 sm:pl-10 space-y-6">

          {/* Vertical Connecting Roadmap Spine */}
          <div
            className="absolute left-3.5 sm:left-4.5 top-6 bottom-6 w-1 bg-gradient-to-b from-blue-400 via-blue-500 to-indigo-600 rounded-full"
            aria-hidden="true"
          />

          {howItWorks.steps.map((step, idx) => {
            const Icon = stepIcons[idx] || SearchCheck;
            const isLast = idx === howItWorks.steps.length - 1;

            return (
              <div key={step.step} className="relative group">

                {/* Vertical Milestone Node on Track */}
                <div className="absolute -left-8 sm:-left-10 top-5 -translate-x-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-600 shadow-md flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-mono font-bold z-10">
                  {step.step}
                </div>

                {/* Card Content */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                        Tahap {step.step} · {step.tag}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {step.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed pl-1">
                    {step.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                    <span>Langkah {idx + 1} dari 4</span>
                    {isLast ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Siap Digunakan
                      </span>
                    ) : (
                      <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                        Menuju Tahap {idx + 2}
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}

        </div>

      </div>
    </section>
  );
}
