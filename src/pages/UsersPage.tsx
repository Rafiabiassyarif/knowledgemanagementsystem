import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { User } from '../types';
import { 
  Users, 
  UserPlus, 
  Search, 
  Pencil,
  Trash2,
  CheckCircle2, 
  AlertTriangle,
  Building2,
  Mail,
  ShieldCheck,
  Ban,
  RotateCcw,
  KeyRound
} from 'lucide-react';
import { BottomSheet } from '../components/common/BottomSheet';

export const UsersPage: React.FC = () => {
  const { 
    users, 
    currentUser, 
    currentOrganization, 
    addUser,
    editUser,
    updateUserRole,
    setUserStatus,
    deleteUser,
    resetUserPassword,
    organizations 
  } = useApp();

  if (currentUser?.role === 'user') {
    return <Navigate to="/app" replace />;
  }

  const [searchQuery, setSearchQuery] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);
  const [confirmSuspendUser, setConfirmSuspendUser] = useState<User | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newOrgId, setNewOrgId] = useState(currentUser?.organizationId || (organizations[0]?.id || ''));

  // Edit user form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
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

  // Admin mengelola SEMUA pengguna; user hanya melihat rekan satu project.
  const targetUsers = currentUser?.role === 'admin' 
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
      o.id === (currentUser?.role === 'admin' ? newOrgId : currentUser?.organizationId)
    );

    addUser({
      name: newName.trim(),
      email: newEmail.trim(),
      role: 'user',
      organizationId: targetOrg?.id || null,
      organizationName: targetOrg?.name || null,
      status: 'active'
    });

    showToast(`Pengguna baru ${newName} berhasil ditambahkan.`);
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

    if (currentUser?.role === 'admin' && editRole !== editingUser.role) {
      updateUserRole(editingUser.id, editRole);
      if (editRole === 'admin') {
        showToast(`${editName} berhasil diangkat sebagai Admin!`);
      } else {
        showToast(`Peran ${editName} diubah menjadi User biasa.`);
      }
    } else {
      showToast(`Data pengguna ${editName} berhasil diperbarui.`);
    }

    setEditModalOpen(false);
    setEditingUser(null);
  };

  const handleConfirmDelete = () => {
    if (!confirmDeleteUser) return;
    const userName = confirmDeleteUser.name;

    deleteUser(confirmDeleteUser.id);
    showToast(`Akun ${userName} telah dihapus permanen dari sistem.`);
    setConfirmDeleteUser(null);
  };

  const handleConfirmSuspend = () => {
    if (!confirmSuspendUser) return;
    const userName = confirmSuspendUser.name;

    setUserStatus(confirmSuspendUser.id, 'inactive');
    showToast(`Akun ${userName} telah dinonaktifkan (suspended). Pengguna tidak dapat login hingga diaktifkan kembali.`);
    setConfirmSuspendUser(null);
  };

  const handleActivate = (user: User) => {
    setUserStatus(user.id, 'active');
    showToast(`Akun ${user.name} telah diaktifkan kembali. Pengguna dapat login kembali seperti biasa.`);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    if (newPassword.length < 6) {
      setResetError('Kata sandi baru minimal 6 karakter.');
      return;
    }

    try {
      await resetUserPassword(resetTarget.id, newPassword);
      showToast(`Kata sandi ${resetTarget.name} berhasil direset. Sampaikan kata sandi baru kepada yang bersangkutan.`);
      setResetTarget(null);
      setNewPassword('');
      setResetError(null);
    } catch (err: any) {
      setResetError(err?.message || 'Gagal mereset kata sandi.');
    }
  };

  // Stat counts
  const totalCount = targetUsers.length;
  const adminCount = targetUsers.filter(u => u.role === 'admin').length;
  const regularUserCount = targetUsers.filter(u => u.role === 'user').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {currentUser?.role === 'admin' ? 'Kelola Pengguna & Hak Akses' : 'Manajemen Pengguna Platform'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {currentUser?.role === 'admin'
              ? 'Kelola akun seluruh personil, promosi hak akses, dan manajemen akun platform.'
              : 'Kelola data akun pengguna, peran, dan hak akses.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="group inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow active:scale-[0.98] self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-blue-200 group-hover:text-white transition-colors" />
          <span className="tracking-tight">Tambah Pengguna</span>
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
              {currentUser?.role === 'admin' ? 'Cakupan BUMD' : 'Status Pengguna'}
            </span>
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
            {currentUser?.role === 'admin' ? organizations.length : '100%'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {currentUser?.role === 'admin' ? 'Entitas organisasi aktif' : 'Terverifikasi & aktif'}
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

          {/* Filter Organisasi */}
          {currentUser?.role === 'admin' && (
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
          <table className="w-full text-left border-collapse min-w-[1050px]">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/70 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Pengguna</th>
                {currentUser?.role === 'admin' && (
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
                const isAdminUser = user.role === 'admin';
                const canDelete = !isSelf && !isAdminUser && (Boolean(user.organizationId) || currentUser?.role === 'admin');
                const canManageAccount = !isSelf && !isAdminUser;
                const resolvedOrgName = user.organizationName || organizations.find(o => o.id === user.organizationId)?.name || 'Belum Bergabung';

                // Avatar color accent
                const avatarBg = user.role === 'admin'
                  ? 'bg-linear-to-br from-indigo-600 to-blue-600 text-white'
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

                    {/* Organization */}
                    {currentUser?.role === 'admin' && (
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium truncate max-w-[170px]" title={resolvedOrgName}>
                            {resolvedOrgName}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      {user.role === 'admin' ? (
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
                      {user.status === 'inactive' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Suspended
                        </span>
                      ) : user.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Menunggu
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Aktif
                        </span>
                      )}
                    </td>

                    {/* Joined Date */}
                    <td className="py-3.5 px-4 text-center tabular-nums text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                      {formatDate(user.joinedAt)}
                    </td>

                    {/* Single-Row Clean Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        {/* Aksi promosi / demosi Admin */}
                        {currentUser?.role === 'admin' && !isSelf && !isAdminUser && (
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

                        {/* Suspend / Activate Account Button */}
                        {canManageAccount && (
                          user.status === 'inactive' ? (
                            <button
                              type="button"
                              onClick={() => handleActivate(user)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-200/80 dark:border-emerald-800/60 transition-all flex items-center gap-1 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                              title="Aktifkan kembali akun pengguna"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Aktifkan</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmSuspendUser(user)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-800 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-lg border border-amber-200/80 dark:border-amber-800/60 transition-all flex items-center gap-1 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                              title="Suspend akun: blokir login tanpa menghapus data"
                            >
                              <Ban className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>Suspend</span>
                            </button>
                          )
                        )}

                        {/* Reset Password Button */}
                        {canManageAccount && (
                          <button
                            type="button"
                            onClick={() => {
                              setResetTarget(user);
                              setNewPassword('');
                              setResetError(null);
                            }}
                            className="px-2.5 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:text-sky-800 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 rounded-lg border border-sky-200/80 dark:border-sky-800/60 transition-all flex items-center gap-1 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                            title="Reset kata sandi pengguna"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                            <span>Reset Sandi</span>
                          </button>
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

                        {/* Delete Account Button */}
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteUser(user)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:text-rose-800 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg border border-rose-200/80 dark:border-rose-900/60 transition-all flex items-center gap-1 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                            title="Hapus akun secara permanen"
                          >
                            <Trash2 className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                            <span>Hapus</span>
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
                  <td colSpan={currentUser?.role === 'admin' ? 7 : 6} className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
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
        title="Tambah Pengguna Platform"
        subtitle="Tambahkan akun pengguna baru ke dalam platform"
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

          {currentUser?.role === 'admin' && (
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
              Simpan & Tambah Pengguna
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
        title="Edit Data Pengguna"
        subtitle={`Perbarui data informasi pengguna ${editingUser?.name || ''}`}
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

          {/* Role selector untuk Admin */}
          {currentUser?.role === 'admin' && editingUser?.role !== 'admin' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Peran / Hak Akses (Role)</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as 'user' | 'admin')}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
              >
                <option value="user" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">User Biasa</option>
                <option value="admin" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Admin (Akses Penuh)</option>
              </select>
              <span className="text-[11px] text-slate-400 dark:text-slate-400 mt-1 block">
                {editRole === 'admin' 
                  ? 'Admin memiliki akses penuh untuk mengelola berkas dan basis pengetahuan.' 
                  : 'User biasa dapat mengunggah berkas dan mengakses repositori dokumen.'}
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

      {/* Confirm Suspend Account Modal */}
      {confirmSuspendUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Ban className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Suspend Akun Pengguna?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Apakah Anda yakin ingin menonaktifkan akun <strong className="text-slate-700 dark:text-slate-200">{confirmSuspendUser.name}</strong> ({confirmSuspendUser.email})? Pengguna tidak akan dapat login ke sistem hingga akunnya diaktifkan kembali. Data dan keanggotaan organisasi tetap dipertahankan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmSuspendUser(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSuspend}
                className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Ya, Suspend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      <BottomSheet
        isOpen={resetTarget !== null}
        onClose={() => {
          setResetTarget(null);
          setNewPassword('');
          setResetError(null);
        }}
        title="Reset Kata Sandi"
        subtitle={`Atur kata sandi baru untuk ${resetTarget?.name || ''}`}
      >
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Kata Sandi Baru *</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setResetError(null);
              }}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
            <span className="text-[11px] text-slate-400 dark:text-slate-400 mt-1 block">
              Kata sandi lama pengguna tidak diperlukan. Sampaikan kata sandi baru ini kepada yang bersangkutan agar segera diganti setelah login.
            </span>
            {resetError && (
              <span className="text-[11px] text-rose-600 dark:text-rose-400 mt-1.5 block font-medium">
                {resetError}
              </span>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setResetTarget(null);
                setNewPassword('');
                setResetError(null);
              }}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Reset Kata Sandi
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Confirm Delete Account Modal */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Hapus Akun Pengguna?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Apakah Anda yakin ingin menghapus akun <strong className="text-slate-700 dark:text-slate-200">{confirmDeleteUser.name}</strong> ({confirmDeleteUser.email}) secara permanen? Akun akan dihapus dari sistem beserta data keanggotaannya, dan pengguna tidak dapat login kembali. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDeleteUser(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
