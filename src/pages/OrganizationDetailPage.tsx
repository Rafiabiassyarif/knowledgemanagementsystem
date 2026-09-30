import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/common/StatCard';
import { UploadDocumentModal } from '../components/common/UploadDocumentModal';
import { 
  Building2, 
  Users, 
  FileText, 
  Cpu, 
  Sparkles, 
  HardDrive, 
  ArrowLeft, 
  UploadCloud, 
  UserPlus, 
  CheckCircle2, 
  Activity, 
  Settings, 
  ShieldCheck,
  Search,
  Eye,
  Trash2,
  AlertTriangle
} from 'lucide-react';

export const OrganizationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    organizations, 
    documents, 
    chunks, 
    users, 
    activityLogs, 
    setSelectedDocForViewer, 
    deleteDocument,
    deleteOrganization,
    currentUser,
    updateOrganization
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'documents' | 'activity' | 'settings'>('overview');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Target org
  const org = organizations.find(o => o.id === id) || organizations[0];
  const orgDocs = documents.filter(d => d.organizationId === org.id);
  const orgChunks = chunks.filter(c => c.organizationId === org.id);
  const orgUsers = users.filter(u => u.organizationId === org.id);
  const orgLogs = activityLogs.filter(l => l.organizationId === org.id);

  // Settings form states
  const [orgDesc, setOrgDesc] = useState(org.description);
  const [orgSector, setOrgSector] = useState(org.sector);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrganization(org.id, {
      description: orgDesc,
      sector: orgSector
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const filteredDocs = orgDocs.filter(d => 
    d.title.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
    d.category.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
    (d.department || '').toLowerCase().includes(docSearchQuery.toLowerCase())
  );

  const filteredUsers = orgUsers.filter(u => 
    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Back button & Title lockup */}
      <div>
        <Link 
          to="/organizations" 
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Daftar Organisasi
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-700 to-indigo-800 dark:from-slate-800 dark:to-slate-700 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
              {org.code.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{org.name}</h1>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  {org.code}
                </span>
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60">
                  {org.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {org.type} · {org.sector} · {org.city}, {org.province}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="group inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm hover:shadow-md hover:shadow-blue-500/25 active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-white shrink-0 group-hover:-translate-y-0.5 transition-transform duration-200" />
              <span className="tracking-tight">Unggah Dokumen</span>
            </button>
            <Link
              to="/app/chat"
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Tanya RAG</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'users', label: `Users (${orgUsers.length})` },
          { key: 'documents', label: `Documents (${orgDocs.length})` },
          { key: 'activity', label: 'Activity' },
          { key: 'settings', label: 'Settings' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 5 Stats as requested */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard
              label="Total Users"
              value={org.usersCount}
              change="Pengguna terdaftar"
              icon={Users}
            />
            <StatCard
              label="Total Documents"
              value={org.documentsCount}
              change="SOP & Regulasi"
              icon={FileText}
            />
            <StatCard
              label="Index AI (RAG)"
              value="Otomatis"
              change="Vektor terindeks"
              icon={Cpu}
            />
            <StatCard
              label="AI Questions"
              value={org.aiQueriesCount.toLocaleString()}
              change="Kueri RAG"
              icon={Sparkles}
            />
            <StatCard
              label="Storage Used"
              value={`${(org.storageUsedMb / 1024).toFixed(1)} GB`}
              change="Batas: 25 GB"
              icon={HardDrive}
            />
          </div>

          {/* Org Profile Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Profil & Mandat Organisasi</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-lg border border-slate-100 dark:border-slate-700/60">
                {org.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Admin Penanggung Jawab</span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">{org.adminName}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{org.adminEmail}</span>
                </div>
                <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Sektor Operasional</span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">{org.sector}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{org.type}</span>
                </div>
                <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Wilayah Kerja</span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">{org.city}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{org.province}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">RAG Vector Status</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Vector Namespace</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{org.code.toLowerCase()}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Isolasi Partisi</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">Ketat (Zero-Leak)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Index Status</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">Optimal</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Terdaftar Sejak</span>
                  <span className="text-slate-700 dark:text-slate-300 tabular-nums">{org.createdAt}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari user di organisasi ini..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredUsers.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-white font-semibold flex items-center justify-center text-xs">
                    {u.avatarInitials}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">{u.name}</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{u.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                    u.role === 'admin' ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {u.role.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari dokumen di organisasi ini..."
                value={docSearchQuery}
                onChange={(e) => setDocSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="group inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm hover:shadow-md hover:shadow-blue-500/25 active:scale-[0.98] transition-all duration-200 cursor-pointer shrink-0"
            >
              <UploadCloud className="w-4 h-4 text-white shrink-0 group-hover:-translate-y-0.5 transition-transform duration-200" />
              <span className="tracking-tight">Unggah Dokumen</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredDocs.map((doc) => (
              <div key={doc.id} className="py-3 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/60 rounded-lg px-2 text-xs transition-colors">
                <div 
                  onClick={() => setSelectedDocForViewer(doc)}
                  className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center font-bold text-xs shrink-0">
                    {doc.fileType}
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900 dark:text-white truncate block hover:text-blue-600 dark:hover:text-blue-400">
                      {doc.title}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {doc.category} · {doc.year} · {doc.chunksCount} chunks
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedDocForViewer(doc)}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-md cursor-pointer"
                    title="Buka Viewer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus dokumen "${doc.title}"?`)) {
                        deleteDocument(doc.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-md cursor-pointer"
                    title="Hapus Dokumen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Riwayat Log Organisasi</h3>
          <div className="space-y-3">
            {orgLogs.map((log) => (
              <div key={log.id} className="text-xs flex items-start gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                    <span className="text-slate-900 dark:text-white">{log.actorName}</span>: {log.action}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{log.target}</p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 max-w-2xl space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Pengaturan Organisasi</h3>
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Perubahan profil organisasi berhasil disimpan.
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Organisasi</label>
              <input
                type="text"
                disabled
                value={org.name}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Deskripsi / Mandat</label>
              <textarea
                rows={3}
                value={orgDesc}
                onChange={(e) => setOrgDesc(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Sektor</label>
              <input
                type="text"
                value={orgSector}
                onChange={(e) => setOrgSector(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
            >
              Simpan Pengaturan
            </button>
          </form>

          {/* Danger Zone: Delete Organization */}
          {(currentUser?.role === 'superadmin' || (currentUser?.role === 'admin' && (currentUser.organizationId === org.id || org.adminId === currentUser.id))) && (
            <div className="pt-5 border-t border-slate-200 dark:border-slate-800 mt-6 space-y-3">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                <h4 className="text-xs font-semibold uppercase tracking-wider">Zona Berbahaya</h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Menghapus organisasi akan menghapus seluruh repositori dokumen, indeks AI, dan keanggotaan. {currentUser?.role === 'admin' ? 'Setelah dihapus, kuota pembuatan organisasi Anda akan direset (0/1) sehingga Anda dapat membuat 1 organisasi baru lagi.' : ''}
              </p>
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="px-3.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Organisasi {org.name}</span>
              </button>
            </div>
          )}
        </div>
      )}

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
                Tindakan ini tidak dapat dibatalkan. Seluruh data organisasi dan dokumen SOP akan dihapus secara permanen.
              </p>
              {currentUser?.role === 'admin' && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 text-left mt-2 leading-relaxed">
                  <strong>Reset Kuota 1 Organisasi:</strong> Kuota akun Admin Anda akan direset kembali menjadi <strong>0/1</strong>, dan Anda dapat <strong>langsung membuat 1 organisasi baru</strong>.
                </div>
              )}
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
                onClick={() => {
                  deleteOrganization(org.id);
                  setDeleteConfirmOpen(false);
                  if (currentUser?.role === 'admin') {
                    navigate('/app');
                  } else {
                    navigate('/organizations');
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Organisasi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <UploadDocumentModal 
        isOpen={uploadModalOpen} 
        onClose={() => setUploadModalOpen(false)} 
        defaultOrgId={org.id}
      />
    </div>
  );
};
