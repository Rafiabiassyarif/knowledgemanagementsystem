import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  FileText, 
  Sparkles, 
  Users, 
  Building2, 
  ShieldCheck,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';

export const ActivityPage: React.FC = () => {
  const { 
    activityLogs, 
    currentUser, 
    currentOrganization, 
    clearActivityLogs, 
    deleteActivityLog 
  } = useApp();

  if (currentUser?.role === 'user') {
    return <Navigate to="/app" replace />;
  }

  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleClearAll = () => {
    clearActivityLogs();
    setConfirmClearOpen(false);
    showToast('Seluruh riwayat log aktivitas berhasil dibersihkan.');
  };

  const handleDeleteItem = (id: string, actionName: string) => {
    deleteActivityLog(id);
    showToast(`Catatan "${actionName}" telah dihapus.`);
  };

  const displayLogs = currentUser?.role === 'superadmin'
    ? activityLogs
    : activityLogs.filter(l => l.organizationId === currentUser?.organizationId || !l.organizationId);

  const filteredLogs = displayLogs.filter(log => {
    const matchType = filterType === 'all' || log.type === filterType;
    const matchSearch = log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.organizationName && log.organizationName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchType && matchSearch;
  });

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'ai':
        return <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'user':
        return <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'organization':
        return <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Audit Trail & Log Aktivitas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {currentUser?.role === 'superadmin'
              ? 'Pencatatan real-time interaksi berkas, kueri RAG, dan perubahan hak akses lintas project.'
              : `Log aktivitas internal untuk repositori dokumen & kueri AI project ${currentOrganization?.name || ''}.`}
          </p>
        </div>

        {/* Clear Logs Action Button */}
        {displayLogs.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmClearOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:text-rose-800 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl border border-rose-200/80 dark:border-rose-900/60 transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer self-start sm:self-auto"
            title="Bersihkan seluruh riwayat log aktivitas"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Bersihkan Riwayat Log</span>
          </button>
        )}
      </div>

      {/* Storage & Performance Notice */}
      <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>
            <strong>Otomatisasi Memori Ringan:</strong> Riwayat sistem dibatasi maksimal <strong>50 catatan terbaru</strong> agar performa hosting & server tetap cepat dan tidak membebani memori.
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0 ml-2 hidden sm:inline">
          {displayLogs.length} Tersimpan
        </span>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari aktor, nama dokumen, atau jenis aktivitas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
          >
            <option value="all">Semua Tipe Aktivitas</option>
            <option value="document">Dokumen & Ingesti</option>
            <option value="ai">Kueri RAG AI</option>
            <option value="user">Pengguna & Akses</option>
            <option value="organization">Organisasi</option>
            <option value="security">Keamanan & Sistem</option>
          </select>
          <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums shrink-0 font-medium">
            {filteredLogs.length} Catatan
          </span>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {filteredLogs.map((log) => (
          <div key={log.id} className="p-3.5 flex items-start gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group">
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 shrink-0 mt-0.5 shadow-2xs">
              {getLogIcon(log.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">{log.actorName}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 uppercase">
                    {log.actorRole}
                  </span>
                  {log.organizationName && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                      · {log.organizationName}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
                    {log.timestamp}
                  </span>
                  {/* Delete individual log button on hover */}
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(log.id, log.action)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                    title="Hapus catatan log ini"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-800 dark:text-slate-200 mt-1 font-medium">
                {log.action}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 break-all">
                {log.target}
              </p>
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="py-12 px-4 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
            <Trash2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">Tidak ada riwayat aktivitas</p>
            <p className="text-[11px] text-slate-400">
              Riwayat log telah bersih atau tidak ditemukan catatan yang cocok dengan filter pencarian.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal to Clear All Logs */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Bersihkan Seluruh Riwayat Log?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Tindakan ini akan mengosongkan seluruh catatan log aktivitas sistem. Memori penyimpanan lokal dan beban server akan kembali bersih dan ringan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Ya, Bersihkan Semua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
