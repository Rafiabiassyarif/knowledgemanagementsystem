import React from 'react';
import { useApp } from '../../context/AppContext';
import { downloadProtectedFile, API_BASE_URL } from '../../services/api';
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
      subtitle={`${doc.organizationName} · ${doc.category} · ${doc.repositoryType === 'knowledge' ? '💡 Repositori Knowledge' : '📁 Repositori Dokumen'}`}
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
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Penyimpanan</span>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5 flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              Tersimpan Aman
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

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            Diupload oleh {doc.uploadedBy} · {doc.uploadedAt}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const targetUrl = (doc.fileUrl && !doc.fileUrl.startsWith('db://'))
                  ? doc.fileUrl
                  : `${API_BASE_URL}/documents/${doc.id}/download`;
                downloadProtectedFile(targetUrl, `${doc.title}.${(doc.fileType || 'PDF').toLowerCase()}`)
                  .catch(err => alert(err.message || 'Gagal mengunduh dokumen.'));
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
