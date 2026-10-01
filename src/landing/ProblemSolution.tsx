import React from 'react';
import { siteData } from './siteData';

/**
 * ProblemSolution Component
 * Menampilkan kartu keunggulan solusi yang simpel, bersih,
 * tanpa pembagian "sebelumnya" dan "sesudah".
 */
export default function ProblemSolution() {
  const { problemSolution } = siteData;

  return (
    <section id="solusi" className="py-10 sm:py-14 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 w-full transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">

        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10 space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Solusi KnowBase
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Temukan jawaban langsung dari dokumen tanpa pencarian manual.
          </p>
        </div>

        {/* 3 Simpel Cards (Tanpa Sebelumnya / Sesudah) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {problemSolution.items.map((item) => (
            <div
              key={item.number}
              className="bg-slate-50/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-lg transition-all duration-300 flex flex-col space-y-4"
            >
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-md border border-blue-100 dark:border-blue-900/50 w-fit">
                {item.number}
              </span>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {item.title}
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
