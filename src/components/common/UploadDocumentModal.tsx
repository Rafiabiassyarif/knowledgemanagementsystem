import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { BottomSheet } from './BottomSheet';
import { DocumentCategory } from '../../types';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Sparkles,
  Building2,
  X,
  FileCheck
} from 'lucide-react';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultOrgId?: string;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  defaultOrgId
}) => {
  const { uploadDocument, organizations, currentUser } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'PDF' | 'DOCX' | 'XLSX'>('PDF');
  const [fileSizeKb, setFileSizeKb] = useState<number>(2450);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('SOP & Prosedur');
  const [notes, setNotes] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState(
    defaultOrgId || currentUser?.organizationId || organizations[0]?.id || ''
  );

  // Upload process state: 'idle' | 'uploading' | 'parsing' | 'embedding' | 'completed'
  const [processState, setProcessState] = useState<'idle' | 'uploading' | 'parsing' | 'embedding' | 'completed'>('idle');
  const [progressPercent, setProgressPercent] = useState(0);

  const categories: DocumentCategory[] = [
    'SOP & Prosedur',
    'Laporan Keuangan',
    'Regulasi & Perda',
    'Engineering & Teknis',
    'Kebijakan HR',
    'Perencanaan Strategis'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFileSizeKb(Math.round(file.size / 1024) || 1800);

      // Auto-detect file type
      const ext = file.name.split('.').pop()?.toUpperCase();
      if (ext === 'PDF' || ext === 'DOCX' || ext === 'XLSX') {
        setFileType(ext as any);
      }

      // Auto-fill title from filename if title is empty
      if (!title.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setFileSizeKb(Math.round(file.size / 1024) || 2100);

      const ext = file.name.split('.').pop()?.toUpperCase();
      if (ext === 'PDF' || ext === 'DOCX' || ext === 'XLSX') {
        setFileType(ext as any);
      }

      if (!title.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName);
      }
    }
  };

  const handleStartUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setProcessState('uploading');
    setProgressPercent(25);

    // Simulated 3-stage RAG ingestion pipeline
    await new Promise(r => setTimeout(r, 500));
    setProcessState('parsing');
    setProgressPercent(60);

    await new Promise(r => setTimeout(r, 600));
    setProcessState('embedding');
    setProgressPercent(88);

    await new Promise(r => setTimeout(r, 500));
    setProgressPercent(100);

    // Auto-generate tags and summary for seamless RAG search
    const generatedTags = ['resmi', category.toLowerCase(), 'internal', fileType.toLowerCase()];
    const generatedSummary = notes.trim() 
      ? notes.trim() 
      : `Dokumen resmi ${title} kategori ${category} yang telah terindeks secara otomatis ke dalam ruang vektor RAG.`;

    const targetOrgId = currentUser?.role === 'superadmin' ? selectedOrgId : currentUser?.organizationId || undefined;

    await uploadDocument({
      title: title.trim(),
      category,
      year: new Date().getFullYear(),
      fileType,
      fileSizeKb,
      department: currentUser?.department || 'Operasional Organisasi',
      tags: generatedTags,
      summary: generatedSummary,
      organizationId: targetOrgId
    });

    setProcessState('completed');
  };

  const handleReset = () => {
    setSelectedFile(null);
    setTitle('');
    setNotes('');
    setProcessState('idle');
    setProgressPercent(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={processState === 'uploading' || processState === 'parsing' || processState === 'embedding' ? () => {} : handleReset}
      title="Unggah Dokumen"
      subtitle="Berkas akan diindeks otomatis oleh sistem AI (RAG) untuk pencarian & tanya jawab"
    >
      {/* Uploading Pipeline State */}
      {processState !== 'idle' && processState !== 'completed' ? (
        <div className="py-8 px-4 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400 animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>

          <div>
            <h4 className="text-base font-semibold text-slate-900 dark:text-white">
              {processState === 'uploading' && 'Mengunggah Berkas ke Storage...'}
              {processState === 'parsing' && 'Mengekstrak Isi Teks & Struktur...'}
              {processState === 'embedding' && 'Mengindeks Otomatis ke Mesin AI (RAG)...'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {processState === 'uploading' && 'Memverifikasi berkas dan hak akses multi-tenant.'}
              {processState === 'parsing' && 'Memproses teks dokumen untuk pencarian semantik.'}
              {processState === 'embedding' && 'Menyimpan representasi vektor untuk asisten AI.'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto">
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 dark:text-slate-500 mt-2 tabular-nums">
              <span>Pemrosesan Otomatis</span>
              <span>{progressPercent}%</span>
            </div>
          </div>
        </div>
      ) : processState === 'completed' ? (
        <div className="py-8 px-4 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-slate-900 dark:text-white">Dokumen Berhasil Diunggah!</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Dokumen telah berhasil diunggah dan terindeks otomatis oleh RAG AI Assistant.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            Selesai & Lihat Dokumen
          </button>
        </div>
      ) : (
        /* Simplified Upload Form */
        <form onSubmit={handleStartUpload} className="space-y-4">
          {/* Target Organization Selector (Superadmin only) */}
          {currentUser?.role === 'superadmin' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Organisasi / BUMD Tujuan *</span>
              </label>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
              >
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* File Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Berkas Dokumen *
            </label>
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.xlsx"
              className="hidden"
            />

            {!selectedFile ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl p-6 text-center bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 cursor-pointer transition-all group"
              >
                <UploadCloud className="w-8 h-8 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 mx-auto mb-2 transition-colors" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Tarik berkas ke sini, atau <span className="text-blue-600 dark:text-blue-400 underline">pilih dari perangkat</span>
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Mendukung berkas PDF, Word (DOCX), atau Excel (XLSX) hingga 25MB
                </p>
                
                {/* Format Pills */}
                <div className="flex justify-center gap-1.5 mt-3">
                  {(['PDF', 'DOCX', 'XLSX'] as const).map(fmt => (
                    <span
                      key={fmt}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded border transition-colors ${
                        fileType === fmt 
                          ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
                          : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              /* Selected File Card */
              <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/30 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {fileType} · {(fileSizeKb / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 rounded-lg transition-colors cursor-pointer"
                  >
                    Ganti
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    title="Hapus berkas"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Document Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Judul Dokumen *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: SOP Tanggap Darurat Kebocoran Pipa Distribusi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kategori Dokumen *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Optional Short Note */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Catatan Dokumen <span className="text-[11px] text-slate-400 font-normal">(Opsional)</span>
            </label>
            <input
              type="text"
              placeholder="Catatan singkat terkait berkas ini (opsional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* RAG Auto-indexing Notice */}
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Teks, kata kunci, dan ringkasan akan diproses secara otomatis oleh mesin AI RAG.</span>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Unggah Dokumen
            </button>
          </div>
        </form>
      )}
    </BottomSheet>
  );
};
