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
              Kroombox Edge CDN
            </p>
          </div>
        </div>

        {/* Media Preview Section for Photos & Documents */}
        {(() => {
          const ext = (doc.fileType || '').toLowerCase();
          const isPhoto = (doc.repositoryType || '').toLowerCase() === 'photo' ||
            ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'image'].includes(ext) ||
            /\.(png|jpe?g|webp|gif|svg|bmp)$/i.test(doc.title || '');

          const previewUrl = doc.cdnFileId
            ? `https://api-cdn.kroombox.com/api/bridge/view/${doc.cdnFileId}`
            : (doc.fileUrl && !doc.fileUrl.startsWith('db://') && !doc.fileUrl.includes('drive.google.com'))
              ? doc.fileUrl
              : `/api/documents/${doc.id}/view`;

          if (isPhoto) {
            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    Pratinjau Foto / Media
                  </h4>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Buka Resolusi Penuh <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-700 bg-slate-900/5 dark:bg-slate-950 p-2 sm:p-4 flex flex-col items-center justify-center min-h-[220px]">
                  <img
                    src={previewUrl}
                    alt={doc.title}
                    className="max-h-[380px] max-w-full rounded-xl object-contain shadow-sm border border-slate-200/40 dark:border-slate-800"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes(`/api/documents/${doc.id}/view`)) {
                        target.src = `/api/documents/${doc.id}/view`;
                      }
                    }}
                  />
                  <div className="mt-2.5 flex items-center justify-between w-full text-[11px] text-slate-500 dark:text-slate-400 px-1">
                    <span>Format: {doc.fileType || 'PNG'} · {doc.fileSizeKb ? `${doc.fileSizeKb} KB` : 'Media'}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ Terverifikasi di Edge CDN</span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                  {doc.fileType || 'DOC'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {doc.title}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Berkas resmi tersimpan aman di repositori CDN
                  </p>
                </div>
              </div>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors shadow-xs"
              >
                Lihat Berkas <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          );
        })()}

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
                const targetUrl = `${API_BASE_URL}/documents/${doc.id}/download`;
                const ext = (doc.fileType || 'PDF').toLowerCase();
                const filename = `${doc.title}.${ext}`;
                downloadProtectedFile(targetUrl, filename, doc.id)
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
