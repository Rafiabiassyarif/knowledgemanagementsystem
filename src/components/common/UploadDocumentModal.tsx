import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BottomSheet } from './BottomSheet';
import { DocumentCategory } from '../../types';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Sparkles,
  X,
  Image as ImageIcon,
  FolderKanban,
  Plus,
  Trash2,
  Layers,
  FileCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';

export interface QueuedFile {
  id: string;
  file: File;
  title: string;
  category: DocumentCategory;
  repositoryType: 'document' | 'photo' | 'knowledge';
  year: number;
  fileType: string;
  fileSizeKb: number;
  previewUrl?: string;
  status: 'ready' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
}

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
  const { uploadDocument, organizations, currentUser, currentOrganization } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [defaultRepoType, setDefaultRepoType] = useState<'document' | 'photo' | 'knowledge'>('document');
  const [defaultCategory, setDefaultCategory] = useState<DocumentCategory>('SOP & Prosedur');
  const [defaultYear, setDefaultYear] = useState<number>(new Date().getFullYear());
  const [globalNotes, setGlobalNotes] = useState('');
  const [singleDocTitle, setSingleDocTitle] = useState('');

  // Upload process state: 'idle' | 'uploading' | 'completed' | 'error'
  const [processState, setProcessState] = useState<'idle' | 'uploading' | 'completed' | 'error'>('idle');
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadedCount, setUploadedCount] = useState(0);

  const categories: DocumentCategory[] = [
    'SOP & Prosedur',
    'Laporan Keuangan',
    'Regulasi & Perda',
    'Engineering & Teknis',
    'Kebijakan HR',
    'Perencanaan Strategis'
  ];

  // Clean up object URLs on unmount or reset
  useEffect(() => {
    return () => {
      queuedFiles.forEach(item => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  const detectType = (filename: string): { type: string; repo: 'document' | 'photo' | 'knowledge' } => {
    const ext = filename.split('.').pop()?.toUpperCase() || '';
    if (['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF', 'SVG'].includes(ext)) {
      return { type: ext, repo: 'photo' };
    }
    if (ext === 'PDF') return { type: 'PDF', repo: 'document' };
    if (['DOC', 'DOCX'].includes(ext)) return { type: 'DOCX', repo: 'document' };
    if (['XLS', 'XLSX'].includes(ext)) return { type: 'XLSX', repo: 'document' };
    if (['TXT', 'CSV', 'MD'].includes(ext)) return { type: 'TXT', repo: 'knowledge' };
    return { type: ext || 'FILE', repo: defaultRepoType };
  };

  const addFilesToQueue = (files: FileList | File[]) => {
    const newItems: QueuedFile[] = Array.from(files).map((file, idx) => {
      const { type, repo } = detectType(file.name);
      // If user pre-selected photo repo, keep it
      const targetRepo = defaultRepoType !== 'document' ? defaultRepoType : repo;
      const isImg = targetRepo === 'photo' || ['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF'].includes(type);
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      const yearMatch = file.name.match(/\b(19\d\d|20\d\d)\b/);
      const fileYear = yearMatch ? Number(yearMatch[1]) : defaultYear;

      return {
        id: `q-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        title: cleanTitle,
        category: defaultCategory,
        repositoryType: targetRepo,
        year: fileYear,
        fileType: type,
        fileSizeKb: Math.max(1, Math.round(file.size / 1024)),
        previewUrl: isImg ? URL.createObjectURL(file) : undefined,
        status: 'ready'
      };
    });

    setQueuedFiles(prev => {
      const combined = [...prev, ...newItems];
      if (combined.length === 1 && !singleDocTitle) {
        setSingleDocTitle(combined[0].title);
      }
      return combined;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(e.dataTransfer.files);
    }
  };

  const removeFile = (id: string) => {
    setQueuedFiles(prev => {
      const target = prev.find(item => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      const updated = prev.filter(item => item.id !== id);
      if (updated.length === 1) {
        setSingleDocTitle(updated[0].title);
      }
      return updated;
    });
  };

  const updateFileTitle = (id: string, newTitle: string) => {
    setQueuedFiles(prev => prev.map(item => item.id === id ? { ...item, title: newTitle } : item));
  };

  const updateFileRepo = (id: string, newRepo: 'document' | 'photo' | 'knowledge') => {
    setQueuedFiles(prev => prev.map(item => item.id === id ? { ...item, repositoryType: newRepo } : item));
  };

  const updateFileCategory = (id: string, newCat: DocumentCategory) => {
    setQueuedFiles(prev => prev.map(item => item.id === id ? { ...item, category: newCat } : item));
  };

  const handleRepoTypeSelect = (repo: 'document' | 'photo' | 'knowledge') => {
    setDefaultRepoType(repo);
    if (queuedFiles.length > 0) {
      setQueuedFiles(prev => prev.map(item => ({ ...item, repositoryType: repo })));
    }
  };

  const handleStartBatchUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (queuedFiles.length === 0) return;

    setProcessState('uploading');
    setUploadedCount(0);
    setProgressPercent(5);
    setUploadError('');

    const targetOrgId = defaultOrgId || currentOrganization?.id || currentUser?.organizationId || undefined;
    let completed = 0;

    for (let i = 0; i < queuedFiles.length; i++) {
      const item = queuedFiles[i];
      setCurrentFileIndex(i + 1);

      setQueuedFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'uploading' } : f));

      try {
        const fileTitle = (queuedFiles.length === 1 && singleDocTitle.trim())
          ? singleDocTitle.trim()
          : item.title.trim();

        const generatedTags = ['resmi', item.category.toLowerCase(), item.repositoryType, item.fileType.toLowerCase(), 'kroombox-cdn'];
        const itemSummary = globalNotes.trim()
          ? `${globalNotes.trim()} (${fileTitle})`
          : `Berkas ${fileTitle} kategori ${item.category} yang tersimpan di Kroombox Edge CDN dan terindeks untuk Project.`;

        await uploadDocument({
          title: fileTitle,
          category: item.category,
          repositoryType: item.repositoryType,
          year: Number(item.year) || defaultYear,
          fileType: item.fileType as any,
          fileSizeKb: item.fileSizeKb,
          department: 'Operasional Project',
          tags: generatedTags,
          summary: itemSummary,
          organizationId: targetOrgId
        } as any, item.file);

        completed++;
        setUploadedCount(completed);
        const percent = Math.round((completed / queuedFiles.length) * 100);
        setProgressPercent(percent);

        setQueuedFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'completed' } : f));
      } catch (err: any) {
        console.error(`[UPLOAD ERROR: ${item.file.name}]`, err);
        setQueuedFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error', errorMessage: err?.message || 'Gagal unggah' } : f));
      }
    }

    if (completed > 0) {
      setProcessState('completed');
    } else {
      setUploadError('Seluruh berkas gagal diunggah. Pastikan format berkas didukung dan ukuran di bawah 50MB.');
      setProcessState('error');
    }
  };

  const handleReset = () => {
    queuedFiles.forEach(item => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setQueuedFiles([]);
    setGlobalNotes('');
    setSingleDocTitle('');
    setProcessState('idle');
    setProgressPercent(0);
    setUploadError('');
    setCurrentFileIndex(0);
    setUploadedCount(0);
    onClose();
  };

  const totalSizeKb = queuedFiles.reduce((acc, f) => acc + f.fileSizeKb, 0);

  if (!isOpen) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={processState === 'uploading' ? () => {} : handleReset}
      title="Unggah Dokumen & Pengetahuan"
      subtitle="Berkas akan diindeks otomatis oleh sistem AI (RAG) untuk pencarian & tanya jawab, tersimpan aman di Kroombox Edge CDN."
    >
      {/* 1. UPLOADING IN PROGRESS STATE */}
      {processState === 'uploading' ? (
        <div className="py-10 px-4 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400 animate-pulse shadow-sm">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Mengunggah Berkas {currentFileIndex} dari {queuedFiles.length} ke Edge CDN...
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Menyimpan data fisik berkas ke CDN dan menyinkronkan embedding ke basis pengetahuan proyek Anda.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto">
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60">
              <div 
                className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-mono">
              <span>{uploadedCount} dari {queuedFiles.length} berkas terunggah</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{progressPercent}%</span>
            </div>
          </div>
        </div>
      ) : processState === 'completed' ? (
        /* 2. COMPLETED STATE */
        <div className="py-8 px-4 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {uploadedCount} Berkas Berhasil Diunggah!
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Seluruh berkas fisik telah tersimpan aman di <strong>Kroombox Edge CDN</strong> dan siap diakses di repositori dokumen project Anda.
            </p>
          </div>

          {/* Mini summary of uploaded files */}
          <div className="max-h-48 overflow-y-auto max-w-md mx-auto text-left space-y-1.5 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
            {queuedFiles.map(f => (
              <div key={f.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-medium truncate text-slate-800 dark:text-slate-200">{f.title}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shrink-0">
                  CDN OK
                </span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer active:scale-95"
          >
            Selesai & Buka Repositori
          </button>
        </div>
      ) : (
        /* 3. INPUT FORM (SUPPORT MULTI-DOKUMEN & MULTI-FOTO) */
        <form onSubmit={handleStartBatchUpload} className="space-y-4">
          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4 shrink-0" /> {uploadError}</span>
              <button type="button" onClick={() => setUploadError('')} className="p-1 hover:text-rose-900"><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Target Project Badge */}
          {currentOrganization && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-slate-500 dark:text-slate-400">Target Proyek:</span>
                <span className="font-bold text-slate-800 dark:text-white">{currentOrganization.name}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold">
                {currentOrganization.code}
              </span>
            </div>
          )}

          {/* 1. Drag & Drop Multi-File Zone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Berkas Dokumen & Media *
            </label>
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept=".pdf,.docx,.doc,.xlsx,.xls,.jpg,.jpeg,.png,.webp,.gif,.txt,.csv,.md"
              className="hidden"
            />

            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-6 text-center bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 cursor-pointer transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2.5 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Tarik berkas ke sini, atau <span className="text-blue-600 dark:text-blue-400 underline font-semibold">pilih dari perangkat</span>
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                Mendukung <strong>Multi-Dokumen & Multi-Foto</strong> (PDF, Word, Excel, Foto/Gambar JPG/PNG/WebP, dan Berkas Teks) hingga 50MB
              </p>

              {/* Supported Format Pills */}
              <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
                  PDF
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  DOCX / Word
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
                  XLSX / Excel
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
                  Foto / JPG / PNG
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/60">
                  File / TXT
                </span>
              </div>
            </div>
          </div>

          {/* 2. Pilihan Repositori Tujuan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Pilihan Repositori Tujuan *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleRepoTypeSelect('document')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  defaultRepoType === 'document'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${defaultRepoType === 'document' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Dokumen / PDF</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">Surat resmi & regulasi</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRepoTypeSelect('photo')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  defaultRepoType === 'photo'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${defaultRepoType === 'photo' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Foto & Media</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">Dokumentasi & gambar</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRepoTypeSelect('knowledge')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  defaultRepoType === 'knowledge'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${defaultRepoType === 'knowledge' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Knowledge Base</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">Basis pengetahuan & SOP</div>
                </div>
              </button>
            </div>
          </div>

          {/* 3. MULTI-FILE QUEUE LIST */}
          {queuedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Daftar Berkas Terpilih ({queuedFiles.length})</span>
                  <span className="text-[11px] font-normal text-slate-400">· {(totalSizeKb / 1024).toFixed(1)} MB</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Berkas</span>
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <button
                    type="button"
                    onClick={() => setQueuedFiles([])}
                    className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                  >
                    Hapus Semua
                  </button>
                </div>
              </div>

              {/* Scrollable list of queued files */}
              <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                {queuedFiles.map((item) => (
                  <div 
                    key={item.id}
                    className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex items-center gap-3"
                  >
                    {/* Thumbnail / File Icon */}
                    {item.previewUrl ? (
                      <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100">
                        <img src={item.previewUrl} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className={`w-11 h-11 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        item.fileType === 'PDF' 
                          ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-900/60'
                          : item.fileType === 'DOCX' || item.fileType === 'DOC'
                            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 border border-blue-200 dark:border-blue-900/60'
                            : item.fileType === 'XLSX' || item.fileType === 'XLS'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-200 dark:border-emerald-900/60'
                              : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 border border-indigo-200 dark:border-indigo-900/60'
                      }`}>
                        {item.fileType}
                      </div>
                    )}

                    {/* File Editable Info */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateFileTitle(item.id, e.target.value)}
                        placeholder="Nama dokumen / foto..."
                        className="w-full text-xs font-semibold text-slate-800 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-600 focus:outline-none transition-colors truncate"
                      />
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.fileSizeKb > 1024 ? `${(item.fileSizeKb / 1024).toFixed(1)} MB` : `${item.fileSizeKb} KB`}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        {/* Inline Repo Switch */}
                        <select
                          value={item.repositoryType}
                          onChange={(e) => updateFileRepo(item.id, e.target.value as any)}
                          className="text-[10px] rounded px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 focus:outline-none cursor-pointer"
                        >
                          <option value="document">Dokumen / PDF</option>
                          <option value="photo">Foto & Media</option>
                          <option value="knowledge">Knowledge Base</option>
                        </select>
                      </div>
                    </div>

                    {/* Remove Action */}
                    <button
                      type="button"
                      onClick={() => removeFile(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Hapus berkas ini"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Single Document Title if 1 file chosen or general title */}
          {queuedFiles.length === 1 ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Judul Dokumen *
              </label>
              <input
                type="text"
                required
                value={singleDocTitle}
                onChange={(e) => {
                  setSingleDocTitle(e.target.value);
                  if (queuedFiles.length === 1) {
                    updateFileTitle(queuedFiles[0].id, e.target.value);
                  }
                }}
                placeholder="Contoh: SOP Tanggap Darurat Kebocoran Pipa Distribusi"
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          ) : queuedFiles.length === 0 ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Judul Dokumen *
              </label>
              <input
                type="text"
                disabled
                placeholder="Pilih berkas terlebih dahulu di atas..."
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-400 cursor-not-allowed"
              />
            </div>
          ) : null}

          {/* 5. Kategori Dokumen & Tahun Dokumen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori Dokumen *
              </label>
              <select
                value={defaultCategory}
                onChange={(e) => {
                  const val = e.target.value as DocumentCategory;
                  setDefaultCategory(val);
                  setQueuedFiles(prev => prev.map(f => ({ ...f, category: val })));
                }}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tahun Dokumen *
              </label>
              <input
                type="number"
                required
                min={1990}
                max={2099}
                value={defaultYear}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setDefaultYear(val);
                  setQueuedFiles(prev => prev.map(f => ({ ...f, year: val })));
                }}
                placeholder="2026"
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 tabular-nums"
              />
            </div>
          </div>

          {/* 6. Catatan Dokumen (Opsional) */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Catatan Dokumen <span className="text-[11px] text-slate-400 font-normal">(Opsional)</span>
            </label>
            <input
              type="text"
              placeholder="Catatan singkat terkait berkas ini (opsional)"
              value={globalNotes}
              onChange={(e) => setGlobalNotes(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* 7. Kroombox CDN Info Ribbon */}
          <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/60 flex items-center justify-between text-xs text-blue-800 dark:text-blue-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Berkas disimpan di <strong>Kroombox CDN</strong> & terindeks ke RAG AI</span>
            </div>
            <span className="text-[10px] bg-blue-100 dark:bg-blue-900/80 px-2 py-0.5 rounded-md font-mono font-bold text-blue-700 dark:text-blue-300">
              CDN Edge
            </span>
          </div>

          {/* 8. Footer Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={queuedFiles.length === 0}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-2 shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>
                {queuedFiles.length > 1
                  ? `Unggah ${queuedFiles.length} Berkas ke CDN`
                  : queuedFiles.length === 1
                    ? 'Unggah Dokumen'
                    : 'Pilih Berkas Dulu'}
              </span>
            </button>
          </div>
        </form>
      )}
    </BottomSheet>
  );
};
