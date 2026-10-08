import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/common/StatCard';
import { UploadDocumentModal } from '../components/common/UploadDocumentModal';
import { CreateProjectModal } from '../components/common/CreateProjectModal';
import {
  FolderKanban,
  FileText,
  Cpu,
  Sparkles,
  Activity,
  UploadCloud,
  ArrowRight,
  HardDrive,
  Eye,
  CheckCircle2,
  Image as ImageIcon,
  Building2,
  Users,
  Plus,
  Layers,
  Database
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  Cell
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    currentOrganization,
    organizations = [],
    users = [],
    accessibleDocuments = [],
    accessibleChunks = [],
    activityLogs = [],
    setSelectedDocForViewer
  } = useApp();

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);

  // Time-series mock chart data for Overview
  const uploadTrends = [
    { month: 'Jan', documents: 28, media: 12 },
    { month: 'Feb', documents: 45, media: 24 },
    { month: 'Mar', documents: 62, media: 38 },
    { month: 'Apr', documents: 85, media: 55 },
    { month: 'Mei', documents: 110, media: 78 },
    { month: 'Jun', documents: 140, media: 105 },
    { month: 'Jul', documents: 195, media: 142 },
    { month: 'Agt', documents: 260, media: 190 },
    { month: 'Sep', documents: 397, media: 285 },
  ];

  // Knowledge chunk & document distribution by Project
  const projectKnowledgeDistribution = (organizations || []).map(org => ({
    name: org.name.length > 18 ? `${org.name.slice(0, 16)}...` : org.name,
    fullName: org.name,
    chunks: org.chunksCount || 0,
    docs: org.documentsCount || 0
  }));

  // Calculations for Platform Overview (Strictly for active project)
  const totalProjects = (organizations || []).length;
  const totalDocsCount = (accessibleDocuments || []).length;
  const countPhoto = (accessibleDocuments || []).filter(d => 
    (d.repositoryType || '').toLowerCase() === 'photo' || 
    ['png', 'jpg', 'jpeg', 'webp', 'image'].includes((d.fileType || '').toLowerCase())
  ).length;
  const countDocsOnly = totalDocsCount - countPhoto;
  const totalChunksCount = (accessibleChunks || []).length || (currentOrganization?.chunksCount || 0);
  const totalStorageMb = Math.round((accessibleDocuments || []).reduce((acc, d) => acc + (d.fileSizeKb || 0), 0) / 1024 * 10) / 10 || Math.round(totalDocsCount * 4.2);

  // Filter logs for this view
  const displayLogs = (activityLogs || [])
    .filter(l => !currentOrganization || !l.organizationId || l.organizationId === currentOrganization.id)
    .slice(0, 6);

  // Filter documents for this view (Strictly active project's documents)
  const displayDocs = (accessibleDocuments || []).slice(0, 6);

  const PROJECT_PALETTE = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* 1. Page Header with Project Context & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Dashboard Overview
            </h1>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Sistem Aktif
            </span>
            {currentOrganization && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-blue-500" />
                <span>Proyek: <strong className="font-semibold">{currentOrganization.name}</strong></span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitoring repositori dokumen, aset media, dan basis pengetahuan per Project.
          </p>
        </div>

        {/* Action Buttons — hanya untuk admin (halaman user tanpa tombol ini) */}
        {(currentUser?.role === 'admin') && (
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setCreateProjectModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Project Baru</span>
            </button>

            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98] transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-white group-hover:-translate-y-0.5 transition-transform duration-200" />
              <span>Unggah Multi-Berkas</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Key Statistics Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
        <StatCard
          label="Total Project"
          value={totalProjects}
          change="Ruang kerja aktif"
          icon={FolderKanban}
          variant="indigo"
        />
        <StatCard
          label="Dokumen & Berkas"
          value={countDocsOnly > 0 ? countDocsOnly : totalDocsCount}
          change="PDF, Word, Excel"
          icon={FileText}
          variant="emerald"
        />
        <StatCard
          label="Foto & Media"
          value={countPhoto}
          change="Gambar tersimpan"
          icon={ImageIcon}
          variant="purple"
        />
        <StatCard
          label="Basis Pengetahuan"
          value={totalChunksCount}
          change="Knowledge chunks"
          icon={Cpu}
          variant="amber"
        />
        <StatCard
          label="Storage Dokumen"
          value={`${totalStorageMb} MB`}
          change="Tersimpan aman"
          icon={HardDrive}
          variant="rose"
        />
      </div>

      {/* 3. Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Berkas Ingestion Trend to Edge CDN */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Pertumbuhan Ingesti Berkas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Akumulasi dokumen dan foto tersimpan per bulan
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                Dokumen
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-600 inline-block" />
                Media / Foto
              </span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={uploadTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="docGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="mediaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.25} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                />
                <Area type="monotone" dataKey="documents" name="Dokumen" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#docGrad)" />
                <Area type="monotone" dataKey="media" name="Foto & Media" stroke="#9333ea" strokeWidth={2} fillOpacity={1} fill="url(#mediaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Documents & Knowledge per Project */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Distribusi Berkas per Project
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Jumlah repositori berkas terunggah per project workspace
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
              {totalProjects} Project Aktif
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectKnowledgeDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.25} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                />
                <Bar dataKey="docs" name="Jumlah Berkas" radius={[6, 6, 0, 0]}>
                  {projectKnowledgeDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PROJECT_PALETTE[index % PROJECT_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid: Projects Directory & Recent Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Projects Quick Directory List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Daftar Project Terdaftar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ruang kerja manajemen dokumen & knowledge base Anda
              </p>
            </div>
            <Link 
              to="/app/projects" 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors"
            >
              Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {organizations.length > 0 ? (
              organizations.map((org, idx) => (
                <div 
                  key={org.id} 
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0"
                      style={{ backgroundColor: PROJECT_PALETTE[idx % PROJECT_PALETTE.length] }}
                    >
                      {(org.code || 'PRJ').slice(0, 3)}
                    </div>
                    <div className="min-w-0">
                      <Link 
                        to={`/app/projects/${org.id}`} 
                        className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate block transition-colors"
                      >
                        {org.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        <span>Kode: <strong className="text-slate-700 dark:text-slate-300 font-mono">{org.code}</strong></span>
                        <span>·</span>
                        <span className="text-slate-400">{org.type || 'Project'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs shrink-0">
                    <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 tabular-nums">
                      <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200/80 dark:border-slate-700">
                        <FileText className="w-3 h-3 text-slate-400" />
                        {org.documentsCount || 0} Dokumen
                      </span>
                      <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200/80 dark:border-slate-700">
                        <Cpu className="w-3 h-3 text-slate-400" />
                        {org.chunksCount || 0} Chunks
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200/70 dark:border-emerald-800/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Aktif
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
                <FolderKanban className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Belum ada project yang dibuat. Buat project pertama Anda untuk mengunggah dokumen.
                </p>
                <button
                  type="button"
                  onClick={() => setCreateProjectModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  Buat Project Sekarang
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Uploaded Documents & Media */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Berkas & Media Terbaru
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Berkas & media terpusat, tersimpan aman
                </p>
              </div>
              <Link 
                to="/app/documents" 
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
              >
                Semua
              </Link>
            </div>

            <div className="space-y-2.5">
              {displayDocs.length > 0 ? (
                displayDocs.map((doc) => {
                  const isPhoto = doc.repositoryType === 'photo' || 
                    ['png', 'jpg', 'jpeg', 'webp', 'image'].includes((doc.fileType || '').toLowerCase());
                  
                  return (
                    <div 
                      key={doc.id} 
                      onClick={() => setSelectedDocForViewer(doc)}
                      className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 hover:border-blue-200 dark:hover:border-blue-800 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isPhoto ? (
                          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                            {doc.fileUrl && !doc.fileUrl.startsWith('db://') ? (
                              <img src={doc.fileUrl} alt={doc.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-emerald-600">
                                <ImageIcon className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[9px] shrink-0 border ${
                            doc.fileType === 'PDF'
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 border-rose-200 dark:border-rose-900/50'
                              : doc.fileType === 'DOCX' || doc.fileType === 'DOC'
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 border-blue-200 dark:border-blue-900/50'
                                : doc.fileType === 'XLSX' || doc.fileType === 'XLS'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border-emerald-200 dark:border-emerald-900/50'
                                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 border-indigo-200 dark:border-indigo-900/50'
                          }`}>
                            {doc.fileType || 'FILE'}
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {doc.title}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {doc.category} · {doc.year}
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0 font-semibold">
                        Tersimpan
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  Belum ada dokumen yang diunggah.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <Link 
              to="/app/documents" 
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 transition-colors"
            >
              Buka Repositori Dokumen <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateProjectModal 
        isOpen={createProjectModalOpen} 
        onClose={() => setCreateProjectModalOpen(false)} 
      />
      <UploadDocumentModal 
        isOpen={uploadModalOpen} 
        onClose={() => setUploadModalOpen(false)} 
      />
    </div>
  );
};
