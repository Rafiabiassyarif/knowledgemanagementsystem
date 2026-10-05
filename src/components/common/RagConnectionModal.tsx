import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  Cpu, 
  RefreshCw, 
  ExternalLink, 
  Layers, 
  CheckCircle2, 
  MessageSquare, 
  Terminal, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Organization } from '../../types';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';

interface RagConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization | null;
}

export const RagConnectionModal: React.FC<RagConnectionModalProps> = ({
  isOpen,
  onClose,
  organization: org
}) => {
  const navigate = useNavigate();
  const { switchProject } = useApp();
  const [copiedKb, setCopiedKb] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'js'>('curl');

  if (!isOpen || !org) return null;

  const kbCode = org.knowledgeBase || ('kb_' + (org.code || 'utama').toLowerCase().replace(/[^a-z0-9_]/g, '_'));
  const ragEndpoint = 'https://rag.aiones.app/api/v1/knowledge';

  const curlExample = `curl -X POST "${ragEndpoint}/query" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_PROJECT_API_KEY" \\
  -d '{
    "knowledge_base": "${kbCode}",
    "query": "Apa kebijakan atau prosedur utama terkait project ${org.name}?"
  }'`;

  const jsExample = `const response = await fetch("${ragEndpoint}/query", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_PROJECT_API_KEY"
  },
  body: JSON.stringify({
    knowledge_base: "${kbCode}",
    query: "Ringkas SOP terbaru pada project ini."
  })
});
const data = await response.json();
console.log(data.answer);`;

  const handleCopyKb = () => {
    navigator.clipboard.writeText(kbCode);
    setCopiedKb(true);
    setTimeout(() => setCopiedKb(false), 2000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleSyncToRag = async () => {
    try {
      setIsSyncing(true);
      setSyncResult(null);
      const res = await api.documents.syncRag(org.id);
      if (res.success) {
        setSyncResult({
          success: true,
          message: res.message || `Berhasil menghubungkan dan mensinkronisasikan ${res.count || 0} berkas ke RAG.`
        });
      } else {
        setSyncResult({
          success: false,
          message: res.message || 'Gagal mensinkronisasikan dokumen ke RAG.'
        });
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err?.message || 'Terjadi kesalahan saat menghubungkan ke RAG service.'
      });
    } finally {
      setIsSyncing(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                  Koneksi RAG & Knowledge Base
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Connected
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Project: <strong className="text-slate-700 dark:text-slate-200">{org.name}</strong> ({org.code || 'PRJ'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Sync Result Banner */}
          {syncResult && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in duration-200 ${
              syncResult.success 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300' 
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300'
            }`}>
              {syncResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{syncResult.message}</span>
            </div>
          )}

          {/* Primary Knowledge Base Code Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-slate-50 dark:from-slate-800/80 dark:via-indigo-950/30 dark:to-slate-900 border border-blue-100 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Knowledge Base ID (Partisi RAG)
              </span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                Tenant-Scoped
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-700 shadow-xs">
              <code className="text-base sm:text-lg font-mono font-bold text-blue-600 dark:text-blue-400 select-all tracking-wide">
                {kbCode}
              </code>
              <button
                type="button"
                onClick={handleCopyKb}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                {copiedKb ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Kode</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Kode unik ini memisahkan seluruh dokumen, chunking, dan vektor embedding milik <strong>{org.name}</strong> di server RAG. Saat AI asisten menjawab pertanyaan di project ini, hanya dokumen dalam knowledge base ini yang dirujuk.
            </p>
          </div>

          {/* Connection Status & Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Server RAG Target</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 block truncate font-mono">
                rag.aiones.app
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Total Dokumen Project</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 block tabular-nums">
                {org.documentsCount || 0} Berkas Terdaftar
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Sinkronisasi Otomatis</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 block flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Aktif Saat Upload
              </span>
            </div>
          </div>

          {/* Quick Actions (Sinkronisasi RAG) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleSyncToRag}
              disabled={isSyncing}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menghubungkan ke RAG...' : 'Sinkronkan Dokumen ke RAG Sekarang'}</span>
            </button>
          </div>

          {/* API Code Integration Snippet */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                Integrasi Eksternal (API / Webhook)
              </span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('curl')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    activeCodeTab === 'curl' 
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' 
                      : 'text-slate-500'
                  }`}
                >
                  cURL
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('js')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    activeCodeTab === 'js' 
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' 
                      : 'text-slate-500'
                  }`}
                >
                  Node.js / JS
                </button>
              </div>
            </div>

            <div className="relative rounded-xl bg-slate-900 text-slate-200 p-3.5 text-[11px] font-mono overflow-x-auto">
              <button
                type="button"
                onClick={() => handleCopyCode(activeCodeTab === 'curl' ? curlExample : jsExample)}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Salin Kode"
              >
                {copiedCurl ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <pre className="pr-8 whitespace-pre-wrap leading-relaxed">
                {activeCodeTab === 'curl' ? curlExample : jsExample}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-blue-500" />
            <span>KMS Multi-Tenant Engine terhubung ke RAG Aiones</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
