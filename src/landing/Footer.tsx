import React from 'react';
import { Mail, Clock, ShieldCheck } from 'lucide-react';
import { siteData } from './siteData';

/**
 * Footer Component (Struktur Multi-Kolom dengan Latar Biru)
 * Mempertahankan tata letak kolom yang lengkap, elegan, dan profesional
 * dengan balutan warna biru khas brand KnowBase AI.
 */
export default function Footer() {
  return (
    <footer className="bg-blue-600 dark:bg-slate-950 text-white w-full border-t border-blue-500 dark:border-slate-800 transition-colors duration-200">

      {/* Bagian Utama Footer (Multi-Kolom) */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">

          {/* Kolom 1: Brand & Kredibilitas (Lebar 2 Kolom) */}
          <div className="lg:col-span-2 space-y-4">
            <a
              href="#"
              className="inline-flex items-center gap-2 text-white group focus:outline-none"
              aria-label={`${siteData.brand.name} - Beranda`}
            >
              <div className="flex items-center gap-1">
                <span className="w-2 h-5 rounded-full bg-white rotate-12 inline-block transform" />
                <span className="w-1.5 h-3.5 rounded-full bg-blue-200 rotate-12 inline-block transform" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-sans">
                KNOWBASE
              </span>
            </a>

            <p className="text-xs sm:text-sm text-blue-100 dark:text-slate-400 max-w-sm leading-relaxed font-normal">
              Platform Retrieval-Augmented Generation (RAG) untuk pencarian dan pemahaman isi dokumen secara instan, akurat, dan terverifikasi.
            </p>

            <div className="pt-1 flex items-center gap-2 text-xs text-blue-100 dark:text-slate-300 bg-blue-700/70 dark:bg-slate-900 border border-blue-400/50 dark:border-slate-800 px-3 py-1.5 rounded-lg w-fit">
              <ShieldCheck className="w-4 h-4 text-white shrink-0" />
              <span>Workspace Terenkripsi & Terisolasi</span>
            </div>
          </div>

          {/* Kolom 2: Navigasi Cepat */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Navigasi Cepat
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-blue-100">
              {siteData.navLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="hover:text-white transition-colors inline-block py-0.5"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom 3: Keunggulan RAG */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Keunggulan RAG
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-blue-100">
              <li className="hover:text-white transition-colors">Anti-Halusinasi AI</li>
              <li className="hover:text-white transition-colors">Sitasi Halaman Asli</li>
              <li className="hover:text-white transition-colors">Multi-Format (PDF, DOCX)</li>
              <li className="hover:text-white transition-colors">Privasi Data Dokumen</li>
            </ul>
          </div>

          {/* Kolom 4: Hubungi Kami */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Hubungi Kami
            </h4>
            <div className="space-y-2.5 text-xs sm:text-sm text-blue-100">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                <a href="mailto:halo@knowbase.id" className="hover:text-white transition-colors">
                  halo@knowbase.id
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                <span>Senin - Jumat (09:00 - 18:00)</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Baris Bawah: Copyright & Tautan Kebijakan */}
      <div className="border-t border-blue-500 dark:border-slate-800 bg-blue-700/60 dark:bg-slate-900/80">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-blue-100 dark:text-slate-400 text-center sm:text-left">
          <p>© 2026 KnowBase AI. Seluruh hak cipta dilindungi undang-undang.</p>
          <div className="flex items-center gap-4 text-blue-200 dark:text-slate-400">
            <a href="#rag" className="hover:text-white transition-colors">Tentang RAG</a>
            <span>•</span>
            <a href="#faq" className="hover:text-white transition-colors">Ketentuan Layanan</a>
            <span>•</span>
            <a href="#faq" className="hover:text-white transition-colors">Kebijakan Privasi</a>
          </div>
        </div>
      </div>

    </footer>
  );
}
