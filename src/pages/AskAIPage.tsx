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
  UserPlus,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  ExternalLink,
  Eye,
  ArrowRight,
  Paperclip
} from 'lucide-react';

export const AskAIPage: React.FC = () => {
  const {
    chatMessages,
    sendChatMessage,
    clearChatHistory,
    currentUser,
    currentOrganization,
    organizations,
    documents,
    setSelectedDocForViewer
  } = useApp();

  // Helper for bold and italic markdown parsing
  const formatInlineMarkdown = (str: string): React.ReactNode => {
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = boldRegex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.slice(lastIndex, match.index));
      }
      parts.push(
        <strong key={match.index} className="font-bold text-slate-900 dark:text-white">
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < str.length) {
      parts.push(str.slice(lastIndex));
    }

    return parts.length > 0 ? parts : str;
  };

  // Render message content with rich clickable CDN links & rendered photos
  const renderMessageContent = (text: string) => {
    const lines = text.split('\n');

    return (
      <div className="space-y-1.5 leading-relaxed">
        {lines.map((line, lIdx) => {
          if (!line.trim()) {
            return <div key={lIdx} className="h-1.5" />;
          }

          // 1. Direct Markdown Image preview ![alt](url)
          const imgMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
          if (imgMatch) {
            const alt = imgMatch[1];
            const url = imgMatch[2];
            return (
              <div key={lIdx} className="my-2.5">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group max-w-sm rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shadow-xs hover:shadow-md transition-all cursor-pointer"
                  title={`Buka ${alt || 'Foto'} di tab baru`}
                >
                  <img
                    src={url}
                    alt={alt || 'Foto Dokumentasi'}
                    loading="lazy"
                    className="w-full max-h-72 object-cover transition-transform group-hover:scale-[1.02] duration-200"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const cdnMatch = url.match(/\/view\/([a-zA-Z0-9_-]+)/);
                      if (cdnMatch && !target.src.includes('api-cdn.kroombox.com')) {
                        target.src = `https://api-cdn.kroombox.com/api/bridge/view/${cdnMatch[1]}`;
                      }
                    }}
                  />
                  <div className="p-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700/60">
                    <span className="truncate font-medium text-slate-700 dark:text-slate-200">{alt || 'Foto Dokumentasi'}</span>
                    <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold shrink-0">
                      <span>Perbesar</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </a>
              </div>
            );
          }

          // 2. Markdown Links [label](url)
          const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
          if (linkRegex.test(line)) {
            const parts: React.ReactNode[] = [];
            let lastIndex = 0;
            let match: RegExpExecArray | null;
            linkRegex.lastIndex = 0;

            while ((match = linkRegex.exec(line)) !== null) {
              if (match.index > lastIndex) {
                parts.push(line.slice(lastIndex, match.index));
              }
              const label = match[1];
              const url = match[2];

              const isCdn = url.includes('cdn') || url.includes('/download') || label.includes('Unduh') || label.includes('Buka') || label.includes('Foto') || label.includes('Dokumen');

              if (isCdn) {
                parts.push(
                  <a
                    key={`link-${lIdx}-${match.index}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 my-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer no-underline group"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span>{label}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" />
                  </a>
                );
              } else {
                parts.push(
                  <a
                    key={`link-${lIdx}-${match.index}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 font-semibold underline hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    {label}
                  </a>
                );
              }
              lastIndex = match.index + match[0].length;
            }
            if (lastIndex < line.length) {
              parts.push(line.slice(lastIndex));
            }

            return (
              <div key={lIdx} className="leading-relaxed">
                {parts.map((p, pIdx) => {
                  if (typeof p === 'string') {
                    return <span key={pIdx}>{formatInlineMarkdown(p)}</span>;
                  }
                  return p;
                })}
              </div>
            );
          }

          return (
            <p key={lIdx} className="leading-relaxed">
              {formatInlineMarkdown(line)}
            </p>
          );
        })}
      </div>
    );
  };

  // If superadmin, allow picking target organization
  const [selectedOrgId, setSelectedOrgId] = useState<string>(() => {
    return currentOrganization?.id || currentUser?.organizationId || (organizations[0]?.id || '');
  });

  // Calculate active organization context
  const activeOrgId = (currentUser?.role === 'superadmin')
    ? (selectedOrgId || organizations[0]?.id || '')
    : (currentOrganization?.id || currentUser?.organizationId || '');

  const activeOrg = organizations.find(o => o.id === activeOrgId) || currentOrganization;

  // Filter messages strictly to this organization
  const visibleMessages = useMemo(() => {
    const msgs = chatMessages.filter(m => m.organizationId === activeOrgId || m.organizationId === 'all');
    if (msgs.length === 0) {
      return [
        {
          id: `msg-welcome-${activeOrgId}`,
          sender: 'assistant' as const,
          text: `Halo! Saya asisten KnowBase AI bertenaga RAG untuk **${activeOrg?.name || 'Organisasi Anda'}**. Saya siap mencari dan merangkum seluruh SOP serta dokumen resmi yang terindeks khusus di lingkungan organisasi ini.`,
          timestamp: 'Baru saja',
          organizationId: activeOrgId
        }
      ];
    }
    return msgs;
  }, [chatMessages, activeOrgId, activeOrg?.name]);

  const [inputQuestion, setInputQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [visibleMessages, isSubmitting]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isSubmitting) return;

    const q = inputQuestion;
    setInputQuestion('');
    setIsSubmitting(true);
    try {
      await sendChatMessage(q, activeOrgId);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickPrompt = async (promptText: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await sendChatMessage(promptText, activeOrgId);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Prompt suggestions strictly bound to the active organization and its uploaded documents
  const suggestions = useMemo(() => {
    if (!activeOrgId) {
      return [];
    }

    // Strict company boundary: only retrieve documents belonging specifically to this organization
    const orgDocs = (documents || []).filter(doc => doc.organizationId === activeOrgId);

    // If the company has no documents yet, return empty list (no suggestions will be shown)
    if (!orgDocs || orgDocs.length === 0) {
      return [];
    }

    // Generate questions strictly tailored to this company's real documents
    const prompts: string[] = [];

    // Add a file request shortcut so user can test direct CDN download
    const firstDoc = orgDocs[0];
    if (firstDoc) {
      const shortTitle = firstDoc.title.length > 28 ? firstDoc.title.slice(0, 26) + '...' : firstDoc.title;
      prompts.push(`Minta link unduh file ${shortTitle}`);
    }

    orgDocs.slice(0, 3).forEach((doc) => {
      const cleanTitle = doc.title.length > 35 ? doc.title.slice(0, 33) + '...' : doc.title;
      const cat = (doc.category || '').toLowerCase();

      if (cat.includes('sop') || cat.includes('prosedur')) {
        prompts.push(`Bagaimana prosedur pelaksanaan ${cleanTitle}?`);
      } else if (cat.includes('kredit') || cat.includes('keuangan')) {
        prompts.push(`Apa ketentuan dan kriteria dalam ${cleanTitle}?`);
      } else if (cat.includes('regulasi') || cat.includes('kebijakan') || cat.includes('aturan')) {
        prompts.push(`Apa saja poin penting dalam ${cleanTitle}?`);
      } else if (cat.includes('laporan') || cat.includes('kinerja')) {
        prompts.push(`Rangkum capaian dalam ${cleanTitle}`);
      } else {
        prompts.push(`Rangkum informasi utama dalam ${cleanTitle}`);
      }
    });

    return prompts;
  }, [activeOrgId, documents]);

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
                AI Assistant · {activeOrg?.name || 'Organisasi'}
              </h2>
              <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 border border-blue-200/70 dark:border-blue-800/70 px-2 py-0.5 rounded-full shrink-0">
                RAG Multi-Tenant AI
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Lingkungan terisolasi RAG: <strong className="text-slate-700 dark:text-slate-200">{activeOrg?.name || 'Organisasi'}</strong> ({((documents || []).filter(d => d.organizationId === activeOrgId)).length} Dokumen terindeks)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {currentUser?.role === 'superadmin' && (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <select
                value={activeOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="text-xs font-semibold bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
                title="Pilih Organisasi BUMD untuk Tanya AI"
              >
                {organizations.map(org => (
                  <option key={org.id} value={org.id} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
            onClick={() => clearChatHistory(activeOrgId)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-600 dark:text-rose-400 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 rounded-xl transition-all duration-150 text-xs font-semibold shadow-2xs cursor-pointer active:scale-95"
            title="Bersihkan Percakapan untuk Organisasi Ini"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bersihkan</span>
          </button>
        </div>
      </div>

      {/* Empty Document Warning Banner */}
      {((documents || []).filter(d => d.organizationId === activeOrgId)).length === 0 && (
        <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2.5 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            {currentUser?.role === 'user' ? (
              <>Organisasi <strong>{activeOrg?.name}</strong> belum memiliki dokumen resmi yang dipublikasikan oleh Administrator.</>
            ) : (
              <>Organisasi <strong>{activeOrg?.name}</strong> belum memiliki dokumen resmi yang diunggah. Kelola berkas di menu <Link to="/app/documents" className="underline font-semibold hover:text-amber-950 dark:hover:text-white">Repositori Dokumen</Link> agar AI dapat menjawab pertanyaan seputar organisasi ini.</>
            )}
          </span>
        </div>
      )}

      {/* Chat Messages Viewport */}
      <div className="flex-1 min-h-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-4 sm:p-5 overflow-y-auto space-y-5 transition-colors">
        {visibleMessages.map((msg) => (
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
                {msg.sender === 'user' ? (
                  <div className="whitespace-pre-wrap selection:bg-blue-500 selection:text-white leading-relaxed">
                    {msg.text}
                  </div>
                ) : (
                  renderMessageContent(msg.text)
                )}

                {/* Lampiran Multi-Dokumen: foto dirender langsung, dokumen/file sebagai kartu */}
                {msg.sender === 'assistant' && msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-3 space-y-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Paperclip className="w-3 h-3" />
                      <span>Lampiran ({msg.attachments.length})</span>
                    </div>
                    {msg.attachments.map(att => att.type === 'image' ? (
                      <a
                        key={att.id}
                        href={att.downloadUrl || att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group/att"
                        title={`Buka ${att.title} di tab baru`}
                      >
                        <img
                          src={att.url}
                          alt={att.title}
                          loading="lazy"
                          className="max-w-full sm:max-w-sm max-h-72 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm group-hover/att:shadow-md group-hover/att:scale-[1.01] transition-all cursor-pointer bg-slate-50 dark:bg-slate-900 object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            const cdnMatch = (att.url || '').match(/\/view\/([a-zA-Z0-9_-]+)/);
                            if (cdnMatch && !target.src.includes('api-cdn.kroombox.com')) {
                              target.src = `https://api-cdn.kroombox.com/api/bridge/view/${cdnMatch[1]}`;
                            }
                          }}
                        />
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-1">{att.title} · klik untuk perbesar</span>
                      </a>
                    ) : (
                      <a
                        key={att.id}
                        href={att.downloadUrl || att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition-all group/att"
                      >
                        <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold text-[9px]">
                          {(att.fileType || 'FILE').slice(0, 4)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{att.title}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">
                            {att.fileType} {att.sizeKb ? `· ${att.sizeKb} KB` : ''}
                          </div>
                        </div>
                        <Download className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover/att:text-blue-600 dark:group-hover/att:text-blue-400 shrink-0 transition-colors" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Real RAG Source Documents & Citations */}
                {msg.sender === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-blue-500" />
                        <span>Sumber Dokumen Terkait ({msg.sources.length}):</span>
                      </span>
                      <span className="text-[9px] text-blue-600 dark:text-blue-400 font-medium">Tersedia</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((src, idx) => {
                        const matchedDoc = (documents || []).find(
                          d => d.id === src.documentId || d.title.toLowerCase() === src.documentTitle.toLowerCase()
                        );
                        return (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/50 text-[11px] text-blue-800 dark:text-blue-300 font-medium shadow-2xs group"
                          >
                            <span className="truncate max-w-[200px] font-semibold">{src.documentTitle}</span>
                            {src.page && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-800/60 px-1 py-0.5 rounded">
                                Hal. {src.page}
                              </span>
                            )}
                            {src.similarityScore && (
                              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                                {Math.round(src.similarityScore * 100)}%
                              </span>
                            )}
                            {matchedDoc && (
                              <button
                                type="button"
                                onClick={() => setSelectedDocForViewer(matchedDoc)}
                                className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline cursor-pointer ml-1"
                                title="Buka Dokumen"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Buka</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Assistant footer toolbar */}
                {msg.sender === 'assistant' && (
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/50">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>RAG Terverifikasi</span>
                      </span>
                      {msg.model && (
                        <span className="hidden sm:inline text-[10px] font-mono text-slate-400 dark:text-slate-500">
                          {msg.model}
                        </span>
                      )}
                    </div>
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
