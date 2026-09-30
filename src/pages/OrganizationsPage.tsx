import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CreateOrgModal } from '../components/common/CreateOrgModal';
import { 
  Building2, 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit3, 
  Shield, 
  Cpu, 
  PowerOff,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { OrgType, Organization } from '../types';

export const OrganizationsPage: React.FC = () => {
  const { organizations, toggleOrgStatus, currentUser, deleteOrganization } = useApp();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const navigate = useNavigate();

  const orgTypes = [
    'All Types',
    'BUMD Air Minum',
    'BUMD Perbankan',
    'BUMD Pangan & Pasar',
    'BUMD Transportasi',
    'BUMD Energi & Infrastruktur'
  ];

  const filteredOrgs = organizations.filter(org => {
    const matchSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (org.adminName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchType = selectedType === 'all' || selectedType === 'All Types' || org.type === selectedType;
    const matchStatus = selectedStatus === 'all' || org.status === selectedStatus;

    return matchSearch && matchType && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Manajemen Organisasi
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Daftar entitas organisasi terdaftar dan penanggung jawab admin.
          </p>
        </div>

        {currentUser?.role === 'superadmin' && (
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="group inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow active:scale-[0.98] self-start sm:self-auto cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-slate-300 group-hover:text-white transition-colors" />
            <span className="tracking-tight">Buat Organisasi</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari organisasi berdasarkan nama, kode unik, admin, atau kota..."
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
              <th className="py-3 px-4">Organization</th>
              <th className="py-3 px-4">Type & Sektor</th>
              <th className="py-3 px-4">Admin Penanggung Jawab</th>
              <th className="py-3 px-4 text-right">Documents</th>
              <th className="py-3 px-4 text-right">Users</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Created</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
            {filteredOrgs.map((org) => (
              <tr key={org.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/70 transition-colors">
                {/* Organization */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-slate-700 to-indigo-800 dark:from-slate-800 dark:to-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {org.code.slice(0, 3)}
                    </div>
                    <div>
                      <Link 
                        to={`/organizations/${org.id}`}
                        className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                      >
                        {org.name}
                      </Link>
                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                        {org.code} · {org.city}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Type */}
                <td className="py-3.5 px-4">
                  <span className="font-medium text-slate-800 dark:text-slate-200 block">{org.type}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">{org.sector}</span>
                </td>

                {/* Admin */}
                <td className="py-3.5 px-4">
                  <span className="font-medium text-slate-800 dark:text-slate-200 block">{org.adminName}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{org.adminEmail}</span>
                </td>

                {/* Documents */}
                <td className="py-3.5 px-4 text-right tabular-nums">
                  <span className="font-semibold text-slate-900 dark:text-white">{org.documentsCount}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block">{org.chunksCount} chunks</span>
                </td>

                {/* Users */}
                <td className="py-3.5 px-4 text-right tabular-nums">
                  <span className="font-semibold text-slate-900 dark:text-white">{org.usersCount}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block">anggota</span>
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
                  {org.createdAt}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Link
                      to={`/organizations/${org.id}`}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                      title="Lihat Detail Organisasi"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => toggleOrgStatus(org.id)}
                      className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-md transition-colors cursor-pointer"
                      title={org.status === 'active' ? 'Deaktivasi Organisasi' : 'Aktivasi Organisasi'}
                    >
                      <PowerOff className="w-4 h-4" />
                    </button>
                    {currentUser?.role === 'superadmin' && (
                      <button
                        onClick={() => setDeletingOrg(org)}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                        title="Hapus Organisasi (Superadmin)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (< md screen) */}
      <div className="md:hidden space-y-3">
        {filteredOrgs.map((org) => (
          <div key={org.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-slate-700 to-indigo-800 dark:from-slate-800 dark:to-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {org.code.slice(0, 3)}
                </div>
                <div>
                  <Link to={`/organizations/${org.id}`} className="text-xs font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 block">
                    {org.name}
                  </Link>
                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">{org.code} · {org.city}</span>
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
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Admin</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">{org.adminName}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Tipe</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">{org.type}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Dokumen & Chunks</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 tabular-nums">{org.documentsCount} Dok ({org.chunksCount} Chunks)</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Pengguna</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 tabular-nums">{org.usersCount} Users</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Dibuat {org.createdAt}</span>
              <div className="flex items-center gap-2">
                {currentUser?.role === 'superadmin' && (
                  <button
                    onClick={() => setDeletingOrg(org)}
                    className="p-1.5 text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md border border-rose-200 dark:border-rose-900/60 cursor-pointer"
                    title="Hapus Organisasi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => toggleOrgStatus(org.id)}
                  className="px-2.5 py-1 text-[11px] font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md cursor-pointer"
                >
                  {org.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <Link
                  to={`/organizations/${org.id}`}
                  className="px-2.5 py-1 text-[11px] font-medium bg-blue-600 text-white rounded-md hover:bg-slate-800 dark:hover:bg-blue-500"
                >
                  Buka Detail
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Org Confirmation Modal */}
      {deletingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hapus Organisasi {deletingOrg.name}?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Tindakan ini akan menghapus organisasi beserta seluruh dokumen SOP dan knowledge chunks terkait secara permanen.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Admin organisasi ini ({deletingOrg.adminName}) nantinya dapat membuat 1 organisasi baru lagi setelah organisasi ini dihapus.
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
                <span>Ya, Hapus Organisasi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateOrgModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />
    </div>
  );
};
