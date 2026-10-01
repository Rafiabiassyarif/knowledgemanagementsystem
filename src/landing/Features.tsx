import React, { useState } from 'react';
import {
  FileSpreadsheet,
  BookmarkCheck,
  Users2,
  ShieldAlert,
  Layers,
  LockKeyhole,
  Search,
  BarChart3,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { siteData } from './siteData';

// Mapping nama icon ke lucide component
const iconMap: Record<string, React.ElementType> = {
  FileSpreadsheet,
  BookmarkCheck,
  Users2,
  ShieldAlert,
  Layers,
  LockKeyhole,
  Search,
  BarChart3,
};

export default function Features() {
  const { features } = siteData;
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activeHighlightId = hoveredId !== null ? hoveredId : (features.list[0]?.id || 'upload');

  return (
    <section id="fitur" className="py-10 sm:py-14 bg-gradient-to-b from-white via-blue-50/30 to-white dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950 relative w-full transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">

        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10 space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Fitur Utama
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Teknologi cerdas untuk memahami dan mencari seluruh isi dokumen.
          </p>
        </div>

        {/* 3 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {features.list.map((item) => {
            const Icon = iconMap[item.iconName] || FileSpreadsheet;
            const isHighlighted = item.id === activeHighlightId;

            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`rounded-3xl p-6 sm:p-7 transition-all duration-300 flex flex-col justify-between cursor-pointer border ${
                  isHighlighted
                    ? 'bg-blue-600 text-white shadow-[0_16px_35px_-8px_rgba(37,99,235,0.35)] -translate-y-1.5 border-blue-600'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-700 shadow-xs hover:shadow-md'
                }`}
              >
                <div>
                  {/* Icon Circle */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-colors duration-200 ${
                      isHighlighted
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Title */}
                  <h3
                    className={`text-base font-bold mb-2 leading-snug ${
                      isHighlighted ? 'text-white' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p
                    className={`text-xs sm:text-sm leading-relaxed font-normal ${
                      isHighlighted ? 'text-blue-50' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.description}
                  </p>
                </div>

                {/* Bottom Status Indicator */}
                <div
                  className={`mt-6 pt-4 border-t flex items-center justify-between text-xs font-semibold ${
                    isHighlighted
                      ? 'border-white/20 text-white'
                      : 'border-slate-100 dark:border-slate-800 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Terintegrasi
                  </span>
                  <ArrowRight
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isHighlighted ? 'translate-x-1' : ''
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
