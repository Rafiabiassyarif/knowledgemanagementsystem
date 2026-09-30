import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AskAIPage } from './AskAIPage';
import { StatCard } from '../components/common/StatCard';
import { UploadDocumentModal } from '../components/common/UploadDocumentModal';
import { CreateOrgModal } from '../components/common/CreateOrgModal';
import {
  Building2,
  Users,
  FileText,
  Cpu,
  Sparkles,
  Activity,
  UploadCloud,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  Search,
  HardDrive,
  Eye,
  Clock,
  Shield,
  CheckCircle2,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  Cell
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    currentOrganization,
    organizations,
    documents,
    chunks,
    activityLogs,
    joinRequests,
    setSelectedDocForViewer,
    joinOrganization,
    leaveOrganization,
    joinOrganizationForCurrentUser,
    submitJoinRequest,
    approveJoinRequest,
    deleteOrganization
  } = useApp();

  const isUserJoined = Boolean(
    currentUser?.role === 'user' &&
    currentOrganization &&
    (currentUser?.orgJoinStatus === 'joined' || !currentUser?.orgJoinStatus)
  );

  React.useEffect(() => {
    if (isUserJoined) {
      navigate('/app/chat', { replace: true });
    }
  }, [isUserJoined, navigate]);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createOrgModalOpen, setCreateOrgModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [communitySearch, setCommunitySearch] = useState('');
  const [communityCategory, setCommunityCategory] = useState('all');
  const [joinFeedback, setJoinFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDeleteAdminOrg = () => {
    if (!currentOrganization) return;
    const orgName = currentOrganization.name;
    const res = deleteOrganization(currentOrganization.id);
    setDeleteConfirmOpen(false);
    if (res.success) {
      setJoinFeedback({
        type: 'success',
        text: `Organisasi "${orgName}" berhasil dihapus. Kuota Anda telah direset (0/1). Anda kini dapat membuat 1 organisasi baru!`
      });
    }
  };

  // Time-series mock chart data for Superadmin
  const uploadTrends = [
    { month: 'Jan', documents: 28, queries: 420 },
    { month: 'Feb', documents: 45, queries: 760 },
    { month: 'Mar', documents: 62, queries: 1100 },
    { month: 'Apr', documents: 85, queries: 1650 },
    { month: 'Mei', documents: 110, queries: 2300 },
    { month: 'Jun', documents: 140, queries: 3200 },
    { month: 'Jul', documents: 195, queries: 4100 },
    { month: 'Agt', documents: 260, queries: 4900 },
    { month: 'Sep', documents: 397, queries: 5610 },
  ];

  // Knowledge chunk distribution by Organization
  const orgKnowledgeDistribution = organizations.map(org => ({
    name: org.name.replace('Perumdam ', '').replace('PT ', ''),
    chunks: org.chunksCount,
    docs: org.documentsCount,
    users: org.usersCount
  }));

  // Filter logs for this view
  const displayLogs = currentUser?.role === 'superadmin'
    ? activityLogs.slice(0, 6)
    : activityLogs.filter(l => l.organizationId === currentUser?.organizationId || !l.organizationId).slice(0, 6);

  // Filter documents for this view
  const displayDocs = currentUser?.role === 'superadmin'
    ? documents.slice(0, 5)
    : documents.filter(d => d.organizationId === currentUser?.organizationId).slice(0, 5);

  // Calculations for Superadmin
  const totalOrgs = organizations.length;
  const totalAdmins = organizations.filter(o => o.adminId).length;
  const totalUsersCount = organizations.reduce((acc, o) => acc + o.usersCount, 0);
  const totalDocsCount = organizations.reduce((acc, o) => acc + o.documentsCount, 0);
  const totalChunksCount = organizations.reduce((acc, o) => acc + o.chunksCount, 0);
  const totalAiQueries = organizations.reduce((acc, o) => acc + o.aiQueriesCount, 0);

  // Suggested questions based on organization
  const getPromptSuggestions = () => {
    if (currentUser?.organizationId === 'org-pam-jaya') {
      return [
        'Bagaimana SOP penanganan kebocoran pipa distribusi utama (NRW)?',
        'Berapa standar kekeruhan air olahan pada IPA Pejompongan I & II?',
        'Apa formula perhitungan upah lembur darurat teknisi lapangan?'
      ];
    }
    if (currentUser?.organizationId === 'org-bank-bjb') {
      return [
        'Apa syarat pengajuan dan plafon awal kredit bjb Mesra?',
        'Bagaimana prosedur restrukturisasi kredit bagi debitur terdampak force majeure?',
        'Kapan kriteria Enhanced Due Diligence (EDD) wajib diterapkan?'
      ];
    }
    return [
      'Jelaskan SOP penanganan operasional dokumen terindeks.',
      'Bagaimana mekanisme persetujuan akses knowledge organisasi?',
      'Rangkum peraturan dan tata tertib internal terbaru.'
    ];
  };

  /* -------------------------------------------------------------
   * RENDER SUPERADMIN DASHBOARD
   * ------------------------------------------------------------- */
  if (currentUser?.role === 'superadmin') {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Monitoring jaringan organisasi, repositori knowledge, dan aktivitas RAG AI.
            </p>
          </div>
        </div>

        {/* 6 Key Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            label="Total Organisasi"
            value={totalOrgs}
            change="+2 BUMD baru"
            icon={Building2}
          />
          <StatCard
            label="Total Admin"
            value={totalAdmins}
            change="1 Admin/Org"
            icon={ShieldCheck}
          />
          <StatCard
            label="Total Users"
            value={totalUsersCount}
            change="+14 minggu ini"
            icon={Users}
          />
          <StatCard
            label="Total Dokumen"
            value={totalDocsCount}
            change="+28 terindeks"
            icon={FileText}
          />
          <StatCard
            label="Index AI (RAG)"
            value="Otomatis"
            change="Embedding aktif"
            icon={Cpu}
          />
          <StatCard
            label="AI Queries"
            value={totalAiQueries.toLocaleString()}
            change="+18% bln ini"
            icon={Sparkles}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Chart 1: Dokumen & AI Queries Trend */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Pertumbuhan Dokumen & Kueri RAG</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Volume akumulasi dokumen dan interaksi AI 2026</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                  Kueri AI
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
                  Dokumen
                </span>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={uploadTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="queryGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="queries" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#queryGrad)" />
                  <Area type="monotone" dataKey="documents" stroke="#94a3b8" strokeWidth={1.5} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Documents per Organization */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Distribusi Dokumen per BUMD</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Jumlah dokumen terunggah & terindeks AI per organisasi</p>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">{organizations.length} Organisasi</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orgKnowledgeDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  />
                  <Bar dataKey="docs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Grid: Recent Activity & Top Organizations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Organizations Directory Quick List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Status Organisasi Terdaftar</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ringkasan kuota dokumen & admin penanggung jawab</p>
              </div>
              <Link to="/organizations" className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1">
                Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {organizations.map((org) => (
                <div key={org.id} className="py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 rounded-lg px-2 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                      {org.code.slice(0, 3)}
                    </div>
                    <div className="min-w-0">
                      <Link to={`/organizations/${org.id}`} className="text-xs font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate block">
                        {org.name}
                      </Link>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                        Admin: {org.adminName} · {org.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs tabular-nums shrink-0">
                    <span className="text-slate-600 dark:text-slate-300 hidden sm:inline">{org.documentsCount} Dokumen</span>
                    <span className="text-slate-600 dark:text-slate-300 hidden sm:inline">{org.chunksCount} Chunks</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-800/60">
                      Aktif
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Global Activity */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Aktivitas Platform</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Log audit kueri & dokumen</p>
              </div>
              <Link to="/activity" className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700">
                Log Lengkap
              </Link>
            </div>

            <div className="space-y-3">
              {displayLogs.map((log) => (
                <div key={log.id} className="text-xs flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 dark:text-slate-200 font-medium leading-snug">
                      <span className="text-slate-900 dark:text-white">{log.actorName}</span>{' '}
                      <span className="text-slate-500 dark:text-slate-400 font-normal">({log.organizationName || 'Global'}):</span>{' '}
                      {log.action}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{log.target}</p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modals */}
        <CreateOrgModal isOpen={createOrgModalOpen} onClose={() => setCreateOrgModalOpen(false)} />
        <UploadDocumentModal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} />
      </div>
    );
  }

  const handleDirectJoin = (targetOrgId: string, orgName: string) => {
    const res = joinOrganization(targetOrgId);
    if (res.success) {
      setJoinFeedback({
        type: 'success',
        text: `Selamat datang di organisasi ${orgName}! Anda kini memiliki akses penuh ke repositori dokumen dan Tanya AI.`
      });
    } else {
      setJoinFeedback({ type: 'error', text: res.message });
    }
  };

  /* -------------------------------------------------------------
   * RENDER ADMIN DASHBOARD (Single Tenant Isolation)
   * ------------------------------------------------------------- */
  if (currentUser?.role === 'admin') {
    const org = currentOrganization;

    // Condition: Admin does not have an organization yet (Empty state / Onboarding)
    if (!org) {
      return (
        <div className="max-w-xl mx-auto py-8 sm:py-12 space-y-6">
          {joinFeedback && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 shadow-2xs ${joinFeedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              }`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-medium">{joinFeedback.text}</span>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-2xs">
              <Building2 className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800/70 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                <span>Hak Akses Admin · Kuota: 0/1 Organisasi Aktif</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Buat Organisasi BUMD Anda
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Superadmin telah memberikan Anda wewenang sebagai Admin. Anda dapat mendaftarkan <strong>1 organisasi BUMD</strong> untuk mulai mengelola repositori dokumen, representasi vektor RAG AI, dan keanggotaan.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setCreateOrgModalOpen(true)}
                className="group inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-slate-300 group-hover:text-white transition-colors" />
                <span className="tracking-tight">Buat Organisasi Sekarang</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-left bg-slate-50/80 dark:bg-slate-800/60 p-3.5 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5">
              <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Kebijakan Kuota Organisasi Admin:</span>
              </p>
              <p>• Setiap akun Admin dibatasi maksimal memiliki <strong>1 organisasi aktif</strong>.</p>
              <p>• Organisasi yang Anda buat dapat <strong>dihapus kapan saja</strong>. Setelah dihapus, kuota Anda otomatis kembali tersedia sehingga Anda dapat <strong>membuat organisasi baru lagi</strong>.</p>
            </div>
          </div>

          <CreateOrgModal isOpen={createOrgModalOpen} onClose={() => setCreateOrgModalOpen(false)} />
        </div>
      );
    }

    const orgDocs = documents.filter(d => d.organizationId === currentUser?.organizationId);
    const orgChunks = chunks.filter(c => c.organizationId === currentUser?.organizationId);

    return (
      <div className="space-y-6">
        {joinFeedback && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{joinFeedback.text}</span>
          </div>
        )}

        {/* Header with Organization Identity & Delete Option */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-700 to-indigo-800 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {org?.code.slice(0, 3) || 'ORG'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {org?.name || 'Organisasi Anda'}
                </h1>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700">
                  {org?.type}
                </span>
                <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800/70 px-2 py-0.5 rounded-md">
                  1/1 Organisasi Aktif
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {org?.city} · {orgDocs.length} Dokumen · {org?.usersCount || 1} Anggota
              </p>
            </div>
          </div>

          {/* Delete Organization button to free quota */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Hapus organisasi ini agar kuota kembali tersedia untuk membuat organisasi baru"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Hapus Organisasi</span>
            </button>
          </div>
        </div>

        {/* 4 Key Admin Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Dokumen"
            value={org?.documentsCount || orgDocs.length}
            change="SOP & Laporan"
            icon={FileText}
          />
          <StatCard
            label="Index AI (RAG)"
            value="Otomatis"
            change="Terindeks RAG"
            icon={Cpu}
          />
          <StatCard
            label="Anggota Aktif"
            value={org?.usersCount || 1}
            change="Hak akses terdaftar"
            icon={Users}
          />
          <StatCard
            label="Kueri RAG AI"
            value={(org?.aiQueriesCount || 0).toLocaleString()}
            change="Pertanyaan terjawab"
            icon={Sparkles}
          />
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 text-left transition-all group cursor-pointer"
          >
            <UploadCloud className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Upload Dokumen</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Ingesti PDF/DOCX otomatis ke AI</p>
          </button>

          <Link
            to="/app/users"
            className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 text-left transition-all group relative"
          >
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Kelola Anggota</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Tambah, edit, dan atur anggota</p>
          </Link>

          <Link
            to="/app/documents"
            className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 text-left transition-all group"
          >
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Repositori Dokumen</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Kelola SOP dan berkas organisasi</p>
          </Link>

          <Link
            to="/app/activity"
            className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 text-left transition-all group"
          >
            <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Log Aktivitas</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Audit interaksi dokumen & sistem</p>
          </Link>
        </div>

        {/* Recent Documents & Org Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Recent Docs */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Dokumen Terbaru {org?.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Dokumen resmi yang telah diindeks untuk RAG</p>
              </div>
              <Link to="/app/documents" className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1">
                Semua Dokumen <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {orgDocs.length > 0 ? (
                orgDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocForViewer(doc)}
                    className="py-3 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/60 rounded-lg px-2 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100 dark:border-blue-900/60">
                        {doc.fileType}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate block">
                          {doc.title}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          <span>{doc.category}</span>
                          <span>·</span>
                          <span className="tabular-nums">{doc.year}</span>
                          <span>·</span>
                          <span>{doc.chunksCount} chunks</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-slate-400 hover:text-blue-600 flex items-center gap-1 shrink-0">
                      <Eye className="w-3.5 h-3.5" />
                      Detail
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  Belum ada dokumen yang diunggah untuk {org?.name}.
                </div>
              )}
            </div>
          </div>

          {/* Org Activity */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Aktivitas Internal</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Log interaksi dokumen & AI di {org?.name}</p>

            <div className="space-y-3">
              {displayLogs.map((log) => (
                <div key={log.id} className="text-xs flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 dark:text-slate-200 font-medium leading-snug">
                      <span className="text-slate-900 dark:text-white">{log.actorName}:</span> {log.action}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{log.target}</p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <UploadDocumentModal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} />

        {/* Delete Org Confirmation Modal */}
        {deleteConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-xl space-y-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Hapus Organisasi {org.name}?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Seluruh dokumen SOP, indeks AI, dan data terkait organisasi ini akan dihapus dari platform KMS.
                </p>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 text-left mt-2 leading-relaxed">
                  <strong>Kuota Pembuatan Baru:</strong> Setelah organisasi ini dihapus, kuota Anda akan kembali menjadi <strong>0/1</strong>, sehingga Anda dapat <strong>langsung membuat 1 organisasi baru lagi</strong>.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAdminOrg}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus & Reset Kuota</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* -------------------------------------------------------------
   * RENDER REGULAR USER DASHBOARD
   * ------------------------------------------------------------- */
  const org = currentOrganization;
  const isJoined = Boolean(org && (currentUser?.orgJoinStatus === 'joined' || !currentUser?.orgJoinStatus));

  const filteredUserOrgs = organizations.filter(o => {
    const query = communitySearch.toLowerCase();
    const matchSearch = o.name.toLowerCase().includes(query) ||
      o.city.toLowerCase().includes(query) ||
      o.type.toLowerCase().includes(query) ||
      (o.description || '').toLowerCase().includes(query) ||
      (o.adminName || '').toLowerCase().includes(query);
    const matchCat = communityCategory === 'all' || o.type === communityCategory;
    return matchSearch && matchCat;
  });

  const categories = [
    { id: 'all', label: 'Semua Organisasi' },
    { id: 'BUMD Air Minum', label: 'Air Minum' },
    { id: 'BUMD Perbankan', label: 'Perbankan' },
    { id: 'BUMD Pangan & Pasar', label: 'Pangan & Pasar' },
    { id: 'BUMD Transportasi', label: 'Transportasi' },
    { id: 'BUMD Energi & Infrastruktur', label: 'Energi & Infra' },
  ];

  // Condition: USER is NOT a member of any organization yet
  if (!isJoined) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Pilih Organisasi
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bergabung ke organisasi untuk mengakses repositori dokumen dan Tanya AI.
            </p>
          </div>
        </div>

        {joinFeedback && (
          <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 text-left ${joinFeedback.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
              : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{joinFeedback.text}</span>
          </div>
        )}

        {organizations.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center max-w-md mx-auto space-y-2 mt-4">
            <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Belum ada organisasi yang tersedia.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Organisasi baru akan otomatis muncul di sini setelah dibuat oleh Admin atau Superadmin.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari organisasi berdasarkan nama BUMD, kota, atau jenis usaha..."
                  value={communitySearch}
                  onChange={(e) => setCommunitySearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Filter chips */}
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCommunityCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${communityCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Organization Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUserOrgs.length > 0 ? (
                filteredUserOrgs.map((o) => (
                  <div
                    key={o.id}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {o.code.slice(0, 3)}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                              {o.name}
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {o.city} · {o.type}
                            </p>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                        {o.description}
                      </p>

                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span><strong>{o.usersCount}</strong> Anggota</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span><strong>{o.documentsCount}</strong> Dokumen</span>
                        </div>
                        <div className="col-span-2 text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          PIC: {o.adminName || 'Admin BUMD'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDirectJoin(o.id, o.name)}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer group"
                    >
                      <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Gabung Organisasi</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="sm:col-span-2 p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tidak ada organisasi yang cocok dengan pencarian "{communitySearch}".
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Active Joined User Portal: Directly render AI interface (simple & focused)
  return <AskAIPage />;
};
