import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/common/StatCard';
import { UploadDocumentModal } from '../components/common/UploadDocumentModal';
import { downloadProtectedFile, API_BASE_URL } from '../services/api';
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
  Download,
  AlertTriangle,
  Copy,
  Check,
  Code,
  Terminal,
  BookOpen,
  Layers,
  Edit3
} from 'lucide-react';
import { EditDocumentModal } from '../components/common/EditDocumentModal';
import { DocumentItem } from '../types';

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
    updateOrganization,
    updateDocument
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'documents' | 'knowledge-base' | 'activity' | 'settings'>('overview');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [copiedKb, setCopiedKb] = useState(false);
  const [codeLang, setCodeLang] = useState<'curl' | 'js' | 'python'>('curl');

  // Target org
  const org = organizations.find(o => o.id === id) || organizations[0];
  if (!org) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <p className="text-sm text-slate-500">Project tidak ditemukan.</p>
        <Link to="/app/projects" className="mt-3 inline-block text-xs font-semibold text-blue-600">
          Kembali ke Daftar Project
        </Link>
      </div>
    );
  }

  const orgDocs = documents.filter(d => 
    d.organizationId === org.id && 
    (currentUser?.role !== 'user' || d.uploaderRole === 'user' || !d.uploaderRole || d.uploadedById === currentUser.id)
  );
  const orgChunks = chunks.filter(c => c.organizationId === org.id);
  const orgUsers = users.filter(u => u.organizationId === org.id);
  const orgLogs = activityLogs.filter(l => l.organizationId === org.id);

  // Settings form states
  const [orgDesc, setOrgDesc] = useState(org.description || '');
  const [orgSector, setOrgSector] = useState(org.sector || '');
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
          to={currentUser?.role === 'admin' ? '/admin/projects' : '/app/projects'} 
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Daftar Project
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-700 to-indigo-800 dark:from-slate-800 dark:to-slate-700 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
              {(org.code || 'ORG').slice(0, 3)}
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
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'documents', label: `Dokumen & Berkas (${orgDocs.length})` },
          { key: 'knowledge-base', label: 'Knowledge Base & AI' },
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
              label="Knowledge Chunks"
              value={org.chunksCount || orgChunks.length}
              change="Basis pengetahuan"
              icon={Cpu}
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
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Profil & Mandat Project</h3>
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

            {/* Knowledge Base & RAG Status Box */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Knowledge Base & AI</span>
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
                  Aktif
                </span>
              </div>

              {/* Exact Knowledge base code badge */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Knowledge base
                </span>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-mono font-bold text-blue-700 dark:text-blue-300">
                    {org.knowledgeBase || ('kb_' + (org.code || 'utama').toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                  </code>
                  <button
                    onClick={() => {
                      const kb = org.knowledgeBase || ('kb_' + (org.code || 'utama').toLowerCase().replace(/[^a-z0-9_]/g, '_'));
                      navigator.clipboard.writeText(kb);
                      setCopiedKb(true);
                      setTimeout(() => setCopiedKb(false), 2000);
                    }}
                    className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                    title="Salin Kode Knowledge Base"
                  >
                    {copiedKb ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pemisah dokumen dalam satu tenant.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Isolasi Data</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">Ketat (Zero-Leakage)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Isolasi Knowledge Base</span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">Khusus Project Ini</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Terdaftar Sejak</span>
                  <span className="text-slate-700 dark:text-slate-300 tabular-nums">{org.createdAt}</span>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('knowledge-base')}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-center cursor-pointer block border border-blue-200/50 dark:border-blue-800/40"
              >
                Lihat Panduan & Integrasi AI →
              </button>
            </div>
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
                      {doc.category} · {doc.year} · {Math.round(doc.fileSizeKb / 1024 * 10) / 10} MB
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setSelectedDocForViewer(doc)}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-md cursor-pointer"
                    title="Buka Viewer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingDoc(doc)}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 rounded-md cursor-pointer"
                    title="Edit Metadata Dokumen"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const targetUrl = `${API_BASE_URL}/documents/${doc.id}/download`;
                      const ext = (doc.fileType || 'PDF').toLowerCase();
                      const filename = `${doc.title}.${ext}`;
                      downloadProtectedFile(targetUrl, filename, doc.id)
                        .catch(err => alert(err.message || 'Gagal mengunduh dokumen.'));
                    }}
                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md cursor-pointer"
                    title="Unduh Berkas"
                  >
                    <Download className="w-4 h-4" />
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

      {/* TAB: KNOWLEDGE BASE & AI */}
      {activeTab === 'knowledge-base' && (
        <div className="space-y-6">
          {/* Main Knowledge Base Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200/50 dark:border-blue-800/50">
                  RAG Multi-Tenant Architecture
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                  Knowledge Base Project: {org.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Identitas ruang kerja partisi embedding untuk seluruh dokumen dan kueri kecerdasan buatan (AI) di project ini.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Isolasi Terverifikasi</span>
                </span>
              </div>
            </div>

            {/* Knowledge base Code Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Knowledge base
                </span>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                  Tenant Scoped
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700">
                <code className="text-sm sm:text-base font-mono font-bold text-blue-600 dark:text-blue-400 select-all">
                  {org.knowledgeBase || ('kb_' + (org.code || 'utama').toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                </code>
                <button
                  onClick={() => {
                    const kb = org.knowledgeBase || ('kb_' + (org.code || 'utama').toLowerCase().replace(/[^a-z0-9_]/g, '_'));
                    navigator.clipboard.writeText(kb);
                    setCopiedKb(true);
                    setTimeout(() => setCopiedKb(false), 2000);
                  }}
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

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pemisah dokumen dalam satu tenant.
              </p>
            </div>
          </div>

          {/* Explanation & Usage Guide Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Otomatis Saat Upload Berkas
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Setiap dokumen (PDF, Word, Excel, TXT, dsb.) yang Anda unggah ke project ini secara otomatis dimasukkan ke partisi <code className="text-blue-600 dark:text-blue-400">{org.knowledgeBase || 'kb_utama'}</code> tanpa konfigurasi manual.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Isolasi Total (Zero-Leakage)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Dokumen Anda memiliki pembatas partisi data yang ketat. Anggota atau AI dari project lain tidak dapat membaca, mencari, maupun mengintip isi berkas project ini.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Sinkronisasi Berkas ke RAG
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Seluruh berkas project ini dapat dikirim ulang ke Knowledge Base-nya lewat panel RAG project, sehingga indeks di server RAG selalu sinkron dengan dokumen terbaru.
              </p>
            </div>
          </div>

          {/* Developer / External Integration Guide */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Contoh Penggunaan API / Integrasi Eksternal
                </h3>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                {(['curl', 'js', 'python'] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setCodeLang(lang)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors uppercase ${
                      codeLang === lang 
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Jika Anda ingin menghubungkan WhatsApp Bot, Telegram Bot, atau aplikasi pihak ketiga ke Knowledge Base project ini, gunakan parameter <code className="text-blue-600 dark:text-blue-400">knowledge_base_id</code>:
            </p>

            <div className="relative rounded-xl overflow-hidden bg-slate-950 text-slate-100 p-4 font-mono text-[11px] sm:text-xs leading-relaxed overflow-x-auto border border-slate-800">
              <button
                onClick={() => {
                  const kb = org.knowledgeBase || ('kb_' + (org.code || 'utama').toLowerCase().replace(/[^a-z0-9_]/g, '_'));
                  let codeToCopy = '';
                  if (codeLang === 'curl') {
                    codeToCopy = `curl -X POST https://rag.aiones.app/api/v1/query \\\n  -H "Authorization: Bearer <API_KEY>" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "query": "Jelaskan ringkasan dokumen resmi ini",\n    "knowledge_base_id": "${kb}"\n  }'`;
                  } else if (codeLang === 'js') {
                    codeToCopy = `const res = await fetch("https://rag.aiones.app/api/v1/query", {\n  method: "POST",\n  headers: {\n    "Authorization": "Bearer <API_KEY>",\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify({\n    query: "Jelaskan ringkasan dokumen resmi ini",\n    knowledge_base_id: "${kb}"\n  })\n});\nconst data = await res.json();\nconsole.log(data.data.answer);`;
                  } else {
                    codeToCopy = `import requests\n\nres = requests.post(\n    "https://rag.aiones.app/api/v1/query",\n    headers={\n        "Authorization": "Bearer <API_KEY>",\n        "Content-Type": "application/json"\n    },\n    json={\n        "query": "Jelaskan ringkasan dokumen resmi ini",\n        "knowledge_base_id": "${kb}"\n    }\n)\nprint(res.json()["data"]["answer"])`;
                  }
                  navigator.clipboard.writeText(codeToCopy);
                  setCopiedKb(true);
                  setTimeout(() => setCopiedKb(false), 2000);
                }}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                title="Salin Kode"
              >
                {copiedKb ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {codeLang === 'curl' && (
                <pre>{`curl -X POST https://rag.aiones.app/api/v1/query \\
  -H "Authorization: Bearer <API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "Jelaskan ringkasan dokumen resmi ini",
    "knowledge_base_id": "${org.knowledgeBase || ('kb_' + (org.code || 'utama').toLowerCase().replace(/[^a-z0-9_]/g, '_'))}"
  }'`}</pre>
              )}

              {codeLang === 'js' && (
                <pre>{`const res = await fetch("https://rag.aiones.app/api/v1/query", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <API_KEY>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    query: "Jelaskan ringkasan dokumen resmi ini",
    knowledge_base_id: "${org.knowledgeBase || ('kb_' + (org.code || 'utama').toLowerCase().replace(/[^a-z0-9_]/g, '_'))}"
  })
});
const data = await res.json();
console.log(data.data.answer);`}</pre>
              )}

              {codeLang === 'python' && (
                <pre>{`import requests

res = requests.post(
    "https://rag.aiones.app/api/v1/query",
    headers={
        "Authorization": "Bearer <API_KEY>",
        "Content-Type": "application/json"
    },
    json={
        "query": "Jelaskan ringkasan dokumen resmi ini",
        "knowledge_base_id": "${org.knowledgeBase || ('kb_' + (org.code || 'utama').toLowerCase().replace(/[^a-z0-9_]/g, '_'))}"
    }
)
print(res.json()["data"]["answer"])`}</pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Riwayat Log Project</h3>
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
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Pengaturan Project</h3>
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Perubahan profil project berhasil disimpan.
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Project</label>
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
          {currentUser?.role === 'admin' && (
            <div className="pt-5 border-t border-slate-200 dark:border-slate-800 mt-6 space-y-3">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                <h4 className="text-xs font-semibold uppercase tracking-wider">Zona Berbahaya</h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Menghapus project akan menghapus seluruh repositori dokumen, indeks AI, dan keanggotaan. {currentUser?.role === 'admin' ? 'Setelah dihapus, kuota pembuatan project Anda akan direset (0/1) sehingga Anda dapat membuat 1 project baru lagi.' : ''}
              </p>
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="px-3.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Project {org.name}</span>
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
                Hapus Project {org.name}?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Tindakan ini tidak dapat dibatalkan. Seluruh data project dan dokumen SOP akan dihapus secara permanen.
              </p>
              {currentUser?.role === 'admin' && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 text-left mt-2 leading-relaxed">
                  <strong>Reset Kuota 1 Project:</strong> Kuota akun Admin Anda akan direset kembali menjadi <strong>0/1</strong>, dan Anda dapat <strong>langsung membuat 1 project baru</strong>.
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
                  navigate('/app/projects');
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Project</span>
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

      {/* Edit Document Modal */}
      <EditDocumentModal 
        isOpen={!!editingDoc}
        document={editingDoc}
        onClose={() => setEditingDoc(null)}
        onSave={async (docId, updates) => {
          await updateDocument(docId, updates);
        }}
      />
    </div>
  );
};
