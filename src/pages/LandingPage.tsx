import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  FileText, 
  Lock, 
  Bot,
  ExternalLink,
  ChevronRight,
  Database,
  Layers,
  Sun,
  Moon,
  Send,
  Search,
  Droplet,
  Landmark,
  Train,
  Apple
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { currentUser, organizations, theme, toggleTheme } = useApp();

  const featuredOrgs = organizations.slice(0, 4);

  // Sector metadata helpers for directory cards
  const getSectorMeta = (type: string) => {
    switch (type.toLowerCase()) {
      case 'air minum':
        return {
          icon: Droplet,
          pill: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
          border: 'hover:border-blue-300'
        };
      case 'perbankan & keuangan':
      case 'keuangan':
        return {
          icon: Landmark,
          pill: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
          border: 'hover:border-emerald-300'
        };
      case 'transportasi':
        return {
          icon: Train,
          pill: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
          border: 'hover:border-indigo-300'
        };
      default:
        return {
          icon: Building2,
          pill: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
          border: 'hover:border-amber-300'
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white transition-colors duration-200 relative overflow-x-hidden">
      {/* Ambient Lighting & Mesh Gradients for Light and Dark Modes */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[700px] pointer-events-none -z-10 overflow-hidden">
        {/* Soft Sky / Cyan Spotlight */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-blue-400/20 via-indigo-300/15 to-transparent dark:from-blue-600/15 dark:via-indigo-600/10 rounded-full blur-3xl opacity-80" />
        {/* Warm ambient secondary aura */}
        <div className="absolute top-24 -left-20 w-[450px] h-[350px] bg-sky-200/40 dark:bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute top-36 -right-20 w-[450px] h-[350px] bg-indigo-200/40 dark:bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Subtle Architectural Dot Matrix Background */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_60%,transparent_100%)] pointer-events-none -z-10 opacity-70"
      />

      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 transition-colors shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Lockup */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-blue-500/25 ring-2 ring-blue-500/10 group-hover:scale-105 transition-transform">
              KMS
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight leading-none block">
                KMS BUMD<span className="text-blue-600">.</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Portal Pengetahuan Daerah
              </span>
            </div>
          </Link>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#preview" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Simulasi AI
            </a>
            <a href="#fitur" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Fitur Utama
            </a>
            <a href="#organisasi" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Direktori BUMD
            </a>
            <a href="#keamanan" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Keamanan
            </a>
          </nav>

          {/* Action CTAs & Theme Toggle */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle Pill Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer mr-1"
              title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              aria-label="Ubah Tema"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-200" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 animate-in spin-in-180 duration-200" />
              )}
            </button>

            <Link
              to="/login"
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-xl transition-all"
            >
              Masuk
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold transition-all shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Daftar Akun</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="pt-14 sm:pt-20 pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center relative">
        {/* Subtle Illuminated Pill Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/90 dark:bg-blue-950/60 border border-blue-200/90 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-6 shadow-sm shadow-blue-500/5 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
          </span>
          <span>Platform Tata Kelola Pengetahuan BUMD Berbasis AI RAG</span>
          <ArrowRight className="w-3 h-3 text-blue-500" />
        </div>

        {/* Main Headline with Gradient Typography */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12] max-w-4xl mx-auto">
          Pusat Pengetahuan &amp;{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600">
            Asisten AI Cerdas
          </span>{' '}
          untuk Kemajuan BUMD.
        </h1>

        {/* Subtitle */}
        <p className="mt-5 sm:mt-6 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
          Akses cepat pedoman kerja resmi, SOP operasional, serta tanya jawab cerdas dengan sitasi dokumen terverifikasi untuk keputusan yang akurat dan transparan.
        </p>

        {/* Hero CTAs */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            to="/login"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs sm:text-sm font-bold transition-all shadow-xl shadow-blue-600/25 hover:shadow-2xl hover:shadow-blue-600/35 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          >
            <span>Masuk ke Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/register"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold border border-slate-200/90 dark:border-slate-800 shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>Daftar Pengguna Baru</span>
          </Link>
        </div>

        {/* Micro Guarantees with Rich Colors */}
        <div className="mt-12 pt-8 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-600 dark:text-slate-400 font-medium">
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            Isolasi Data Multi-Tenant Aman
          </span>
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            Sitasi Sumber Valid &amp; Terverifikasi
          </span>
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            Kepatuhan Standar SPBE
          </span>
        </div>
      </section>

      {/* 3. PRODUCT PREVIEW: REAL KMS UI MOCKUP */}
      <section id="preview" className="py-6 sm:py-10 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="relative group">
          {/* Ambient Backlight Aura for Depth */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500/25 via-indigo-500/20 to-cyan-500/25 rounded-3xl sm:rounded-[36px] blur-2xl opacity-70 dark:opacity-40 group-hover:opacity-100 transition duration-700 -z-10" />

          {/* Main Mockup Frame */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-blue-900/10 dark:shadow-black/70 overflow-hidden ring-1 ring-slate-900/5">
            {/* macOS Style Mock Window Top Bar */}
            <div className="bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200/80 dark:border-slate-700/80 px-4 py-3 flex items-center justify-between">
              {/* Traffic light colored window buttons */}
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e] inline-block shadow-2xs" />
                <span className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#d89e24] inline-block shadow-2xs" />
                <span className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29] inline-block shadow-2xs" />
                
                {/* Simulated URL pill */}
                <div className="hidden sm:flex items-center gap-1.5 ml-3 px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 text-[11px] font-mono text-slate-500 dark:text-slate-400 shadow-2xs">
                  <Lock className="w-3 h-3 text-emerald-500" />
                  <span>kms-bumd.id/app/chat</span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  RAG Assistant Aktif
                </span>
              </div>
            </div>

            {/* Mockup Chat Conversation Area */}
            <div className="p-4 sm:p-7 space-y-5 bg-gradient-to-b from-slate-50/40 to-white/80 dark:from-slate-950/40 dark:to-slate-900/60">
              {/* User Message */}
              <div className="flex items-start justify-end gap-3">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-xs p-4 max-w-lg text-xs sm:text-sm leading-relaxed shadow-md shadow-blue-500/20">
                  Bagaimana prosedur penanganan kebocoran pipa transmisi air bersih utama menurut SOP tanggap darurat organisasi?
                </div>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  US
                </div>
              </div>

              {/* Assistant Response Card */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md shadow-blue-500/30">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl rounded-tl-xs p-5 max-w-2xl text-xs sm:text-sm space-y-3 text-slate-800 dark:text-slate-200 shadow-md shadow-slate-200/60 dark:shadow-none">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-700/80">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <p className="font-bold text-slate-900 dark:text-white">
                      Berdasarkan SOP Penanganan Darurat Infrastruktur PAM Jaya (PAM-SOP-2024-03, Bab 4):
                    </p>
                  </div>
                  
                  <ol className="list-decimal pl-4 space-y-2 text-slate-700 dark:text-slate-300 leading-relaxed">
                    <li>
                      <strong>Isolasi Valve Utama:</strong> Petugas teknis wajib menutup katup sectional terdekat dalam kurun waktu maksimal 20 menit pasca deteksi sensor telemetri.
                    </li>
                    <li>
                      <strong>Penerbitan SPK Darurat:</strong> Dispatcher menerbitkan Surat Perintah Kerja Darurat kepada regu reaksi cepat area terkait secara otomatis.
                    </li>
                    <li>
                      <strong>Koordinasi Pasokan Pengganti:</strong> Mengaktifkan mobil tangki bantuan darurat untuk fasilitas vital dan rumah sakit di wilayah terdampak.
                    </li>
                  </ol>

                  {/* High Quality Citation Box */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs block truncate">
                          SOP-Penanganan-Kebocoran-PAM-Jaya.pdf
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Halaman 12 · Bab 4 · Tanggap Darurat Jaringan
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-emerald-200/80 dark:border-emerald-800/50 self-start sm:self-auto shrink-0">
                      Kesesuaian 96%
                    </span>
                  </div>
                </div>
              </div>

              {/* Realistic Mock Chat Input Field */}
              <div className="pt-2">
                <div className="bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-2xl p-2.5 sm:p-3 flex items-center gap-3 shadow-xs">
                  <Search className="w-4 h-4 text-slate-400 ml-1.5 shrink-0" />
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex-1 truncate">
                    Tanyakan SOP, regulasi, dokumen teknis, atau pedoman operasional BUMD Anda...
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer hover:bg-blue-700 transition-colors">
                    <Send className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE FEATURES WITH ELEVATED CARDS */}
      <section id="fitur" className="py-16 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 shadow-2xs">
            KAPABILITAS UTAMA
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Dirancang Khusus untuk Operasional BUMD
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2.5 max-w-xl mx-auto leading-relaxed">
            Sistem terintegrasi yang menyederhanakan temu balik informasi internal, standardisasi SOP, dan koordinasi antar anggota tim.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white dark:bg-slate-900 p-7 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-300/90 transition-all duration-300 hover:-translate-y-1 relative group overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 mb-5 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase block mb-1">
              Pencarian Semantik
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
              Tanya AI Berbasis Dokumen Resmi
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
              Dapatkan jawaban instan atas pertanyaan operasional dengan sitasi rujukan dokumen yang transparan dan dapat diaudit secara akurat.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white dark:bg-slate-900 p-7 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-300/90 transition-all duration-300 hover:-translate-y-1 relative group overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 mb-5 group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase block mb-1">
              Multi-Tenancy
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
              Direktori Multi-Tenant BUMD
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
              Mendukung berbagai sektor BUMD (Air Minum, Perbankan, Pangan, Transportasi) dengan lingkungan data terisolasi dan mandiri.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-slate-900 p-7 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-300/90 transition-all duration-300 hover:-translate-y-1 relative group overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 mb-5 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase block mb-1">
              Tata Kelola RBAC
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
              Aman &amp; Terkendali Sesuai Peran
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
              Pengaturan hak akses bertingkat untuk Superadmin platform, Admin BUMD, dan Pengguna reguler demi menjamin tata kelola yang tertib.
            </p>
          </div>
        </div>
      </section>

      {/* 5. DIRECTORY SHOWCASE */}
      <section id="organisasi" className="py-16 bg-white dark:bg-slate-900/60 border-y border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 shadow-2xs">
                EKOSISTEM BUMD
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Entitas BUMD yang Terhubung
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Badan usaha milik daerah yang telah mengintegrasikan pedoman operasional dalam sistem.
              </p>
            </div>
            <Link
              to="/login"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1.5 shrink-0 group"
            >
              <span>Gabung Organisasi Sekarang</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredOrgs.map((org) => {
              const meta = getSectorMeta(org.type);
              const SectorIcon = meta.icon;
              return (
                <div 
                  key={org.id}
                  className={`p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/40 shadow-xs hover:shadow-lg hover:shadow-slate-200/60 dark:hover:shadow-black/40 ${meta.border} transition-all duration-200 flex flex-col justify-between group`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">
                        {org.code}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${meta.pill}`}>
                        <SectorIcon className="w-3 h-3" />
                        <span>{org.type}</span>
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {org.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
                      <span>{org.city}</span>
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-medium">{org.usersCount} Anggota</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Terdaftar
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. SECURITY & GOVERNANCE HIGHLIGHT */}
      <section id="keamanan" className="py-16 sm:py-20 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl shadow-blue-950/20 border border-slate-800">
          {/* Decorative ambient orb */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Kepatuhan Standar Pemerintahan
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Keamanan Data &amp; Kedaulatan Informasi Daerah
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
                Setiap data dan pengetahuan organisasi disimpan secara terisolasi. Asisten AI beroperasi hanya pada basis data resmi instansi masing-masing tanpa kebocoran silang.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              <Link
                to="/login"
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold text-center transition-all shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95"
              >
                Masuk ke Akun
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-bold text-center border border-slate-700 transition-all hover:scale-105 active:scale-95"
              >
                Daftar Pengguna
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800 py-12 px-4 sm:px-6 transition-colors">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              KMS
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-200 block text-xs">
                Knowledge Management System BUMD
              </span>
              <span className="text-[10px] text-slate-400">
                Sistem Pengelolaan Pengetahuan Terpadu Daerah
              </span>
            </div>
          </div>

          <p className="text-center sm:text-right text-[11px] text-slate-400 dark:text-slate-500">
            Platform Terpadu Tata Kelola Pengetahuan Badan Usaha Milik Daerah · 2026
          </p>
        </div>
      </footer>
    </div>
  );
};
