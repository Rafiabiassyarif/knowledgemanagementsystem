import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Settings, 
  Cpu, 
  ShieldCheck, 
  CheckCircle2, 
  Sliders, 
  Database,
  Key,
  HardDrive
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { ragConfig, updateRagConfig, currentUser, currentOrganization } = useApp();

  const [chunkSize, setChunkSize] = useState(ragConfig.chunkSize);
  const [chunkOverlap, setChunkOverlap] = useState(ragConfig.chunkOverlap);
  const [embeddingModel, setEmbeddingModel] = useState(ragConfig.embeddingModel);
  const [similarityThreshold, setSimilarityThreshold] = useState(ragConfig.similarityThreshold);
  const [topK, setTopK] = useState(ragConfig.topK || ragConfig.topKRetrieval || 5);
  const [systemPrompt, setSystemPrompt] = useState(ragConfig.systemPrompt);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateRagConfig({
      chunkSize: Number(chunkSize),
      chunkOverlap: Number(chunkOverlap),
      embeddingModel,
      similarityThreshold: Number(similarityThreshold),
      topK: Number(topK),
      topKRetrieval: Number(topK),
      systemPrompt
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Pengaturan Sistem & RAG Pipeline
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {currentUser?.role === 'admin'
            ? 'Konfigurasi global parameter chunking vektor, model embedding, dan batasan retrieval RAG.'
            : `Pengaturan integrasi knowledge & preferensi untuk ${currentOrganization?.name || 'Organisasi'}.`}
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Pengaturan RAG pipeline berhasil diperbarui ke seluruh simpul organisasi.</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* RAG Core Hyperparameters */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Parameter Ingesti & Vector Chunking</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Chunk Size (Tokens)
              </label>
              <input
                type="number"
                value={chunkSize}
                onChange={(e) => setChunkSize(Number(e.target.value))}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 tabular-nums"
              />
              <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                Panjang target fragmen teks saat mengekstrak dokumen (Standar: 512).
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Chunk Overlap (Tokens)
              </label>
              <input
                type="number"
                value={chunkOverlap}
                onChange={(e) => setChunkOverlap(Number(e.target.value))}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 tabular-nums"
              />
              <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                Jumlah token tumpang-tindih antar chunk guna mempertahankan konteks (Standar: 64).
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Model Embedding Vektor
              </label>
              <select
                value={embeddingModel}
                onChange={(e) => setEmbeddingModel(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="text-embedding-3-large (Mock / Local)">text-embedding-3-large (Mock / Local)</option>
                <option value="text-embedding-3-small (Fast / 1536 dim)">text-embedding-3-small (Fast / 1536 dim)</option>
                <option value="multilingual-e5-large (Indonesian optimized)">multilingual-e5-large (Indonesian optimized)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Top-K Retrieval (Jumlah Chunk Terkait)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 tabular-nums"
              />
              <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                Jumlah chunk paling relevan yang dimasukkan ke konteks LLM per kueri.
              </span>
            </div>
          </div>
        </div>

        {/* System Prompt Instruction */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Instruksi Sistem AI (Grounding & Sitasi)</h3>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              System Prompt Template
            </label>
            <textarea
              rows={4}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono text-[11px] leading-relaxed"
            />
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block">
              Memastikan model AI patuh pada batas-batas dokumen resmi tanpa halusinasi.
            </span>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            Simpan Konfigurasi RAG
          </button>
        </div>
      </form>
    </div>
  );
};
