import React from 'react';
import { useApp } from '../../context/AppContext';
import { BottomSheet } from './BottomSheet';
import { 
  FileText, 
  Download, 
  Calendar, 
  User, 
  Layers, 
  Tag, 
  ShieldCheck, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

export const DocumentViewerModal: React.FC = () => {
  const { selectedDocForViewer, setSelectedDocForViewer } = useApp();

  if (!selectedDocForViewer) return null;

  const doc = selectedDocForViewer;

  return (
    <BottomSheet
      isOpen={!!selectedDocForViewer}
      onClose={() => setSelectedDocForViewer(null)}
      title={doc.title}
      subtitle={`${doc.organizationName} · ${doc.category} · Versi ${doc.version}`}
    >
      <div className="space-y-6">
        {/* Document Metadata Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Format & Ukuran</span>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{doc.fileType} · {Math.round(doc.fileSizeKb / 1024 * 10) / 10} MB</p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tahun Terbit</span>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 tabular-nums">{doc.year}</p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Divisi Pemilik</span>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{doc.department}</p>
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">RAG Status</span>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Indexed ({doc.chunksCount} chunks)
            </p>
          </div>
        </div>

        {/* Executive Summary */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Ringkasan Eksekutif & Abstrak
          </h4>
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {doc.summary}
          </div>
        </div>

        {/* Tags */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Kata Kunci Pengetahuan
          </h4>
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            {doc.tags.map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[11px] border border-slate-200/50 dark:border-slate-700">
                <Tag className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500" />
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* RAG AI Indexing Status */}
        <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-blue-400/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">Status Indeks AI (RAG)</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Dokumen telah diproses otomatis oleh RAG engine dan siap untuk tanya jawab.</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Terindeks Otomatis
          </span>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            Diupload oleh {doc.uploadedBy} · {doc.uploadedAt}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                alert(`Simulasi: Mengunduh ${doc.title} (${doc.fileType})`);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh File
            </button>
            <button
              onClick={() => setSelectedDocForViewer(null)}
              className="px-4 py-1.5 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-xs font-medium hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};
