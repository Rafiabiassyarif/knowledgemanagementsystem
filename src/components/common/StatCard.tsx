import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  description?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  isPositive = true,
  icon: Icon,
  description
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide uppercase">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700/80">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-slate-900 dark:text-white tabular-nums tracking-tight">{value}</span>
        {change && (
          <span className={`text-xs font-medium tabular-nums ${isPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
            {change}
          </span>
        )}
      </div>
      {description && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{description}</p>
      )}
    </div>
  );
};
