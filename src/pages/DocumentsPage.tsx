import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { UploadDocumentModal } from '../components/common/UploadDocumentModal';
import { DocumentCategory } from '../types';
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
  ShieldCheck,
  LayoutGrid,
  List
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Regular users only use the AI interface and don't manage documents
  if (currentUser?.role === 'user') {
    return <Navigate to="/app" replace />;
  }

  const categories: DocumentCategory[] = [
    'SOP & Prosedur',
    'Laporan Keuangan',
    'Regulasi & Perda',
    'Engineering & Teknis',
    'Kebijakan HR',
    'Perencanaan Strategis'
  ];

  const years = [2026, 2025, 2024];

  const filteredDocs = accessibleDocuments.filter(doc => {
    const matchSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.department || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchYear = selectedYear === 'all' || doc.year.toString() === selectedYear;
    const matchOrg = selectedOrgFilter === 'all' || doc.organizationId === selectedOrgFilter;

    return matchSearch && matchCategory && matchYear && matchOrg;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Repositori Dokumen
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Daftar arsip dokumen resmi, regulasi, dan standar operasional prosedur.
          </p>
        </div>

        {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="group inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md hover:shadow-blue-500/25 active:scale-[0.98] transition-all duration-200 cursor-pointer self-start sm:self-auto shrink-0"
          >
            <UploadCloud className="w-4 h-4 text-white shrink-0 group-hover:-translate-y-0.5 transition-transform duration-200" />
            <span className="tracking-tight font-semibold">Unggah Dokumen Baru</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari judul dokumen, kata kunci isi, atau nama unit divisi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* View Mode Toggle (desktop) */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              title="Tampilan Tabel"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
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
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs cursor-pointer"
            >
              <option value="all">Semua Organisasi</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          )}

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs cursor-pointer"
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
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs cursor-pointer"
          >
            <option value="all">Semua Tahun</option>
            {years.map(y => (
              <option key={y} value={y.toString()}>{y}</option>
            ))}
          </select>

          <span className="ml-auto text-slate-400 dark:text-slate-500 tabular-nums text-xs">
            Menampilkan {filteredDocs.length} dokumen
          </span>
        </div>
      </div>

      {/* Content View: Table or Grid */}
      {viewMode === 'table' ? (
        <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Judul Dokumen</th>
                {currentUser?.role === 'superadmin' && <th className="py-3 px-4">Organisasi</th>}
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Divisi Pemilik</th>
                <th className="py-3 px-4 text-center">Tahun</th>
                <th className="py-3 px-4 text-right">RAG Chunks</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors">
                  {/* Title & file icon */}
                  <td className="py-3.5 px-4 max-w-sm">
                    <div 
                      onClick={() => setSelectedDocForViewer(doc)}
                      className="cursor-pointer group flex items-start gap-3"
                    >
                      <span className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        {doc.fileType}
                      </span>
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                          {doc.title}
                        </span>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                          {doc.summary}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Organization (superadmin only) */}
                  {currentUser?.role === 'superadmin' && (
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">{doc.organizationName}</span>
                    </td>
                  )}

                  {/* Category */}
                  <td className="py-3.5 px-4">
                    <span className="text-slate-600 dark:text-slate-300 block">{doc.category}</span>
                  </td>

                  {/* Department */}
                  <td className="py-3.5 px-4">
                    <span className="text-slate-600 dark:text-slate-300 truncate block max-w-xs">{doc.department}</span>
                  </td>

                  {/* Year */}
                  <td className="py-3.5 px-4 text-center tabular-nums text-slate-600 dark:text-slate-300">
                    {doc.year}
                  </td>

                  {/* Chunks */}
                  <td className="py-3.5 px-4 text-right tabular-nums">
                    <span className="font-semibold text-slate-900 dark:text-white">{doc.chunksCount}</span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block">Indexed</span>
                  </td>

                  {/* Action buttons */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setSelectedDocForViewer(doc)}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                        title="Lihat Detail & Ekstrak Chunks"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
                        <button
                          onClick={() => {
                            if (confirm(`Hapus dokumen "${doc.title}" dari repositori KMS?`)) {
                              deleteDocument(doc.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                          title="Hapus Dokumen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Grid View & Mobile Card View */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 ${viewMode === 'table' ? 'sm:hidden' : ''}`}>
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center font-bold text-[11px] shrink-0">
                  {doc.fileType}
                </span>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/60 px-2 py-0.5 rounded">
                  {doc.chunksCount} Chunks
                </span>
              </div>

              <h3 
                onClick={() => setSelectedDocForViewer(doc)}
                className="text-xs font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer line-clamp-2 leading-snug"
              >
                {doc.title}
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                {doc.summary}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                <span>{doc.category}</span>
                <span className="tabular-nums">{doc.year}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[160px]">
                  {doc.organizationName}
                </span>
                <button
                  onClick={() => setSelectedDocForViewer(doc)}
                  className="px-2.5 py-1 text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-100 dark:border-blue-900/60 rounded-md transition-colors cursor-pointer"
                >
                  Detail & Chunks
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDocs.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-10 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tidak ada dokumen yang sesuai</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Belum ada dokumen yang terdaftar atau tidak cocok dengan filter pencarian.
            </p>
          </div>
          {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                className="group inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md hover:shadow-blue-500/25 active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-white shrink-0 group-hover:-translate-y-0.5 transition-transform duration-200" />
                <span className="tracking-tight">Unggah Dokumen Sekarang</span>
              </button>
            </div>
          )}
        </div>
      )}

      <UploadDocumentModal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} />
    </div>
  );
};
