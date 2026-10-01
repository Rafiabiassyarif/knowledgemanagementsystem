import React from 'react';
import { Check, ArrowRight } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  badge: string;
  description: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  currency?: string;
  periodText?: string;
  isPopular: boolean;
  isCustomPrice?: boolean;
  customPriceText?: string;
  features: string[];
  ctaText: string;
  buttonVariant: string;
}

interface PricingCardProps {
  plan: Plan;
  isAnnual: boolean;
  onSelectPlan: (plan: Plan, isAnnual: boolean) => void;
}

export default function PricingCard({ plan, isAnnual, onSelectPlan }: PricingCardProps) {
  const isBusiness = plan.isPopular;
  const currentPrice = isAnnual ? plan.annualPrice : plan.monthlyPrice;

  const formatRupiah = (val: number | null) => {
    if (!val) return '';
    return val.toLocaleString('id-ID');
  };

  return (
    <div
      onClick={() => onSelectPlan(plan, isAnnual)}
      className={`rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 relative cursor-pointer group ${
        isBusiness
          ? 'bg-blue-600 text-white shadow-[0_20px_45px_-10px_rgba(37,99,235,0.4)] md:-translate-y-2 border-2 border-blue-500 hover:shadow-2xl hover:-translate-y-3'
          : 'bg-white text-slate-800 border border-slate-200/90 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1.5'
      }`}
    >
      <div>
        {/* Header Plan */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider font-mono ${
              isBusiness
                ? 'bg-white text-blue-600'
                : 'bg-blue-50 text-blue-600 border border-blue-100'
            }`}
          >
            {plan.badge}
          </span>
          {isBusiness && (
            <span className="text-[11px] font-semibold text-blue-100 bg-white/10 px-2 py-0.5 rounded-full">
              Pilihan Favorit
            </span>
          )}
        </div>

        <h3 className="text-xl sm:text-2xl font-bold mb-1">
          {plan.name}
        </h3>

        <p
          className={`text-xs leading-relaxed mb-6 font-normal ${
            isBusiness ? 'text-blue-100' : 'text-slate-500'
          }`}
        >
          {plan.description}
        </p>

        {/* Pricing Display */}
        <div className="mb-6 pb-6 border-b border-slate-100/20">
          {plan.isCustomPrice ? (
            <div className="text-2xl sm:text-3xl font-bold font-mono">
              {plan.customPriceText}
            </div>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold">{plan.currency}</span>
              <span className="text-3xl sm:text-4xl font-bold font-mono tracking-tight">
                {formatRupiah(currentPrice)}
              </span>
              <span
                className={`text-xs font-normal ${
                  isBusiness ? 'text-blue-100' : 'text-slate-400'
                }`}
              >
                {plan.periodText}
              </span>
            </div>
          )}
          {isAnnual && !plan.isCustomPrice && (
            <div
              className={`text-[11px] font-medium mt-1 ${
                isBusiness ? 'text-blue-200' : 'text-blue-600'
              }`}
            >
              Ditagih tahunan (Hemat 20%)
            </div>
          )}
        </div>

        {/* Features Checklist */}
        <div className="space-y-2.5 mb-8">
          <div
            className={`text-[11px] font-bold uppercase tracking-wider font-mono ${
              isBusiness ? 'text-blue-200' : 'text-slate-400'
            }`}
          >
            Fitur Termasuk:
          </div>
          {plan.features.map((feat, fIdx) => (
            <div
              key={fIdx}
              className={`flex items-start gap-2 text-xs leading-snug ${
                isBusiness ? 'text-blue-50' : 'text-slate-600'
              }`}
            >
              <Check
                className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                  isBusiness ? 'text-white' : 'text-blue-600'
                }`}
              />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelectPlan(plan, isAnnual);
        }}
        className={`w-full py-3 px-5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
          isBusiness
            ? 'bg-white text-blue-600 hover:bg-slate-50 shadow-md'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        <span>{plan.ctaText}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
