import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Database, 
  MessageSquare, 
  CheckCircle2, 
  ShieldCheck, 
  Zap,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface RagStep {
  step: string;
  name: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

export default function RAGIntro() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  // 1. TAHAP ALUR RAG (3 Kartu Langkah R-A-G yang Jelas Tanpa Pill Badge)
  const ragSteps: RagStep[] = [
    {
      step: 'R',
      name: 'Retrieval',
      title: 'Pindai Fakta Dokumen',
      description:
        'Saat Anda bertanya, mesin pencari semantik memindai ribuan lembar berkas PDF/Word untuk menemukan paragraf yang paling relevan dalam hitungan milidetik.',
      icon: Search,
    },
    {
      step: 'A',
      name: 'Augmented',
      title: 'Kunci Konteks Acuan',
      description:
        'Potongan kalimat faktual yang ditemukan disuntikkan ke AI sebagai acuan tunggal. AI dilarang keras menebak di luar konteks berkas asli dokumen Anda.',
      icon: Database,
    },
    {
      step: 'G',
      name: 'Generation',
      title: 'Jawaban & Nomor Halaman',
      description:
        'AI merangkum respon dalam bahasa alami yang lugas, lengkap dengan kutipan bab, nama file sumber, dan nomor halaman dokumen asli yang dapat langsung diklik.',
      icon: MessageSquare,
    },
  ];

  return (
    <section id="rag" className="py-12 sm:py-16 bg-gradient-to-b from-white via-blue-50/20 to-white dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950 border-b border-slate-100 dark:border-slate-800 w-full transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Apa itu Teknologi <span className="text-blue-600 dark:text-blue-400">RAG</span>?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            <strong className="text-slate-800 dark:text-slate-200">Retrieval-Augmented Generation (RAG)</strong> adalah metode AI cerdas yang
            mengaitkan model bahasa langsung ke berkas dokumen Anda untuk menghasilkan jawaban akurat tanpa halusinasi.
          </p>
        </div>

        {/* 3 Tahap Alur RAG (R - A - G) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 sm:mb-20">
          {ragSteps.map((stepItem, idx) => {
            const Icon = stepItem.icon;
            const isHovered = hoveredStep === idx;

            return (
              <div
                key={stepItem.step}
                onMouseEnter={() => setHoveredStep(idx)}
                onMouseLeave={() => setHoveredStep(null)}
                className={`group relative rounded-2xl p-6 border transition-all duration-300 cursor-pointer text-left select-none ${
                  isHovered
                    ? 'border-blue-500 shadow-xl -translate-y-1.5 ring-2 ring-blue-500/20 bg-white dark:bg-slate-900'
                    : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 bg-white dark:bg-slate-900/70'
                }`}
              >
                {/* Top Bar with Icon */}
                <div className="mb-4">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      isHovered
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105'
                        : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105 border border-blue-100 dark:border-blue-900/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {stepItem.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  {stepItem.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Tahap {stepItem.name} terintegrasi</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. TUJUAN & MANFAAT UTAMA (DESAIN MENARIK, MODERN & INTERAKTIF) */}
        <div className="relative pt-12 sm:pt-16 border-t border-slate-200/80 dark:border-slate-800">
          
          {/* Subtle Ambient Glow Effect */}
          <div className="absolute -left-24 top-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-3xl pointer-events-none -z-10" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
            
            {/* Sisi Kiri: Judul & Narasi Visual yang Menarik */}
            <motion.div 
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="lg:col-span-5 space-y-4 lg:sticky lg:top-24"
            >
              {/* Badge Kicker Elegan */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200/60 dark:border-blue-900/60 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Nilai Utama RAG</span>
              </div>

              {/* Judul dengan Aksen Warna Biru */}
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.2]">
                Tujuan & <span className="text-blue-600 dark:text-blue-400">Manfaat Utama</span> untuk Anda
              </h3>

              {/* Subjudul */}
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Kenapa menggunakan RAG jauh lebih unggul dibandingkan AI biasa?
              </p>


            </motion.div>

            {/* Sisi Kanan: 3 Poin Manfaat Ke Samping dengan Animasi Halus & Interaktif */}
            <div className="lg:col-span-7 divide-y divide-slate-100 dark:divide-slate-800/80">
              
              {/* Item 1 */}
              <motion.div 
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
                className="group p-5 sm:p-6 -mx-4 sm:-mx-6 rounded-2xl hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition-all duration-300 cursor-default flex items-start gap-4 sm:gap-5"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-2xs group-hover:shadow-md group-hover:shadow-blue-500/20 mt-0.5">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Bebas Halusinasi (100% Fakta)
                    </h4>
                    <span className="font-mono text-xs font-bold text-slate-300 dark:text-slate-600 group-hover:text-blue-500/60 transition-colors shrink-0">
                      01
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                    AI biasa sering mengarang ketika tidak mengetahui data spesifik. RAG memastikan seluruh jawaban hanya bersumber dari isi dokumen resmi yang sah tanpa tebakan.
                  </p>
                </div>
              </motion.div>

              {/* Item 2 */}
              <motion.div 
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                className="group p-5 sm:p-6 -mx-4 sm:-mx-6 rounded-2xl hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition-all duration-300 cursor-default flex items-start gap-4 sm:gap-5"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/50 group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-2xs group-hover:shadow-md group-hover:shadow-amber-500/20 mt-0.5">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      Hemat 90% Waktu Riset
                    </h4>
                    <span className="font-mono text-xs font-bold text-slate-300 dark:text-slate-600 group-hover:text-amber-500/60 transition-colors shrink-0">
                      02
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                    Tidak perlu lagi membaca manual berkas ratusan lembar. Dapatkan inti jawaban dalam waktu 3 detik.
                  </p>
                </div>
              </motion.div>

              {/* Item 3 */}
              <motion.div 
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
                className="group p-5 sm:p-6 -mx-4 sm:-mx-6 rounded-2xl hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition-all duration-300 cursor-default flex items-start gap-4 sm:gap-5"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/50 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-2xs group-hover:shadow-md group-hover:shadow-emerald-500/20 mt-0.5">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      Kerahasiaan Dokumen Terjamin
                    </h4>
                    <span className="font-mono text-xs font-bold text-slate-300 dark:text-slate-600 group-hover:text-emerald-500/60 transition-colors shrink-0">
                      03
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                    Seluruh dokumen tersimpan dalam ruang kerja terenkripsi dan tidak digunakan untuk melatih model AI publik.
                  </p>
                </div>
              </motion.div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
