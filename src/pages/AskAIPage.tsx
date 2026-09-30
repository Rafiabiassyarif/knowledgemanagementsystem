import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Send,
  Trash2,
  ShieldCheck,
  Loader2,
  Building2,
  Copy,
  Check,
  UserPlus
} from 'lucide-react';

export const AskAIPage: React.FC = () => {
  const {
    chatMessages,
    sendChatMessage,
    clearChatHistory,
    currentUser,
    currentOrganization,
    accessibleDocuments
  } = useApp();

  const [inputQuestion, setInputQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isSubmitting]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isSubmitting) return;

    const q = inputQuestion;
    setInputQuestion('');
    setIsSubmitting(true);
    try {
      await sendChatMessage(q);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickPrompt = async (promptText: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await sendChatMessage(promptText);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Dynamic prompt suggestions generated automatically from the organization's indexed documents
  // Dynamic prompt suggestions generated automatically from the organization's indexed documents
  const suggestions = useMemo(() => {
    const orgDocs = accessibleDocuments || [];
    if (orgDocs.length > 0) {
      return orgDocs.slice(0, 4).map((doc) => {
        const cleanTitle = doc.title.length > 36 ? doc.title.slice(0, 34) + '...' : doc.title;
        switch (doc.category) {
          case 'SOP':
            return `Bagaimana prosedur pelaksanaan ${cleanTitle}?`;
          case 'Regulasi & Kebijakan':
            return `Apa saja aturan utama dalam ${cleanTitle}?`;
          case 'Laporan Kinerja':
            return `Rangkum indikator capaian ${cleanTitle}`;
          case 'Panduan Teknis':
            return `Jelaskan langkah teknis ${cleanTitle}`;
          default:
            return `Jelaskan ringkasan isi dari ${cleanTitle}`;
        }
      });
    }

    return [
      `Bagaimana SOP operasional layanan di ${currentOrganization?.name || 'organisasi'}?`,
      'Apa saja aturan kerja dan kebijakan internal?',
      'Bagaimana mekanisme persetujuan dokumen resmi?'
    ];
  }, [accessibleDocuments, currentOrganization?.name]);

  // If regular user or unassigned admin is not joined to any organization, show barrier
  if (currentUser?.role !== 'superadmin' && !currentOrganization) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-8 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200/60 dark:border-amber-900/50">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Akses Tanya AI Terkunci
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Fitur Tanya AI memerlukan keanggotaan organisasi aktif untuk dapat menjawab pertanyaan seputar basis pengetahuan organisasi. Anda belum terdaftar dalam organisasi manapun.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <Link
              to="/app"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Pilih Organisasi di Beranda</span>
            </Link>
            <Link
              to="/app/join-org"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-slate-700 transition-colors"
            >
              <Building2 className="w-4 h-4" />
              <span>Buka Direktori Organisasi</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 max-w-4xl w-full mx-auto">
      {/* Top Context & Security Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 shadow-xs mb-3 shrink-0 flex items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/25 border border-blue-400/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {currentUser?.role === 'user'
                  ? `AI Assistant · ${currentOrganization?.name || 'Organisasi'}`
                  : 'KMS RAG AI Assistant'}
              </h2>
              <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 border border-blue-200/70 dark:border-blue-800/70 px-2 py-0.5 rounded-full shrink-0">
                RAG Knowledge Base
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {currentUser?.role === 'user'
                ? 'Terhubung dengan repositori SOP, regulasi, dan arsip resmi organisasi Anda.'
                : `Lingkup data: ${currentUser?.role === 'superadmin' ? 'Seluruh BUMD (Global KMS)' : (currentOrganization?.name || 'Organisasi')}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {currentUser?.role === 'user' && (
            <Link
              to="/app/join-org"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Organisasi Saya</span>
            </Link>
          )}

          <button
            onClick={clearChatHistory}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-600 dark:text-rose-400 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 rounded-xl transition-all duration-150 text-xs font-semibold shadow-2xs cursor-pointer active:scale-95"
            title="Bersihkan Percakapan"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bersihkan</span>
          </button>
        </div>
      </div>

      {/* Chat Messages Viewport */}
      <div className="flex-1 min-h-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-4 sm:p-5 overflow-y-auto space-y-5 transition-colors">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 sm:gap-3.5 animate-in fade-in slide-in-from-bottom-2 duration-150 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
          >
            {/* Assistant Avatar on Left */}
            {msg.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 border border-blue-400/30 mt-0.5">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Bubble & Metadata */}
            <div className={`flex flex-col max-w-[88%] sm:max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 mb-1 px-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {msg.sender === 'user' ? (currentUser?.name || 'Saya') : 'KMS Assistant'}
                </span>
                <span>•</span>
                <span className="tabular-nums">{msg.timestamp}</span>
                {msg.retrievalLatencyMs && (
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
                    {msg.retrievalLatencyMs}ms
                  </span>
                )}
              </div>

              <div
                className={`rounded-2xl p-4 sm:p-5 text-[13px] sm:text-sm leading-relaxed shadow-sm transition-all ${msg.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs shadow-blue-500/20 font-normal'
                    : 'bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 rounded-tl-xs shadow-slate-200/40 dark:shadow-black/20'
                  }`}
              >
                <div className="whitespace-pre-wrap selection:bg-blue-500 selection:text-white leading-relaxed">
                  {msg.text}
                </div>

                {/* Assistant footer toolbar */}
                {msg.sender === 'assistant' && (
                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                    <span className="text-[10px] font-medium tracking-wider uppercase text-slate-400 dark:text-slate-500">
                      Basis Dokumen Terverifikasi
                    </span>
                    <button
                      onClick={() => handleCopyText(msg.text, msg.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Jawaban</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* User Avatar on Right */}
            {msg.sender === 'user' && (
              currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-xl object-cover shrink-0 shadow-sm border border-slate-200 dark:border-slate-700 mt-0.5"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-950 dark:from-slate-700 dark:to-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm border border-slate-600/30 mt-0.5">
                  {currentUser?.avatarInitials || 'US'}
                </div>
              )
            )}
          </div>
        ))}

        {/* Loading Bubble */}
        {isSubmitting && (
          <div className="flex gap-3 sm:gap-3.5 animate-in fade-in duration-150">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 border border-blue-400/30">
              <Sparkles className="w-4 h-4 text-white animate-spin" />
            </div>
            <div className="flex flex-col items-start max-w-[80%]">
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mb-1 px-1">
                KMS Assistant · Menjawab...
              </div>
              <div className="bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl rounded-tl-xs p-4 text-xs sm:text-sm text-slate-700 dark:text-slate-200 flex items-center gap-3 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="leading-snug">Menemukan dan merangkum jawaban terbaik dari dokumen resmi...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      {suggestions.length > 0 && (
        <div className="py-2.5 overflow-x-auto flex items-center gap-2 no-scrollbar shrink-0">
          <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5 px-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Saran:</span>
          </div>
          {suggestions.map((sug, sIdx) => (
            <button
              key={sIdx}
              type="button"
              onClick={() => handleQuickPrompt(sug)}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 whitespace-nowrap transition-all shadow-2xs disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* Message Input Box */}
      <form
        onSubmit={handleSend}
        className="shrink-0 flex items-center gap-2 bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md shadow-slate-200/40 dark:shadow-black/30 focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-500 transition-all"
      >
        <input
          type="text"
          placeholder={`Ajukan pertanyaan seputar dokumen dan SOP ${currentOrganization?.name || 'organisasi'}...`}
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          disabled={isSubmitting}
          className="flex-1 text-xs sm:text-sm px-3 py-2 bg-transparent focus:outline-none text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputQuestion.trim() || isSubmitting}
          className="p-2.5 sm:px-4 sm:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-200 disabled:to-slate-300 dark:disabled:from-slate-800 dark:disabled:to-slate-800 text-white rounded-xl transition-all duration-150 shrink-0 shadow-sm shadow-blue-500/25 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed active:scale-95 flex items-center gap-1.5"
          aria-label="Kirim Pertanyaan"
        >
          <span className="hidden sm:inline text-xs font-semibold">Kirim</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
