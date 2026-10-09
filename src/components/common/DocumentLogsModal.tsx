import React, { useState, useEffect } from 'react';
import { DocumentItem, DocumentLogItem } from '../../types';
import { api } from '../../services/api';
import {
  X,
  Eye,
  Sparkles,
  Download,
  Clock,
  Activity,
  FileText,
  User,
  Shield,
  Bot,
  Calendar,
  Layers,
  ArrowDownToLine,
  RefreshCw
} from 'lucide-react';

interface DocumentLogsModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentLogsModal: React.FC<DocumentLogsModalProps> = ({
  document: doc,
  isOpen,
  onClose
}) => {
  const [logs, setLogs] = useState<DocumentLogItem[]>([]);
  const [metrics, setMetrics] = useState<{
    viewCount: number;
    usageCount: number;
    lastAccessedAt: string | null;
  }>({
    viewCount: 0,
    usageCount: 0,
    lastAccessedAt: null
  });
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'view' | 'ai_query' | 'download'>('all');

  useEffect(() => {
    if (isOpen && doc?.id) {
      loadLogs();
    }
  }, [isOpen, doc?.id]);

  const loadLogs = async () => {
    if (!doc?.id) return;
    setLoading(true);
    try {
      const res = await api.documents.getLogs(doc.id);
      if (res && res.success) {
        setLogs(res.logs || []);
        setMetrics({
          viewCount: res.metrics?.viewCount ?? doc.viewCount ?? 0,
          usageCount: res.metrics?.usageCount ?? doc.usageCount ?? 0,
          lastAccessedAt: res.metrics?.lastAccessedAt ?? doc.lastAccessedAt ?? null
        });
      }
    } catch (err) {
      console.error('[LOAD DOC LOGS ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !doc) return null;

  const filteredLogs = logs.filter(l => {
    if (filterType === 'all') return true;
    if (filterType === 'view') return l.actionType === 'view' || l.actionType === 'preview';
    if (filterType === 'ai_query') return l.actionType === 'ai_query';
    if (filterType === 'download') return l.actionType === 'download';
    return true;
  });

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Belum pernah diakses';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const getActionBadge = (type: string) => {
    switch (type) {
      case 'view':
      case 'preview':
        return {
          icon: Eye,
          label: 'Dilihat',
          bg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60'
        };
      case 'ai_query':
        return {
          icon: Sparkles,
          label: 'Referensi AI RAG',
          bg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/60'
        };
      case 'download':
        return {
          icon: ArrowDownToLine,
          label: 'Diunduh',
          bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
        };
      default:
        return {
          icon: Activity,
          label: 'Akses Dokumen',
          bg: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 sm:gap-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {doc.fileType || 'DOKUMEN'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {doc.organizationName || 'Proyek'} · {doc.category}
              </span>
            </div>
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white truncate">
              {doc.title}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Log Riwayat Penggunaan & Audit Akses Knowledge Base</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={loadLogs}
              disabled={loading}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Perbarui Log"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3 Metric Summary Cards */}
        <div className="p-3.5 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          {/* 1. Total Dilihat */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Eye className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-blue-700 dark:text-blue-300">
                Total Dilihat User
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {metrics.viewCount} <span className="text-xs font-normal text-slate-500">kali</span>
              </div>
            </div>
          </div>

          {/* 2. Total Digunakan AI RAG */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                Digunakan AI (RAG)
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">
                {metrics.usageCount} <span className="text-xs font-normal text-slate-500">kali</span>
              </div>
            </div>
          </div>

          {/* 3. Terakhir Diakses */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                Terakhir Diakses
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
                {formatDate(metrics.lastAccessedAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="px-3.5 sm:px-5 pt-3 pb-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5 no-scrollbar scroll-smooth">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Semua ({logs.length})
            </button>
            <button
              onClick={() => setFilterType('view')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 shrink-0 ${
                filterType === 'view'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Eye className="w-3 h-3" /> Dilihat
            </button>
            <button
              onClick={() => setFilterType('ai_query')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 shrink-0 ${
                filterType === 'ai_query'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3 h-3" /> AI / RAG
            </button>
            <button
              onClick={() => setFilterType('download')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 shrink-0 ${
                filterType === 'download'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Download className="w-3 h-3" /> Diunduh
            </button>
          </div>

          <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline-block shrink-0 ml-2">
            {filteredLogs.length} riwayat tercatat
          </span>
        </div>

        {/* Log Entries List */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-2.5">
          {loading && logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-blue-500" />
              Memuat log penggunaan dokumen...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <Activity className="w-10 h-10 mx-auto stroke-1 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Belum ada riwayat aktivitas</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Aktivitas melihat pratinjau, obrolan AI RAG, dan unduhan akan otomatis tercatat di sini.
              </p>
            </div>
          ) : (
            filteredLogs.map((item) => {
              const badge = getActionBadge(item.actionType);
              const BadgeIcon = badge.icon;
              return (
                <div 
                  key={item.id} 
                  className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div className={`p-2 rounded-lg shrink-0 border ${badge.bg}`}>
                    <BadgeIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.userName}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                          item.userRole === 'admin' 
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' 
                            : item.userRole === 'system'
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          {item.userRole.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 tabular-nums">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {item.notes || 'Aktivitas dokumen'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 text-xs">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Sistem Audit Trail KMS BUMD & Kroombox RAG Engine
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
