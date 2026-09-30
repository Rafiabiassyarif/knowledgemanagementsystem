import React from 'react';
import { useApp } from '../../context/AppContext';
import { BottomSheet } from './BottomSheet';
import { Cpu, ShieldCheck, FileText, CheckCircle2, Copy } from 'lucide-react';

export const ChunkInspectorModal: React.FC = () => {
  const { selectedChunkForInspector, setSelectedChunkForInspector, setSelectedDocForViewer, documents } = useApp();
  const [copied, setCopied] = React.useState(false);

  if (!selectedChunkForInspector) return null;

  const chunk = selectedChunkForInspector;
  const parentDoc = documents.find(d => d.id === chunk.documentId);

  const handleCopy = () => {
    navigator.clipboard.writeText(chunk.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenDoc = () => {
    if (parentDoc) {
      setSelectedChunkForInspector(null);
      setSelectedDocForViewer(parentDoc);
    }
  };

  return (
    <BottomSheet
      isOpen={!!selectedChunkForInspector}
      onClose={() => setSelectedChunkForInspector(null)}
      title={`Chunk #${chunk.chunkIndex} · ${chunk.sectionTitle}`}
      subtitle={`Rujukan: ${chunk.documentTitle}`}
    >
      <div className="space-y-5">
        {/* Security & Organization Boundary Notice */}
        <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-lg flex items-center justify-between text-xs text-blue-900 dark:text-blue-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Konteks Organisasi: <strong className="text-blue-950 dark:text-blue-200">{chunk.organizationName}</strong> (Terisolasi)</span>
          </div>
          <span className="text-[11px] font-mono text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
            {chunk.tokenCount} Tokens
          </span>
        </div>

        {/* Chunk Text Content */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Isi Teks Ekstraksi Vector
            </span>
            <button
              onClick={handleCopy}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap selection:bg-blue-100 dark:selection:bg-blue-900">
            {chunk.content}
          </div>
        </div>

        {/* Technical Vector Details */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-800/60 p-3 border border-slate-200 dark:border-slate-700 rounded-lg text-xs">
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Embedding Engine</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">text-embedding-3</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Indeks Partisi</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">{chunk.chunkIndex} of {chunk.totalChunks}</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Status Vektor</span>
            <span className="font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Tersimpan & Aktif
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          {parentDoc ? (
            <button
              onClick={handleOpenDoc}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              Buka Dokumen Induk ({parentDoc.fileType})
            </button>
          ) : <div />}
          <button
            onClick={() => setSelectedChunkForInspector(null)}
            className="px-4 py-1.5 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-xs font-medium hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
