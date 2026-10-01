import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { siteData } from './siteData';

export default function FAQ() {
  const { faqs } = siteData;
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const toggleAccordion = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="py-10 sm:py-14 bg-gradient-to-b from-white via-blue-50/20 to-white dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950 border-t border-slate-100 dark:border-slate-800 w-full transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">

        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-6 space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Pertanyaan Umum (FAQ)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Jawaban untuk hal-hal yang sering ditanyakan seputar KnowBase AI.
          </p>
        </div>

        {/* Accordion Container */}
        <div className="max-w-4xl mx-auto space-y-3">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs transition-all duration-200 hover:border-blue-200 dark:hover:border-blue-700"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(faq.id)}
                  aria-expanded={isOpen}
                  className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 focus:outline-none focus-visible:bg-blue-50/50 dark:focus-visible:bg-slate-800 cursor-pointer"
                >
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {faq.question}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? 'bg-blue-600 text-white rotate-180'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-4 pt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 font-normal">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
