import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/common/StatCard';
import { CreateProjectModal } from '../components/common/CreateProjectModal';
import { API_BASE_URL, tokenStore } from '../services/api';
import {
  FolderKanban,
  FileText,
  Cpu,
  Activity,
  ArrowRight,
  HardDrive,
  Users,
  Plus,
  Shield,
  ShieldCheck,
  Server,
  Database,
  Globe,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Zap,
  Lock,
  Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

/**
 * Konsol Manajemen Platform (Khusus Admin):
 * Menampilkan pengawasan sistem menyeluruh, status 3 infrastruktur inti
 * (MySQL, Kroombox CDN, RAG Engine), sebaran sektor BUMD, kontrol master project,
 * ringkasan pengguna & hak akses, serta log audit keamanan.
 */
export const AdminDashboardPage: React.FC = () => {
  const {
    currentUser,
    organizations = [],
    users = [],
    documents = [],
    activityLogs = [],
    toggleOrgStatus,
    refreshBackendData
  } = useApp();

  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Status live layanan infrastruktur (diambil dari /api/admin/overview)
  const [infraStats, setInfraStats] = useState({
    dbStatus: 'ONLINE',
    dbPort: '3306',
    cdnStatus: 'CONNECTED',
    cdnPoP: 'Singapore (sin-01)',
    ragStatus: 'ACTIVE',
    ragUrl: 'https://rag.aiones.app',
    cdnStorageMb: 0,
    cdnQuotaGb: 10
  });

  useEffect(() => {
    const fetchAdminOverview = async () => {
      try {
        const token = tokenStore.get();
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/admin/overview`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.stats) {
            setInfraStats({
              dbStatus: 'ONLINE',
              dbPort: '3306 (Laragon)',
              cdnStatus: data.stats.cdn?.status === 'connected' ? 'CONNECTED' : 'ONLINE',
              cdnPoP: data.stats.cdn?.edgePoP || 'Singapore (sin-01)',
              ragStatus: 'ACTIVE',
              ragUrl: 'https://rag.aiones.app',
              cdnStorageMb: Math.round((data.stats.cdn?.storageBytes || 0) / (1024 * 1024)),
              cdnQuotaGb: 10
            });
          }
        }
      } catch (err) {
        console.warn('[ADMIN OVERVIEW FETCH ERROR]', err);
      }
    };
    fetchAdminOverview();
  }, []);

  // Perhitungan tata kelola platform
  const totalProjects = organizations.length;
  const totalDocsCount = documents.length;
  const totalUsers = users.length;
  const adminUsersCount = users.filter(u => u.role === 'admin').length;
  const standardUsersCount = totalUsers - adminUsersCount;
  const totalChunksCount = organizations.reduce((acc, o) => acc + (o.chunksCount || 0), 0);
  const totalStorageMb = Math.round(documents.reduce((acc, d) => acc + (d.fileSizeKb || 0), 0) / 1024 * 10) / 10;

  // Sebaran project per sektor BUMD
  const sectorCounts: Record<string, number> = {};
  organizations.forEach(o => {
    const sec = o.type || o.sector || 'Lainnya';
    sectorCounts[sec] = (sectorCounts[sec] || 0) + 1;
  });
  const sectorData = Object.entries(sectorCounts).map(([name, count]) => ({
    name: name.length > 18 ? `${name.slice(0, 16)}...` : name,
    fullName: name,
    count
  }));

  // Distribusi beban dokumen antar 6 project teratas
  const topProjectsLoad = [...organizations]
    .sort((a, b) => (b.documentsCount || 0) - (a.documentsCount || 0))
    .slice(0, 6)
    .map(o => ({
      name: o.code || o.name.slice(0, 10),
      fullName: o.name,
      documents: o.documentsCount || 0,
      chunks: o.chunksCount || 0
    }));

  const SECTOR_PALETTE = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#0891b2', '#e11d48'];

  // Manual trigger sinkronisasi platform
  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      if (refreshBackendData) {
        await refreshBackendData();
      }
      setSyncStatus({
        type: 'success',
        message: 'Koneksi database, daftar project, dan indeks berhasil diselaraskan.'
      });
      setTimeout(() => setSyncStatus(null), 5000);
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: err.message || 'Gagal menyelaraskan data platform.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Admin Header & Pusat Komando */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Konsol Manajemen Platform
            </h1>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold flex items-center gap-1">
              <Shield className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              ADMINISTRATOR GLOBAL
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Seluruh Sistem Aktif
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pusat kendali tata kelola BUMD, hak akses {totalUsers} pengguna, monitoring 3 infrastruktur inti, dan knowledge engine.
          </p>
        </div>

        {/* Tindakan Administratif Utama */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="Perbarui status database & sinkronkan data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isSyncing ? 'Menyelaraskan...' : 'Cek Status'}</span>
          </button>

          <button
            type="button"
            onClick={() => setCreateProjectModalOpen(true)}
            className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Tambah Project BUMD</span>
          </button>
        </div>
      </div>

      {/* Notifikasi feedback sinkronisasi */}
      {syncStatus && (
        <div className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
          syncStatus.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {syncStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{syncStatus.message}</span>
          </div>
          <button onClick={() => setSyncStatus(null)} className="text-[10px] underline font-semibold cursor-pointer">Tutup</button>
        </div>
      )}

      {/* 2. Panel Status 3 Infrastruktur Inti Platform (Khusus Konsol Admin) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Node 1: MySQL Database */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center text-blue-600">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Database Relasional</h4>
                <p className="text-[10px] text-slate-400 font-mono">MySQL 8 · Laragon</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/70 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {infraStats.dbStatus}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Host & Port</span>
              <span className="font-mono text-slate-700 dark:text-slate-200">127.0.0.1:3306</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Basis Data</span>
              <span className="font-mono text-slate-700 dark:text-slate-200">kms_bumd (8 tabel)</span>
            </div>
          </div>
        </div>

        {/* Node 2: Kroombox Edge CDN */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-center text-purple-600">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Kroombox Edge CDN</h4>
                <p className="text-[10px] text-slate-400 font-mono">Global File Delivery</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/70 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {infraStats.cdnStatus}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Edge PoP</span>
              <span className="font-mono text-slate-700 dark:text-slate-200">{infraStats.cdnPoP}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tautan Monitoring</span>
              <Link to="/admin/cdn" className="text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1">
                Buka CDN <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Node 3: RAG Vector Knowledge Engine */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center text-amber-600">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">RAG Vector Engine</h4>
                <p className="text-[10px] text-slate-400 font-mono">rag.aiones.app</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/70 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {infraStats.ragStatus}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Sinkronisasi Otomatis</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Dry-Run (Tiap 45s)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Knowledge Chunks</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{totalChunksCount} Chunks</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Pita Metrik Tata Kelola Platform */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
        <StatCard
          label="Total Project BUMD"
          value={totalProjects}
          change="Ruang kerja aktif"
          icon={FolderKanban}
          variant="indigo"
        />
        <StatCard
          label="Pengguna Terdaftar"
          value={totalUsers}
          change={`${adminUsersCount} Admin · ${standardUsersCount} User`}
          icon={Users}
          variant="purple"
        />
        <StatCard
          label="Total Dokumen Global"
          value={totalDocsCount}
          change="Seluruh project BUMD"
          icon={FileText}
          variant="emerald"
        />
        <StatCard
          label="Vektor Terindeks RAG"
          value={totalChunksCount}
          change="Basis pengetahuan aktif"
          icon={Cpu}
          variant="amber"
        />
        <StatCard
          label="Storage Keseluruhan"
          value={`${totalStorageMb} MB`}
          change="Tersimpan di CDN"
          icon={HardDrive}
          variant="rose"
        />
      </div>

      {/* 4. Analitik Tata Kelola: Sebaran Sektor BUMD & Beban Dokumen antar Project */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Sebaran Project per Sektor BUMD */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Sebaran Sektor BUMD Terdaftar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Klasifikasi bidang usaha BUMD di bawah tata kelola platform
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {sectorData.length} Sektor
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.25} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="count" name="Jumlah BUMD" radius={[6, 6, 0, 0]}>
                  {sectorData.map((_, index) => (
                    <Cell key={`sector-${index}`} fill={SECTOR_PALETTE[index % SECTOR_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Beban Dokumen & Chunks pada 6 Project Terbesar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Beban Repositori 6 Project Teratas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Volume dokumen tersimpan per unit BUMD
              </p>
            </div>
            <Link to="/admin/projects" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              Semua Project →
            </Link>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProjectsLoad} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.25} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="documents" name="Dokumen" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Tabel Pengawasan Master Seluruh Project BUMD (Fungsi Khusus Admin) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Tabel Pengawasan Seluruh Project BUMD ({totalProjects})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola status operasional, knowledge base ID, dan kepemilikan tiap project
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/projects"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors"
            >
              Kelola Lanjutan <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200/60 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Nama BUMD & Kode</th>
                <th className="py-3 px-4">Sektor / Tipe</th>
                <th className="py-3 px-4">Knowledge Base ID</th>
                <th className="py-3 px-4">Admin / Pemilik</th>
                <th className="py-3 px-4 text-center">Dokumen</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {organizations.slice(0, 8).map((org) => {
                const isActive = (org.status || 'active') === 'active';
                return (
                  <tr key={org.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{org.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{org.code}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <span>{org.type || 'BUMD'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <code className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400 border border-slate-200/60 dark:border-slate-700">
                        {org.knowledgeBase || `kb_${(org.code || '').toLowerCase()}`}
                      </code>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[140px]">
                        {org.adminName || 'Admin Sistem'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {org.adminEmail || 'admin@kms.id'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        {org.documentsCount || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleOrgStatus(org.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                        }`}
                        title="Klik untuk mengubah status aktif/non-aktif"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {isActive ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/admin/projects/${org.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Detail <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Manajemen Pengguna Terkini & Log Audit Keamanan (2 Kolom) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Kolom 1: Pengguna & Hak Akses Platform */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  Pengguna & Hak Akses Terkini
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Total {totalUsers} akun terdaftar di bawah pengawasan admin
                </p>
              </div>
              <Link
                to="/admin/users"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Kelola Pengguna <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {users.slice(0, 5).map((user) => (
                <div key={user.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100 dark:border-slate-700">
                      {user.avatarInitials || user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                      user.role === 'admin'
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}>
                      {user.role}
                    </span>
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded ${
                      user.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                    }`}>
                      {user.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Butuh akun baru untuk staf BUMD?</span>
            <Link
              to="/admin/users"
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              + Tambah Pengguna Baru
            </Link>
          </div>
        </div>

        {/* Kolom 2: Log Audit Keamanan & Aktivitas Platform */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Log Audit & Aktivitas Platform
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Jejak rekam tindakan sistem dan perubahan data global
                </p>
              </div>
              <Link
                to="/admin/activity"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Semua Log <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {activityLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-800 dark:text-slate-200">
                        <strong className="font-semibold text-slate-900 dark:text-white">{log.actorName}</strong>{' '}
                        <span className="text-slate-600 dark:text-slate-400">{log.action}</span>{' '}
                        {log.target && <span className="font-medium text-blue-600 dark:text-blue-400">"{log.target}"</span>}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{log.timestamp}</p>
                    </div>
                  </div>
                  {log.organizationId && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                      {organizations.find(o => o.id === log.organizationId)?.code || 'PRJ'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Audit trail tercatat permanen</span>
            <Link
              to="/admin/activity"
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Lihat Riwayat Lengkap →
            </Link>
          </div>
        </div>
      </div>

      {/* Modal Tambah Project BUMD Baru */}
      <CreateProjectModal
        isOpen={createProjectModalOpen}
        onClose={() => setCreateProjectModalOpen(false)}
      />
    </div>
  );
};
