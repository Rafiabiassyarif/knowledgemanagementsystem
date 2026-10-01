import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

export type StatCardVariant = 'blue' | 'indigo' | 'emerald' | 'amber' | 'purple' | 'rose' | 'teal' | 'default';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  description?: string;
  variant?: StatCardVariant;
  badge?: string;
  sparkline?: boolean;
}

const variantStyles: Record<StatCardVariant, {
  iconWrapper: string;
  iconColor: string;
  borderHover: string;
  topLine: string;
  badgeBg: string;
}> = {
  indigo: {
    iconWrapper: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-100/80 dark:border-indigo-800/60',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    borderHover: 'hover:border-indigo-300 dark:hover:border-indigo-700/80 hover:shadow-indigo-500/5',
    topLine: 'from-indigo-500 to-blue-500',
    badgeBg: 'bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-800/50'
  },
  purple: {
    iconWrapper: 'bg-purple-50 dark:bg-purple-950/60 border-purple-100/80 dark:border-purple-800/60',
    iconColor: 'text-purple-600 dark:text-purple-400',
    borderHover: 'hover:border-purple-300 dark:hover:border-purple-700/80 hover:shadow-purple-500/5',
    topLine: 'from-purple-500 to-indigo-500',
    badgeBg: 'bg-purple-50/80 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/50'
  },
  blue: {
    iconWrapper: 'bg-blue-50 dark:bg-blue-950/60 border-blue-100/80 dark:border-blue-800/60',
    iconColor: 'text-blue-600 dark:text-blue-400',
    borderHover: 'hover:border-blue-300 dark:hover:border-blue-700/80 hover:shadow-blue-500/5',
    topLine: 'from-blue-500 to-cyan-500',
    badgeBg: 'bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/50'
  },
  emerald: {
    iconWrapper: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100/80 dark:border-emerald-800/60',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    borderHover: 'hover:border-emerald-300 dark:hover:border-emerald-700/80 hover:shadow-emerald-500/5',
    topLine: 'from-emerald-500 to-teal-500',
    badgeBg: 'bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50'
  },
  amber: {
    iconWrapper: 'bg-amber-50 dark:bg-amber-950/60 border-amber-100/80 dark:border-amber-800/60',
    iconColor: 'text-amber-600 dark:text-amber-400',
    borderHover: 'hover:border-amber-300 dark:hover:border-amber-700/80 hover:shadow-amber-500/5',
    topLine: 'from-amber-500 to-orange-500',
    badgeBg: 'bg-amber-50/80 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/50'
  },
  rose: {
    iconWrapper: 'bg-rose-50 dark:bg-rose-950/60 border-rose-100/80 dark:border-rose-800/60',
    iconColor: 'text-rose-600 dark:text-rose-400',
    borderHover: 'hover:border-rose-300 dark:hover:border-rose-700/80 hover:shadow-rose-500/5',
    topLine: 'from-rose-500 to-pink-500',
    badgeBg: 'bg-rose-50/80 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/50 dark:border-rose-800/50'
  },
  teal: {
    iconWrapper: 'bg-teal-50 dark:bg-teal-950/60 border-teal-100/80 dark:border-teal-800/60',
    iconColor: 'text-teal-600 dark:text-teal-400',
    borderHover: 'hover:border-teal-300 dark:hover:border-teal-700/80 hover:shadow-teal-500/5',
    topLine: 'from-teal-500 to-emerald-500',
    badgeBg: 'bg-teal-50/80 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200/50 dark:border-teal-800/50'
  },
  default: {
    iconWrapper: 'bg-slate-100 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/80',
    iconColor: 'text-slate-600 dark:text-slate-300',
    borderHover: 'hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-slate-500/5',
    topLine: 'from-slate-400 to-slate-500',
    badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  }
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  isPositive = true,
  icon: Icon,
  description,
  variant = 'default',
  badge
}) => {
  const styles = variantStyles[variant] || variantStyles.default;
  const isStringValue = typeof value === 'string';
  const isLongValue = isStringValue && value.length > 5;

  return (
    <div className={`group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${styles.borderHover} overflow-hidden flex flex-col justify-between`}>
      {/* Top Accent Gradient Line on Hover */}
      <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${styles.topLine} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />

      <div>
        {/* Header: Label & Icon */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate">
            {label}
          </span>
          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-200 ${styles.iconWrapper} ${styles.iconColor}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>

        {/* Value Display */}
        <div className="mt-3">
          <div className={`font-bold tracking-tight text-slate-900 dark:text-white tabular-nums ${isLongValue ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'}`}>
            {value}
          </div>
        </div>
      </div>

      {/* Footer / Subtitle / Trend Badge */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5 flex-wrap">
        {change ? (
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-medium border tabular-nums truncate max-w-full ${
            isPositive
              ? 'bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/50'
              : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/60'
          }`}>
            {isPositive && change.startsWith('+') && <TrendingUp className="w-2.5 h-2.5 shrink-0 text-emerald-600 dark:text-emerald-400" />}
            {!isPositive && change.startsWith('-') && <TrendingDown className="w-2.5 h-2.5 shrink-0 text-rose-500" />}
            <span className="truncate">{change}</span>
          </span>
        ) : badge ? (
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border truncate ${styles.badgeBg}`}>
            {badge}
          </span>
        ) : description ? (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{description}</p>
        ) : (
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Live Realtime</span>
        )}
      </div>
    </div>
  );
};
