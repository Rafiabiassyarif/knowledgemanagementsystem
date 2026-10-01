import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { UploadDocumentModal } from '../components/common/UploadDocumentModal';
import { DocumentCategory } from '../types';
import { downloadProtectedFile } from '../services/api';
import { 
  FileText, 
  Search, 
  Filter, 
  UploadCloud, 
  Eye, 
  Trash2, 
  Tag, 
  Download, 
  Calendar,
  Building2,
  FolderKanban,
  LayoutGrid,
  List,
  Sparkles,
  Zap,
  Image as ImageIcon,
  CheckCircle2,
  HardDrive,
  FileCheck,
  ExternalLink
} from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const { 
    accessibleDocuments, 
    currentUser, 
    currentOrganization, 
    setSelectedDocForViewer, 
    deleteDocument,
    organizations 
  } = useApp();

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedRepoTab, setSelectedRepoTab] = useState<'all' | 'document' | 'photo' | 'knowledge'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Stats calculation
  const countDoc = accessibleDocuments.filter(d => (d.repositoryType || 'document') === 'document').length;
  const countPhoto = accessibleDocuments.filter(d => 
    (d.repositoryType || '').toLowerCase() === 'photo' || 
    ['png', 'jpg', 'jpeg', 'webp', 'image'].includes((d.fileType || '').toLowerCase())
  ).length;
  const countKnowledge = accessibleDocuments.filter(d => d.repositoryType === 'knowledge').length;
  const totalChunks = accessibleDocuments.reduce((acc, d) => acc + (d.chunksCount || 0), 0);
  const totalStorageMb = Math.round(accessibleDocuments.reduce((acc, d) => acc + (d.fileSizeKb || 0), 0) / 1024 * 10) / 10;

  const categories: DocumentCategory[] = [
    'SOP & Prosedur',
    'Laporan Keuangan',
    'Regulasi & Perda',
    'Engineering & Teknis',
    'Kebijakan HR',
    'Perencanaan Strategis'
  ];

  const years = useMemo(() => {
    const fromDocs = accessibleDocuments.map(d => d.year).filter(Boolean);
    const currentYear = new Date().getFullYear();
    const defaults = [currentYear, currentYear - 1, currentYear - 2];
    const unique = Array.from(new Set([...fromDocs, ...defaults]));
    return unique.sort((a, b) => b - a);
  }, [accessibleDocuments]);

  const filteredDocs = accessibleDocuments.filter(doc => {
    const matchSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.department || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchYear = selectedYear === 'all' || doc.year.toString() === selectedYear;
    const matchOrg = selectedOrgFilter === 'all' || doc.organizationId === selectedOrgFilter;
    const matchRepo = selectedRepoTab === 'all'
      ? true
      : selectedRepoTab === 'photo'
        ? (doc.repositoryType === 'photo' || ['png', 'jpg', 'jpeg', 'webp', 'image'].includes((doc.fileType || '').toLowerCase()))
        : (doc.repositoryType || 'document') === selectedRepoTab;

    return matchSearch && matchCategory && matchYear && matchOrg && matchRepo;
  });

  const handleDownloadDoc = (doc: any) => {
    const targetUrl = (doc.fileUrl && !doc.fileUrl.startsWith('db://'))
      ? doc.fileUrl
      : `/api/documents/${doc.id}/download`;
    downloadProtectedFile(targetUrl, `${doc.title}.${(doc.fileType || 'PDF').toLowerCase()}`)
      .catch(err => alert(err.message || 'Gagal mengunduh dokumen.'));
  };

  const isPhotoFile = (doc: any) => {
    return doc.repositoryType === 'photo' || 
      ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'image'].includes((doc.fileType || '').toLowerCase());
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Active Project Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Repositori Dokumen & Pengetahuan
            </h1>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              CDN Powered
            </span>
            {currentOrganization && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium flex items-center gap-1.5">
                <FolderKanban className="w-3 h-3 text-blue-500" />
                <span>Proyek: <strong className="font-semibold">{currentOrganization.name}</strong></span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pusat penyimpanan berkas fisik di Kroombox Edge CDN dan basis pengetahuan AI RAG terisolasi per proyek.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="group inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-white shrink-0 group-hover:-translate-y-0.5 transition-transform duration-200" />
            <span className="tracking-tight font-semibold">Unggah Multi-Berkas</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Berkas */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Total Berkas Fisik</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                {accessibleDocuments.length}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">({totalStorageMb} MB)</span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">
              Tersimpan di Edge CDN
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Dokumen & PDF */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Dokumen & Surat</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                {countDoc}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">berkas</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
              PDF, DOCX, XLSX
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Foto & Media */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Foto & Media</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                {countPhoto}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">gambar</span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5 truncate">
              Preview Langsung
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Knowledge Base RAG */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Knowledge AI RAG</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                {countKnowledge}
              </span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold font-mono">({totalChunks} Chunks)</span>
            </div>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block mt-0.5 truncate font-medium">
              Terindeks Vector AI
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Repositori Tabs (Dokumen vs Foto vs Knowledge vs Semua) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSelectedRepoTab('all')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            selectedRepoTab === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>Semua Berkas</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${selectedRepoTab === 'all' ? 'bg-blue-800/80 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
            {accessibleDocuments.length}
          </span>
        </button>

        <button
          onClick={() => setSelectedRepoTab('document')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            selectedRepoTab === 'document'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Dokumen & Surat</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${selectedRepoTab === 'document' ? 'bg-blue-800/80 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
            {countDoc}
          </span>
        </button>

        <button
          onClick={() => setSelectedRepoTab('photo')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            selectedRepoTab === 'photo'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Foto & Media</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${selectedRepoTab === 'photo' ? 'bg-emerald-800/80 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
            {countPhoto}
          </span>
        </button>

        <button
          onClick={() => setSelectedRepoTab('knowledge')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            selectedRepoTab === 'knowledge'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Knowledge Base</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${selectedRepoTab === 'knowledge' ? 'bg-indigo-800/80 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
            {countKnowledge}
          </span>
        </button>
      </div>

      {/* 4. Filter and Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari judul berkas, kata kunci isi, atau tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              title="Tampilan Tabel"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {/* Org Filter for Superadmin */}
          {currentUser?.role === 'superadmin' && (
            <select
              value={selectedOrgFilter}
              onChange={(e) => setSelectedOrgFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs cursor-pointer"
            >
              <option value="all">Semua Proyek</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          )}

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs cursor-pointer"
          >
            <option value="all">Semua Kategori</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs cursor-pointer"
          >
            <option value="all">Semua Tahun</option>
            {years.map(y => (
              <option key={y} value={y.toString()}>{y}</option>
            ))}
          </select>

          <span className="ml-auto text-slate-400 dark:text-slate-500 tabular-nums text-xs">
            Menampilkan <strong className="text-slate-700 dark:text-slate-300">{filteredDocs.length}</strong> dokumen
          </span>
        </div>
      </div>

      {/* 5. Content View: Table */}
      {viewMode === 'table' ? (
        <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Judul Dokumen & Berkas</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Proyek / Sumber</th>
                <th className="py-3 px-4 text-center">Tahun</th>
                <th className="py-3 px-4 text-right">Ukuran & CDN</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
              {filteredDocs.map((doc) => {
                const isPhoto = isPhotoFile(doc);
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                    {/* Title, thumbnail & preview */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <div 
                        onClick={() => setSelectedDocForViewer(doc)}
                        className="cursor-pointer group flex items-start gap-3"
                      >
                        {isPhoto ? (
                          <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 group-hover:scale-105 transition-transform">
                            {doc.fileUrl && !doc.fileUrl.startsWith('db://') ? (
                              <img src={doc.fileUrl} alt={doc.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 border group-hover:scale-105 transition-transform ${
                            doc.fileType === 'PDF'
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 border-rose-200 dark:border-rose-900/60'
                              : doc.fileType === 'DOCX' || doc.fileType === 'DOC'
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 border-blue-200 dark:border-blue-900/60'
                                : doc.fileType === 'XLSX' || doc.fileType === 'XLS'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border-emerald-200 dark:border-emerald-900/60'
                                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 border-indigo-200 dark:border-indigo-900/60'
                          }`}>
                            {doc.fileType || 'FILE'}
                          </span>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                              {doc.title}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                              doc.repositoryType === 'knowledge' 
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' 
                                : isPhoto
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            }`}>
                              {doc.repositoryType === 'knowledge' ? 'Knowledge' : isPhoto ? 'Foto / Media' : 'Dokumen'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                            {doc.summary}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="text-slate-700 dark:text-slate-200 font-medium block">
                        {doc.category}
                      </span>
                    </td>

                    {/* Project / Source */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 truncate max-w-xs">
                        <FolderKanban className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">{doc.organizationName || 'Proyek Utama'}</span>
                      </div>
                    </td>

                    {/* Year */}
                    <td className="py-3.5 px-4 text-center tabular-nums text-slate-600 dark:text-slate-300">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium">
                        {doc.year}
                      </span>
                    </td>

                    {/* File Size & Status */}
                    <td className="py-3.5 px-4 text-right tabular-nums">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {doc.fileSizeKb > 1024 
                          ? `${(doc.fileSizeKb / 1024).toFixed(1)} MB` 
                          : `${doc.fileSizeKb} KB`}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1 font-mono font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Edge CDN
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedDocForViewer(doc)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Lihat Detail & Pratinjau Dokumen"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadDoc(doc)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Unduh Berkas dari CDN"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin' || doc.uploadedBy === currentUser?.name) && (
                          <button
                            onClick={() => {
                              if (confirm(`Hapus berkas "${doc.title}" dari repositori proyek?`)) {
                                deleteDocument(doc.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Berkas"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* 6. Grid View & Mobile Card View */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 ${viewMode === 'table' ? 'sm:hidden' : ''}`}>
        {filteredDocs.map((doc) => {
          const isPhoto = isPhotoFile(doc);
          return (
            <div
              key={doc.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col justify-between group"
            >
              {/* Photo Cover Preview if photo */}
              {isPhoto && doc.fileUrl && !doc.fileUrl.startsWith('db://') && (
                <div 
                  onClick={() => setSelectedDocForViewer(doc)}
                  className="w-full h-36 bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer relative"
                >
                  <img src={doc.fileUrl} alt={doc.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-2 right-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-sm">
                      Foto CDN
                    </span>
                  </div>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center font-bold text-[11px] shrink-0">
                      {doc.fileType}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      doc.repositoryType === 'knowledge' 
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' 
                        : isPhoto
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    }`}>
                      {doc.repositoryType === 'knowledge' ? 'Knowledge' : isPhoto ? 'Foto / Media' : 'Dokumen'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/60 px-2 py-0.5 rounded-md font-medium">
                    Edge CDN
                  </span>
                </div>

                <h3 
                  onClick={() => setSelectedDocForViewer(doc)}
                  className="text-xs font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer line-clamp-2 leading-snug mt-1"
                >
                  {doc.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                  {doc.summary}
                </p>
              </div>

              <div className="px-4 pb-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 mt-auto">
                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                  <span className="font-medium text-slate-600 dark:text-slate-300">{doc.category}</span>
                  <span className="tabular-nums font-medium">{doc.year}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[130px] flex items-center gap-1">
                    <FolderKanban className="w-3 h-3 text-blue-500 shrink-0" />
                    <span className="truncate">{doc.organizationName}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDownloadDoc(doc)}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Unduh Berkas CDN"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedDocForViewer(doc)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-900/60 rounded-lg transition-colors cursor-pointer"
                    >
                      Detail
                    </button>
                    {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin' || doc.uploadedBy === currentUser?.name) && (
                      <button
                        onClick={() => {
                          if (confirm(`Hapus berkas "${doc.title}" dari repositori proyek?`)) {
                            deleteDocument(doc.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Dokumen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 7. Empty State */}
      {filteredDocs.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Tidak ada berkas yang sesuai</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Belum ada berkas yang diunggah ke proyek ini atau tidak ada berkas yang cocok dengan filter pencarian Anda.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/25 active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-white shrink-0 group-hover:-translate-y-0.5 transition-transform duration-200" />
              <span className="tracking-tight font-semibold">Unggah Multi-Berkas Sekarang</span>
            </button>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      <UploadDocumentModal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} />
    </div>
  );
};
