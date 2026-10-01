import React, { useState } from 'react';
import { siteData } from './siteData';
import PricingCard from './PricingCard';

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

interface PricingProps {
  onSelectPlan: (plan: Plan, isAnnual: boolean) => void;
}

export default function Pricing({ onSelectPlan }: PricingProps) {
  const [isAnnual, setIsAnnual] = useState(false);
  const plans = siteData.pricing.plans as Plan[];

  return (
    <section id="paket" className="py-12 sm:py-16 bg-gradient-to-b from-white via-blue-50/20 to-white border-t border-slate-100 w-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
            Pilihan Paket
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Pilih paket yang sesuai untuk kebutuhan Anda.
          </p>

          {/* Billing Switcher (Monthly vs Annual) */}
          <div className="pt-4 flex items-center justify-center gap-3 text-xs">
            <span
              className={`font-semibold transition-colors ${
                !isAnnual ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              Tagihan Bulanan
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={isAnnual}
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-blue-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isAnnual ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>

            <span
              className={`font-semibold flex items-center gap-1.5 transition-colors ${
                isAnnual ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <span>Tagihan Tahunan</span>
              <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                Hemat 20%
              </span>
            </span>
          </div>
        </div>

        {/* 3 Pricing Cards Grid (Interaktif Langsung) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-2">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isAnnual={isAnnual}
              onSelectPlan={onSelectPlan}
            />
          ))}
        </div>

        {/* Footnote Assurance */}
        <div className="mt-12 text-center text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
          Semua paket dilengkapi enkripsi database per workspace, pencarian semantik cerdas, dan jaminan data tidak digunakan untuk pelatihan model publik.
        </div>

      </div>
    </section>
  );
}
