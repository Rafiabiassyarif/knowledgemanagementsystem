import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Cpu, 
  Search, 
  Filter, 
  FileText, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles,
  Layers,
  CheckCircle2,
  Database
} from 'lucide-react';

export const KnowledgePage: React.FC = () => {
  const { 
    accessibleChunks, 
    currentOrganization, 
    currentUser, 
    setSelectedChunkForInspector,
    setSelectedDocForViewer,
    documents
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocFilter, setSelectedDocFilter] = useState('all');

  const filteredChunks = accessibleChunks.filter(chunk => {
    const matchQuery = chunk.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chunk.sectionTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chunk.documentTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchDoc = selectedDocFilter === 'all' || chunk.documentId === selectedDocFilter;
    return matchQuery && matchDoc;
  });

  // Unique documents for filter dropdown
  const uniqueDocs = Array.from(new Set(accessibleChunks.map(c => c.documentId)))
    .map(docId => documents.find(d => d.id === docId))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Knowledge Chunks
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Partisi dokumen dan representasi teks yang siap digunakan untuk penelusuran AI.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 text-xs font-semibold">
            <Database className="w-3.5 h-3.5" />
            <span>Vector Index: Healthy</span>
          </span>
        </div>
      </div>

      {/* RAG Mechanics Infobar */}
      <div className="bg-slate-900 dark:bg-slate-900/90 text-white rounded-xl p-4 sm:p-5 shadow-sm space-y-3 border border-transparent dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs sm:text-sm font-semibold text-white">Bagaimana KMS Memproses Knowledge?</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Embedding: text-embedding-3</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          Setiap berkas PDF/Word yang diunggah dipartisi menjadi segmen <strong>512 token</strong> dengan overlap 64 token. Vektor representasi disimpan secara terisolasi per organisasi sehingga kueri AI user hanya dapat memindai knowledge yang sah bagi organisasinya.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pencarian semantik pada seluruh knowledge chunk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedDocFilter}
            onChange={(e) => setSelectedDocFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 max-w-xs truncate cursor-pointer"
          >
            <option value="all">Semua Dokumen Induk</option>
            {uniqueDocs.map(doc => (
              <option key={doc?.id} value={doc?.id}>{doc?.title}</option>
            ))}
          </select>
          <span className="text-xs text-slate-400 tabular-nums shrink-0">
            {filteredChunks.length} Chunks
          </span>
        </div>
      </div>

      {/* Chunks Explorer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredChunks.map((chunk) => (
          <div
            key={chunk.id}
            onClick={() => setSelectedChunkForInspector(chunk)}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs p-4 cursor-pointer transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800/60">
                  Chunk #{chunk.chunkIndex}
                </span>
                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 tabular-nums">
                  {chunk.tokenCount} tokens
                </span>
              </div>

              {/* Section title */}
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                {chunk.sectionTitle}
              </h3>

              {/* Excerpt */}
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-3 leading-relaxed bg-slate-50/60 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/60 font-mono text-[11px]">
                {chunk.content}
              </p>
            </div>

            {/* Footer */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <span className="truncate max-w-[220px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{chunk.documentTitle}</span>
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-medium shrink-0 group-hover:translate-x-0.5 transition-transform">
                Inspeksi Vektor →
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredChunks.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-8 text-center">
          <Cpu className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Tidak ada chunk yang cocok</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Coba gunakan kata kunci yang lebih umum untuk memindai knowledge vector.
          </p>
        </div>
      )}
    </div>
  );
};
