import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BottomSheet } from './BottomSheet';
import { FolderKanban, Plus, Sparkles, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMandatoryOnboarding?: boolean;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  isMandatoryOnboarding = false
}) => {
  const { addOrganization, currentUser } = useApp();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState('kb_utama');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Teknologi & Digital');
  const [sector, setSector] = useState('Manajemen Pengetahuan & Aset');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const projectTypes = [
    'Teknologi & Digital',
    'Operasional & Layanan',
    'Infrastruktur & Teknis',
    'Manajemen & Bisnis',
    'Riset & Pengembangan',
    'Umum'
  ];

  const handleNameChange = (val: string) => {
    setName(val);
    // Auto-generate a clean code if user hasn't manually edited code
    if (!code || code.startsWith('PRJ-')) {
      const generated = 'PRJ-' + val
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .split(/\s+/)
        .slice(0, 2)
        .join('-')
        .slice(0, 10);
      setCode(generated || 'PRJ-');
    }

    // Auto-generate knowledge base code if untouched or default
    if (!knowledgeBase || knowledgeBase === 'kb_utama' || knowledgeBase.startsWith('kb_')) {
      const slug = val
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .split(/\s+/)
        .slice(0, 3)
        .join('_');
      setKnowledgeBase(slug ? `kb_${slug}` : 'kb_utama');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Nama Project wajib diisi.');
      return;
    }

    const finalCode = (code.trim() || `PRJ-${Date.now().toString().slice(-4)}`).toUpperCase();
    let finalKb = (knowledgeBase.trim() || 'kb_utama').toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!finalKb.startsWith('kb_')) {
      finalKb = `kb_${finalKb}`;
    }

    setIsSubmitting(true);
    try {
      const res = addOrganization({
        name: name.trim(),
        code: finalCode,
        knowledgeBase: finalKb,
        description: description.trim() || `Project ${name} untuk pengelolaan berkas dan basis pengetahuan.`,
        type,
        sector: sector || 'Utilitas & Pengetahuan',
        province: 'DKI Jakarta',
        city: 'Jakarta',
        adminId: currentUser?.id || `user-${Date.now()}`,
        adminName: currentUser?.name || 'Owner Project',
        adminEmail: currentUser?.email || 'owner@project.local',
        status: 'active'
      });

      if (!res.success) {
        setErrorMessage(res.message);
        setIsSubmitting(false);
        return;
      }

      // Reset
      setName('');
      setCode('');
      setKnowledgeBase('kb_utama');
      setDescription('');
      setErrorMessage(null);
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal membuat project.');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isMandatoryOnboarding ? "Buat Project Pertama Anda 🚀" : "Buat Project Baru"}
      subtitle={
        isMandatoryOnboarding
          ? "Platform berbasis project. Silakan buat project pertama Anda untuk mulai mengunggah file, foto, dan mengelola knowledge base."
          : "Tambahkan project baru untuk mengorganisir dokumen, foto/media, dan basis pengetahuan."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isMandatoryOnboarding && (
          <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 text-blue-900 dark:text-blue-200 text-xs leading-relaxed space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Langkah Awal Memulai</span>
            </p>
            <p className="text-[11px] text-blue-700 dark:text-blue-300">
              Setiap dokumen, galeri foto, dan basis pengetahuan tersimpan aman dan terisolasi per Project. Anda akan otomatis menjadi Pemilik/Admin dari project ini.
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Nama Project *
          </label>
          <input
            type="text"
            required
            placeholder="Contoh: Proyek Revitalisasi Air, Digitalisasi KMS, Riset AI..."
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kode Unik Project *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: PRJ-REVITALISASI"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full text-xs font-mono uppercase rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kategori / Tipe Project *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all cursor-pointer"
            >
              {projectTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Knowledge Base Code Field */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Knowledge base *
            </label>
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200/50 dark:border-blue-800/50">
              RAG Partition
            </span>
          </div>
          <input
            type="text"
            required
            placeholder="kb_utama"
            value={knowledgeBase}
            onChange={(e) => setKnowledgeBase(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
            className="w-full text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Pemisah dokumen dalam satu tenant.
          </p>
        </div>

        {/* Knowledge Base Explanation & Usage Guide */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-50/80 via-slate-50 to-indigo-50/40 dark:from-slate-800/90 dark:via-slate-800/50 dark:to-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-blue-900 dark:text-blue-200">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Panduan & Cara Pemakaian Knowledge Base</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            Kode <strong>Knowledge Base</strong> (contoh: <code className="px-1 py-0.5 rounded bg-white dark:bg-slate-700 font-mono text-[10px] text-blue-600 dark:text-blue-300">{knowledgeBase || 'kb_utama'}</code>) adalah identitas pemisah berkas project Anda di mesin RAG AI:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5 text-[11px]">
            <div className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">🔒 Isolasi Partisi Dokumen</span>
              <span className="text-slate-500 dark:text-slate-400">Setiap berkas PDF, Word, atau media yang Anda upload otomatis terkelompok di sini dan tidak akan bocor ke project lain.</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">💬 Tanya AI Terfokus</span>
              <span className="text-slate-500 dark:text-slate-400">Saat Anda bertanya di menu Tanya AI, jawaban hanya dirangkum dari dokumen yang ada di Knowledge Base project ini.</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Deskripsi Project
          </label>
          <textarea
            rows={2}
            placeholder="Jelaskan tujuan project dan ruang lingkup berkas atau pengetahuan yang akan dikelola..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            {isMandatoryOnboarding ? 'Nanti Saja' : 'Batal'}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <FolderKanban className="w-4 h-4" />
            <span>{isMandatoryOnboarding ? "Buat Project & Mulai" : "Simpan Project"}</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
