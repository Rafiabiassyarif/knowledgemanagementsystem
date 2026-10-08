import React from 'react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  FileText,
  Users,
  Database,
  HardDrive,
  ArrowRight,
  Activity,
  CheckCircle2
} from 'lucide-react';

/**
 * Dashboard khusus Admin: ringkasan SELURUH project, pengguna, dan dokumen platform.
 */
export const AdminDashboardPage: React.FC = () => {
  const { currentUser, organizations = [], users = [], documents = [], activityLogs = [] } = useApp();

  const totalProjects = organizations.length;
  const totalDocs = documents.length;
  const totalUsers = users.length;
  const totalChunks = organizations.reduce((acc, o) => acc + (o.chunksCount || 0), 0);
  const totalStorageMb = Math.round(documents.reduce((acc, d) => acc + (d.fileSizeKb || 0), 0) / 1024 * 10) / 10;

  const stats = [
    { label: 'Total Project', value: totalProjects, icon: FolderKanban, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/40' },
    { label: 'Total Dokumen', value: totalDocs, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    { label: 'Total Pengguna', value: totalUsers, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/40' },
    { label: 'Total Chunk RAG', value: totalChunks, icon: Database, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  ];

  const recentLogs = activityLogs.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Overview Platform
          </h1>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            ADMIN
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Selamat datang, <strong>{currentUser?.name}</strong>. Anda mengelola seluruh {totalProjects} project di platform ini.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4.5 h-4.5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{s.value}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Storage + quick actions */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <HardDrive className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Penyimpanan</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalStorageMb} MB</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Total berkas terindeks di seluruh project</p>
        </div>

        <div className="lg:col-span-2 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Akses Cepat</span>
          <div className="grid sm:grid-cols-3 gap-2 mt-3">
            {[
              { to: '/admin/projects', label: 'Kelola Project', icon: FolderKanban },
              { to: '/admin/users', label: 'Kelola Pengguna', icon: Users },
              { to: '/admin/cdn', label: 'CDN & RAG', icon: HardDrive },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.to}
                  to={a.to}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">{a.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Project list */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Semua Project ({totalProjects})</span>
          </div>
          <Link to="/admin/projects" className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
            Kelola <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
          {organizations.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-slate-400">Belum ada project.</p>
          ) : (
            organizations.map((o) => (
              <Link
                key={o.id}
                to={`/admin/projects/${o.id}`}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="min-w-0 pr-3">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{o.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{o.code} · {o.type}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{o.documentsCount || 0}</span>
                  <span className="flex items-center gap-1"><Database className="w-3 h-3" />{o.chunksCount || 0}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Aktivitas Terbaru</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentLogs.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-slate-400">Belum ada aktivitas.</p>
          ) : (
            recentLogs.map((l) => (
              <div key={l.id} className="flex items-start gap-3 px-4 py-2.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-700 dark:text-slate-200">
                    <strong className="font-semibold">{l.actorName}</strong> — {l.action}
                  </p>
                  <p className="text-[10px] text-slate-400">{l.target} · {l.timestamp}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
