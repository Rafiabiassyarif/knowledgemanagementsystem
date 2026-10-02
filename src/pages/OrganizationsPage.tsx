import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CreateProjectModal } from '../components/common/CreateProjectModal';
import { EditOrgModal } from '../components/common/EditOrgModal';
import { 
  Building2, 
  FolderKanban, 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit3, 
  ShieldCheck, 
  Cpu, 
  PowerOff,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Trash2,
  FileText,
  Activity,
  Layers,
  Check,
  HardDrive,
  AlertTriangle,
  Sparkles,
  Copy
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { OrgType, Organization } from '../types';
import { RagConnectionModal } from '../components/common/RagConnectionModal';

export const OrganizationsPage: React.FC = () => {
  const { organizations, toggleOrgStatus, currentUser, deleteOrganization, currentOrganization, switchProject } = useApp();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);
  const [ragModalOrg, setRagModalOrg] = useState<Organization | null>(null);
  const [copiedKbId, setCopiedKbId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const navigate = useNavigate();

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  const orgTypes = [
    'All Types',
    'BUMD Air Minum',
    'BUMD Perbankan',
    'BUMD Pangan & Pasar',
    'BUMD Transportasi',
    'BUMD Energi & Infrastruktur'
  ];

  const filteredOrgs = organizations.filter(org => {
    const q = (searchQuery || '').toLowerCase();
    const matchSearch = (org.name || '').toLowerCase().includes(q) ||
      (org.code || '').toLowerCase().includes(q) ||
      (org.adminName || '').toLowerCase().includes(q) ||
      (org.city || '').toLowerCase().includes(q);

    const matchType = selectedType === 'all' || selectedType === 'All Types' || org.type === selectedType;
    const matchStatus = selectedStatus === 'all' || org.status === selectedStatus;

    return matchSearch && matchType && matchStatus;
  });

  const totalDocuments = organizations.reduce((acc, o) => acc + (o.documentsCount || 0), 0);
  const totalUsers = organizations.reduce((acc, o) => acc + (o.usersCount || 0), 0);
  const activeOrgs = organizations.filter(o => o.status === 'active').length;
  const inactiveOrgs = organizations.length - activeOrgs;

  return (
    <div className="space-y-6">
      {/* Page Header with distinct Admin vs User branding */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-md ${
              isAdmin 
                ? 'bg-blue-600 shadow-blue-500/20' 
                : 'bg-indigo-600 shadow-indigo-500/20'
            }`}>
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Manajemen Project
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                  isAdmin
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                }`}>
                  {isAdmin ? 'Mode Admin' : 'Mode Pengguna'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ruang lingkup pengelolaan dokumen, galeri foto, dan basis pengetahuan terisolasi per organisasi.
              </p>
            </div>
          </div>
        </div>

        {/* Create Project Button (Bisa diakses oleh semua pengguna) */}
        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="group inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow active:scale-[0.98] self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-blue-200 group-hover:text-white transition-colors" />
          <span className="tracking-tight">Buat Project Baru</span>
        </button>
      </div>

      {/* Top Supervisory Executive Cards - KHUSUS HALAMAN ADMIN */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Project</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FolderKanban className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
              {organizations.length}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Ruang kerja aktif di KMS</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status Keaktifan</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{activeOrgs}</span>
              <span className="text-xs text-slate-400">Aktif</span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-lg font-bold text-rose-500 tabular-nums">{inactiveOrgs}</span>
              <span className="text-xs text-slate-400">Nonaktif</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Dapat diatur lewat switch status</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Berkas & Dokumen</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
              {totalDocuments}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Tersimpan aman di cloud</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kapasitas Penyimpanan</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <HardDrive className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
              Multi-Region
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Global Point-of-Presence</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari project berdasarkan nama, kode unik, pemilik, atau kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
          >
            {orgTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Project</th>
              <th className="py-3 px-4">Knowledge Base (RAG)</th>
              <th className="py-3 px-4">Kategori & Sektor</th>
              <th className="py-3 px-4">Pemilik Project</th>
              <th className="py-3 px-4 text-right">Dokumen & Berkas</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Dibuat</th>
              <th className="py-3 px-4 text-center">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-300">
                    <span>Aksi</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-950 font-bold border border-blue-200 dark:border-blue-800">
                      ADMIN
                    </span>
                  </span>
                ) : (
                  <span>Aksi</span>
                )}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
            {filteredOrgs.length > 0 ? (
              filteredOrgs.map((org) => (
              <tr key={org.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/70 transition-colors">
                {/* Project */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-slate-700 to-indigo-800 dark:from-slate-800 dark:to-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {(org.code || 'PRJ').slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link 
                          to={`/app/projects/${org.id}`}
                          className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                        >
                          {org.name}
                        </Link>
                        {currentOrganization?.id === org.id && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            Aktif
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                          {org.code || '-'} · {org.type || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Knowledge Base & RAG Connection Column */}
                <td className="py-3.5 px-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <code className="text-[11px] font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2 py-0.5 rounded border border-blue-200/80 dark:border-blue-800/80 shadow-xs">
                        {org.knowledgeBase || ('kb_' + (org.code || 'utama').toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                      </code>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const kb = org.knowledgeBase || ('kb_' + (org.code || 'utama').toLowerCase().replace(/[^a-z0-9_]/g, '_'));
                          navigator.clipboard.writeText(kb);
                          setCopiedKbId(org.id);
                          setTimeout(() => setCopiedKbId(null), 2000);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Salin Kode Knowledge Base"
                      >
                        {copiedKbId === org.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRagModalOrg(org)}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer w-fit group"
                      title="Buka status koneksi dan sinkronisasi RAG"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="group-hover:underline">Connect ke RAG</span>
                      <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                    </button>
                  </div>
                </td>

                {/* Type */}
                <td className="py-3.5 px-4">
                  <span className="font-medium text-slate-800 dark:text-slate-200 block">{org.type}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">{org.sector || '-'}</span>
                </td>

                {/* Admin */}
                <td className="py-3.5 px-4">
                  <span className="font-medium text-slate-800 dark:text-slate-200 block">{org.adminName || 'Belum Ditentukan'}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{org.adminEmail || '-'}</span>
                </td>

                {/* Documents */}
                <td className="py-3.5 px-4 text-right tabular-nums">
                  <span className="font-semibold text-slate-900 dark:text-white">{org.documentsCount || 0}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block">berkas</span>
                </td>

                {/* Status */}
                <td className="py-3.5 px-4 text-center">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${
                    org.status === 'active' 
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60' 
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60'
                  }`}>
                    {org.status === 'active' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        Inactive
                      </>
                    )}
                  </span>
                </td>

                {/* Created */}
                <td className="py-3.5 px-4 text-right tabular-nums text-slate-500 dark:text-slate-400">
                  {typeof org.createdAt === 'string' ? org.createdAt.split('T')[0] : 'Hari ini'}
                </td>

                {/* Actions: KEDUA ROLE BISA EDIT & HAPUS, ADMIN MEMILIKI TOMBOL POWER/STATUS KHUSUS */}
                <td className="py-3.5 px-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    {/* Switch Project */}
                    {currentOrganization?.id !== org.id ? (
                      <button
                        onClick={() => switchProject(org.id)}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Pilih dan Jadikan Project Aktif"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="p-1.5 text-blue-600 dark:text-blue-400" title="Project Aktif Saat Ini">
                        <Check className="w-4 h-4" />
                      </span>
                    )}

                    {/* 1. Lihat Detail Project (User & Admin) */}
                    <Link
                      to={`/app/projects/${org.id}`}
                      className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Lihat Detail Project"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    {/* 2. Edit Project */}
                    <button
                      onClick={() => setEditingOrg(org)}
                      className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Edit Data Project"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* 3. Nonaktifkan / Aktifkan Status (KHUSUS ADMIN) */}
                    {isAdmin && (
                      <button
                        onClick={() => toggleOrgStatus(org.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          org.status === 'active'
                            ? 'text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                            : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                        title={org.status === 'active' ? 'Deaktivasi Project (Wewenang Admin)' : 'Aktivasi Project (Wewenang Admin)'}
                      >
                        <PowerOff className="w-4 h-4" />
                      </button>
                    )}

                    {/* 4. Hapus Project */}
                    <button
                      onClick={() => setDeletingOrg(org)}
                      className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
            ) : (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                  Tidak ada organisasi yang terdaftar atau cocok dengan pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (< md screen) */}
      <div className="md:hidden space-y-3">
        {filteredOrgs.length > 0 ? (
          filteredOrgs.map((org) => (
          <div key={org.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-slate-700 to-indigo-800 dark:from-slate-800 dark:to-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {(org.code || 'ORG').slice(0, 3)}
                </div>
                <div>
                  <Link to={`/app/projects/${org.id}`} className="text-xs font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 block">
                    {org.name}
                  </Link>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">{org.code || '-'}</span>
                    <button
                      type="button"
                      onClick={() => setRagModalOrg(org)}
                      className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60"
                      title="Klik untuk info koneksi RAG"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                      <span>{org.knowledgeBase || ('kb_' + (org.code || 'utama').toLowerCase().replace(/[^a-z0-9_]/g, '_'))}</span>
                    </button>
                  </div>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md shrink-0 ${
                org.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
              }`}>
                {org.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-2 rounded-lg">
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Pemilik Project</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">{org.adminName || '-'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Kategori</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">{org.type}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Total Berkas</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 tabular-nums">{org.documentsCount || 0} Dokumen</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Basis Pengetahuan</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 tabular-nums">{org.chunksCount || 0} Chunks</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Dibuat {typeof org.createdAt === 'string' ? org.createdAt.split('T')[0] : 'Hari ini'}</span>
              <div className="flex items-center gap-1.5">
                {/* Switch Project */}
                {currentOrganization?.id !== org.id && (
                  <button
                    onClick={() => switchProject(org.id)}
                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900/60 cursor-pointer"
                    title="Pilih Project Ini"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Edit */}
                <button
                  onClick={() => setEditingOrg(org)}
                  className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg border border-indigo-200 dark:border-indigo-900/60 cursor-pointer"
                  title="Edit Project"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                {/* Hapus */}
                <button
                  onClick={() => setDeletingOrg(org)}
                  className="p-1.5 text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900/60 cursor-pointer"
                  title="Hapus Project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <Link
                  to={`/app/projects/${org.id}`}
                  className="px-2.5 py-1 text-[11px] font-medium bg-blue-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-blue-500"
                >
                  Detail
                </Link>
              </div>
            </div>
          </div>
        ))
        ) : (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
            Tidak ada organisasi yang terdaftar.
          </div>
        )}
      </div>

      {/* Delete Org Confirmation Modal with Role-Aware Context */}
      {deletingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  isAdmin 
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' 
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {isAdmin ? 'Otoritas Admin' : 'Konfirmasi Pengguna'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hapus Organisasi {deletingOrg.name}?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {isAdmin
                  ? 'Sebagai Administrator, tindakan ini akan menghapus entitas BUMD beserta seluruh berkas repositori dokumen terkait dari sistem secara permanen.'
                  : 'Tindakan ini akan menghapus organisasi ini beserta seluruh dokumen yang tersimpan di dalamnya.'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Admin organisasi ini ({deletingOrg.adminName || 'Admin'}) dapat membuat atau bergabung kembali ke organisasi baru.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingOrg(null)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteOrganization(deletingOrg.id);
                  setDeletingOrg(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isAdmin ? 'Ya, Hapus Sebagai Admin' : 'Ya, Hapus Organisasi'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateProjectModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />
      <EditOrgModal isOpen={Boolean(editingOrg)} onClose={() => setEditingOrg(null)} org={editingOrg} />
      <RagConnectionModal isOpen={Boolean(ragModalOrg)} organization={ragModalOrg} onClose={() => setRagModalOrg(null)} />
    </div>
  );
};
