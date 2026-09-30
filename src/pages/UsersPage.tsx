import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User } from '../types';
import { 
  Users, 
  UserPlus, 
  Search, 
  Pencil,
  UserMinus,
  CheckCircle2, 
  AlertTriangle,
  Building2,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { BottomSheet } from '../components/common/BottomSheet';

export const UsersPage: React.FC = () => {
  const { 
    users, 
    currentUser, 
    currentOrganization, 
    addUser,
    editUser,
    removeUserFromOrg,
    updateUserRole,
    organizations 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmRemoveUser, setConfirmRemoveUser] = useState<User | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newOrgId, setNewOrgId] = useState(currentUser?.organizationId || (organizations[0]?.id || ''));

  // Edit user form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'user' | 'admin' | 'superadmin'>('user');
  const [roleFilter, setRoleFilter] = useState<'all' | 'superadmin' | 'admin' | 'user'>('all');
  const [orgFilter, setOrgFilter] = useState<string>('all');

  const showToast = (message: string) => {
    setFeedbackNotice(message);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const handleRoleChange = (userId: string, userName: string, targetRole: 'user' | 'admin') => {
    updateUserRole(userId, targetRole);
    if (targetRole === 'admin') {
      showToast(`${userName} berhasil diangkat sebagai Admin! Akun ini kini memiliki wewenang untuk membuat & mengelola organisasi.`);
    } else {
      showToast(`Peran ${userName} telah disesuaikan kembali menjadi User biasa.`);
    }
  };

  // Filter users based on scope:
  // Superadmin sees all users; Admin sees users in their organization
  const targetUsers = currentUser?.role === 'superadmin' 
    ? users 
    : users.filter(u => u.organizationId === currentUser?.organizationId);

  const filteredUsers = targetUsers.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.organizationName || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesOrg = orgFilter === 'all' || u.organizationId === orgFilter;

    return matchesSearch && matchesRole && matchesOrg;
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const targetOrg = organizations.find(o => 
      o.id === (currentUser?.role === 'superadmin' ? newOrgId : currentUser?.organizationId)
    );

    addUser({
      name: newName.trim(),
      email: newEmail.trim(),
      role: 'user',
      organizationId: targetOrg?.id || null,
      organizationName: targetOrg?.name || null,
      status: 'active'
    });

    showToast(`Anggota baru ${newName} berhasil ditambahkan ke ${targetOrg?.name || 'organisasi'}.`);
    setNewName('');
    setNewEmail('');
    setAddModalOpen(false);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditModalOpen(true);
  };

  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editName.trim() || !editEmail.trim()) return;

    editUser(editingUser.id, {
      name: editName.trim(),
      email: editEmail.trim()
    });

    if (currentUser?.role === 'superadmin' && editRole !== editingUser.role) {
      updateUserRole(editingUser.id, editRole);
      if (editRole === 'admin') {
        showToast(`${editName} berhasil diangkat sebagai Admin! Akun ini kini dapat membuat 1 organisasi.`);
      } else {
        showToast(`Peran ${editName} diubah menjadi User biasa.`);
      }
    } else {
      showToast(`Data anggota ${editName} berhasil diperbarui.`);
    }

    setEditModalOpen(false);
    setEditingUser(null);
  };

  const handleConfirmRemove = () => {
    if (!confirmRemoveUser) return;
    const userName = confirmRemoveUser.name;
    const orgName = confirmRemoveUser.organizationName || 'organisasi';
    
    removeUserFromOrg(confirmRemoveUser.id);
    showToast(`${userName} telah dikeluarkan dari ${orgName}.`);
    setConfirmRemoveUser(null);
  };

  // Stat counts
  const totalCount = targetUsers.length;
  const adminCount = targetUsers.filter(u => u.role === 'admin').length;
  const regularUserCount = targetUsers.filter(u => u.role === 'user').length;
  const superadminCount = targetUsers.filter(u => u.role === 'superadmin').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {currentUser?.role === 'superadmin' ? 'Kelola Pengguna & Hak Akses' : 'Manajemen Anggota Organisasi'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {currentUser?.role === 'superadmin'
              ? 'Kelola akun seluruh personil lintas BUMD, promosi hak akses, dan atur penugasan divisi.'
              : `Kelola data anggota di lingkungan ${currentOrganization?.name || 'Organisasi'}.`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="group inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow active:scale-[0.98] self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-blue-200 group-hover:text-white transition-colors" />
          <span className="tracking-tight">Tambah Anggota</span>
        </button>
      </div>

      {/* Feedback Toast Notice */}
      {feedbackNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">{feedbackNotice}</span>
        </div>
      )}

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Total Personil</span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
            {totalCount}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Akun pengguna terdaftar</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Admin Organisasi</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
            {adminCount}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Pengelola BUMD aktif</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Pengguna Reguler</span>
            <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
            {regularUserCount}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Akses pencarian & AI</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-medium">
              {currentUser?.role === 'superadmin' ? 'Cakupan BUMD' : 'Status Keanggotaan'}
            </span>
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
            {currentUser?.role === 'superadmin' ? organizations.length : '100%'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {currentUser?.role === 'superadmin' ? 'Entitas organisasi aktif' : 'Terverifikasi & aktif'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, email, atau organisasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
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

          {/* Org Filter (for Superadmin) */}
          {currentUser?.role === 'superadmin' && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">BUMD:</span>
              <select
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
              >
                <option value="all">Semua Organisasi</option>
                {organizations.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'all' as const, label: 'Semua', count: totalCount },
              ...(currentUser?.role === 'superadmin' ? [{ id: 'superadmin' as const, label: 'Superadmin', count: superadminCount }] : []),
              { id: 'admin' as const, label: 'Admin', count: adminCount },
              { id: 'user' as const, label: 'User', count: regularUserCount },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  roleFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-mono ${
                  roleFilter === tab.id
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums font-medium whitespace-nowrap pl-2">
            Menampilkan {filteredUsers.length} dari {totalCount}
          </span>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/70 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Pengguna</th>
                {currentUser?.role === 'superadmin' && (
                  <th className="py-3.5 px-4">Organisasi</th>
                )}
                <th className="py-3.5 px-4">Peran</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Bergabung</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
              {filteredUsers.map((user) => {
                const isSelf = user.id === currentUser?.id;
                const isSuperadminUser = user.role === 'superadmin';
                const canEject = !isSelf && !isSuperadminUser && Boolean(user.organizationId);

                // Avatar color accent
                const avatarBg = user.role === 'superadmin'
                  ? 'bg-linear-to-br from-purple-600 to-indigo-600 text-white'
                  : user.role === 'admin'
                  ? 'bg-linear-to-br from-blue-600 to-indigo-600 text-white'
                  : 'bg-linear-to-br from-slate-700 to-slate-800 text-white';

                return (
                  <tr key={user.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    {/* User Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs ${avatarBg}`}>
                          {user.avatarInitials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-900 dark:text-white truncate">{user.name}</span>
                            {isSelf && (
                              <span className="text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 px-1.5 py-0.2 rounded font-semibold shrink-0">
                                Anda
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate block">{user.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Organization (Superadmin view) */}
                    {currentUser?.role === 'superadmin' && (
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium truncate max-w-[170px]" title={user.organizationName || 'Platform Global'}>
                            {user.organizationName || 'Platform Global'}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      {user.role === 'superadmin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800">
                          <ShieldCheck className="w-3 h-3" />
                          Superadmin
                        </span>
                      ) : user.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800">
                          <ShieldCheck className="w-3 h-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                          <Users className="w-3 h-3 text-slate-400" />
                          User
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Aktif
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="py-3.5 px-4 text-center tabular-nums text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                      {formatDate(user.joinedAt)}
                    </td>

                    {/* Single-Row Clean Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        {/* Superadmin direct promote/demote action */}
                        {currentUser?.role === 'superadmin' && !isSelf && !isSuperadminUser && (
                          user.role === 'user' ? (
                            <button
                              type="button"
                              onClick={() => handleRoleChange(user.id, user.name, 'admin')}
                              className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg border border-indigo-200/80 dark:border-indigo-800/60 transition-all flex items-center gap-1 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                              title="Jadikan Admin organisasi"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              <span>Jadikan Admin</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRoleChange(user.id, user.name, 'user')}
                              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-200/80 dark:border-slate-700 transition-all flex items-center gap-1 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                              title="Ubah peran menjadi User biasa"
                            >
                              <Users className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                              <span>Jadikan User</span>
                            </button>
                          )
                        )}

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                          title="Edit data anggota"
                        >
                          <Pencil className="w-3 h-3 text-slate-400 dark:text-slate-400" />
                          <span>Edit</span>
                        </button>

                        {/* Eject Button */}
                        {canEject ? (
                          <button
                            type="button"
                            onClick={() => setConfirmRemoveUser(user)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:text-rose-800 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg border border-rose-200/80 dark:border-rose-900/60 transition-all flex items-center gap-1 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                            title="Keluarkan dari organisasi"
                          >
                            <UserMinus className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                            <span>Keluarkan</span>
                          </button>
                        ) : isSelf ? (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700">
                            Akun Anda
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={currentUser?.role === 'superadmin' ? 7 : 6} className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">Tidak ada anggota yang cocok</p>
                      <p className="text-[11px] text-slate-400 max-w-xs">
                        Tidak ditemukan data dengan kata kunci "{searchQuery}" atau filter yang dipilih.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setRoleFilter('all');
                          setOrgFilter('all');
                        }}
                        className="mt-1 px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <BottomSheet
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Tambah Anggota Organisasi"
        subtitle="Tambahkan anggota baru ke dalam organisasi untuk mengakses repositori knowledge"
      >
        <form onSubmit={handleAddUserSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Budi Santoso"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email Resmi *</label>
            <input
              type="email"
              required
              placeholder="budi.santoso@perusahaan.co.id"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {currentUser?.role === 'superadmin' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Pilih Organisasi *</label>
              <select
                value={newOrgId}
                onChange={(e) => setNewOrgId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
              >
                {organizations.map(o => (
                  <option key={o.id} value={o.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{o.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Simpan & Tambah Anggota
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Edit User Modal */}
      <BottomSheet
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingUser(null);
        }}
        title="Edit Data Anggota"
        subtitle={`Perbarui data informasi anggota ${editingUser?.name || ''}`}
      >
        <form onSubmit={handleEditUserSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email Resmi *</label>
            <input
              type="email"
              required
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Role selector for Superadmin */}
          {currentUser?.role === 'superadmin' && editingUser?.role !== 'superadmin' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Peran / Hak Akses (Role)</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as 'user' | 'admin')}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
              >
                <option value="user" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">User Biasa (Hanya Anggota)</option>
                <option value="admin" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Admin Organisasi (Akses 1 Organisasi)</option>
              </select>
              <span className="text-[11px] text-slate-400 dark:text-slate-400 mt-1 block">
                {editRole === 'admin' 
                  ? 'Admin memiliki kuota untuk membuat & mengelola 1 organisasi BUMD.' 
                  : 'User biasa hanya dapat bergabung ke organisasi dan mengakses Tanya AI.'}
              </span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setEditModalOpen(false);
                setEditingUser(null);
              }}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Confirm Eject / Remove Member Modal */}
      {confirmRemoveUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Keluarkan Anggota?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Apakah Anda yakin ingin mengeluarkan <strong className="text-slate-700 dark:text-slate-200">{confirmRemoveUser.name}</strong> dari organisasi <strong className="text-slate-700 dark:text-slate-200">{confirmRemoveUser.organizationName || 'ini'}</strong>? Pengguna akan dilepaskan dari organisasi dan kehilangan akses ke dokumen internal.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmRemoveUser(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Ya, Keluarkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
