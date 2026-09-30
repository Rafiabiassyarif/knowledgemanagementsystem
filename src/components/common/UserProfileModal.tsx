import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  User as UserIcon, 
  Mail, 
  Building2, 
  Shield, 
  Briefcase, 
  Phone, 
  Key, 
  Lock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Laptop,
  Check,
  Camera,
  Trash2,
  ShieldCheck
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'security' | 'organization';
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ 
  isOpen, 
  onClose,
  initialTab = 'profile'
}) => {
  const { currentUser, currentOrganization, editUser } = useApp();
  const role = currentUser?.role || 'user';

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'organization'>(
    role === 'superadmin' && initialTab === 'organization' ? 'profile' : initialTab
  );

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states for password change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Sync state whenever currentUser or modal opens
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setDepartment(currentUser.department || '');
      setPhone(currentUser.phone || '');
      setPosition(currentUser.position || '');
      setAvatarUrl(currentUser.avatarUrl);
    }
  }, [currentUser, isOpen]);

  // Ensure superadmin never stays on organization tab
  useEffect(() => {
    if (role === 'superadmin' && activeTab === 'organization') {
      setActiveTab('profile');
    }
  }, [role, activeTab]);

  if (!isOpen || !currentUser) return null;

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (JPG, PNG, atau WebP)');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert('Ukuran foto maksimal 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      email: email.trim(),
      department: department.trim(),
      phone: phone.trim(),
      position: position.trim(),
      avatarUrl: avatarUrl
    };

    editUser(currentUser.id, payload);

    setProfileSuccess(true);
    setTimeout(() => {
      setProfileSuccess(false);
    }, 2500);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);
    setSecuritySuccess(null);

    if (!oldPassword) {
      setSecurityError('Masukkan kata sandi lama Anda.');
      return;
    }

    if (newPassword.length < 6) {
      setSecurityError('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setSecuritySuccess('Kata sandi berhasil diperbarui dengan aman!');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSecuritySuccess(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md bg-blue-600">
              {role === 'superadmin' ? (
                <ShieldCheck className="w-5 h-5 text-white" />
              ) : role === 'admin' ? (
                <Shield className="w-5 h-5 text-white" />
              ) : (
                <UserIcon className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Profil & Akun Pengguna
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kelola identitas, data pribadi, dan keamanan akun
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex gap-4 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Informasi Akun</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'security'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Keamanan & Sandi</span>
          </button>

          {/* Tab Organisasi & Akses HANYA untuk Admin dan User, tidak untuk Superadmin */}
          {role !== 'superadmin' && (
            <button
              onClick={() => setActiveTab('organization')}
              className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'organization'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Organisasi & Akses</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              
              {/* Profile Card Banner */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 shadow-xs">
                {/* Avatar with Status */}
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={currentUser.name} 
                      className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-slate-200 dark:border-slate-700" 
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md border-2 border-blue-400/30">
                      {currentUser.avatarInitials || 'US'}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" title="Status: Online & Aktif" />
                </div>

                {/* Identity Info */}
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{currentUser.name}</h3>
                    
                    {/* Role Pill Badge */}
                    {role === 'superadmin' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        Superadministrator Platform
                      </span>
                    ) : role === 'admin' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60">
                        <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        Administrator Organisasi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        <UserIcon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                        Pengguna / Anggota
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{currentUser.email}</p>

                  {/* Organisasi (Hanya untuk Admin & User) */}
                  {role !== 'superadmin' && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-blue-500" />
                      <span>
                        {currentOrganization 
                          ? currentOrganization.name 
                          : 'Belum Bergabung dengan Organisasi'}
                      </span>
                    </p>
                  )}

                  {/* Photo upload action buttons */}
                  <div className="mt-3 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{avatarUrl ? 'Ganti Foto' : 'Unggah Foto'}</span>
                    </button>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-medium hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
                        title="Hapus foto dan kembali ke avatar inisial"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Foto</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {profileSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Data profil berhasil diperbarui!</span>
                </div>
              )}

              {/* FORM PENGISIAN SESUAI PERAN */}
              {role === 'superadmin' ? (
                /* -------------------------------------------------------------
                 * 1. FORM SUPERADMIN: Simpel, bersih, hanya data esensial
                 * ------------------------------------------------------------- */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Nama Lengkap
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Akun
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      No. Telepon / WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        placeholder="0812-xxxx-xxxx"
                      />
                    </div>
                  </div>
                </div>
              ) : role === 'admin' ? (
                /* -------------------------------------------------------------
                 * 2. FORM ADMIN: Data Administrator Organisasi
                 * ------------------------------------------------------------- */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Nama Lengkap Administrator
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Kantor / Resmi Organisasi
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      No. WhatsApp / Kontak PIC
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        placeholder="0821-xxxx-xxxx"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Organisasi yang Dikelola
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 text-xs bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 rounded-xl text-blue-700 dark:text-blue-300 font-semibold truncate">
                      <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="truncate">
                        {currentOrganization 
                          ? `${currentOrganization.name} (${currentOrganization.code})` 
                          : 'Belum Membuat Organisasi'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* -------------------------------------------------------------
                 * 3. FORM USER: Data Karyawan, Divisi & Jabatan
                 * ------------------------------------------------------------- */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Nama Lengkap
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Akun
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      No. WhatsApp / Telepon
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        placeholder="0813-xxxx-xxxx"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer active:scale-95"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <div className="space-y-5">
              <form onSubmit={handleSavePassword} className="space-y-4">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Ubah Kata Sandi</h3>

                {securitySuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{securitySuccess}</span>
                  </div>
                )}

                {securityError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>{securityError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Kata Sandi Saat Ini</label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Kata Sandi Baru</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        placeholder="Minimal 6 karakter"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Konfirmasi Kata Sandi Baru</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        placeholder="Ulangi kata sandi baru"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer active:scale-95"
                  >
                    Perbarui Kata Sandi
                  </button>
                </div>
              </form>

              {/* Active Session Info */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">Sesi Login Perangkat</h3>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">Perangkat Ini (Windows / Browser)</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">IP Lokal · Sesi aktif saat ini</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    Aktif Sekarang
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'organization' && role !== 'superadmin' && (
            <div className="space-y-4">
              {role === 'admin' ? (
                <>
                  <div className="p-4 bg-gradient-to-br from-blue-50/90 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 rounded-2xl border border-blue-200/80 dark:border-blue-800/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        Organisasi Dikelola
                      </span>
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/50">
                        ADMINISTRATOR
                      </span>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-md">
                        {currentOrganization?.code?.slice(0, 3) || 'ADM'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {currentOrganization ? currentOrganization.name : 'Organisasi Belum Dibuat'}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Kode Akses: <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{currentOrganization?.code || 'SETUP'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200/60 dark:border-blue-800/40 text-xs text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 text-[11px] block">Role Pengguna</span>
                        <span className="font-bold text-blue-700 dark:text-blue-300">Administrator Organisasi</span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 text-[11px] block">Status Kepemilikan</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> {currentOrganization ? '1 Organisasi Aktif' : 'Perlu Buat Organisasi'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">Hak Akses Administrator</h4>
                    <div className="space-y-2">
                      <div className="p-2.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                        <span>Kelola Anggota, Setujui Permintaan Gabung, dan Atur Status User</span>
                      </div>
                      <div className="p-2.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                        <span>Unggah Dokumen SOP & Regulasi Organisasi ke Repositori RAG</span>
                      </div>
                      <div className="p-2.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                        <span>Tanya AI Cerdas Berbasis Dokumen Resmi Organisasi</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-gradient-to-br from-emerald-50/90 to-slate-50 dark:from-emerald-950/30 dark:to-slate-900/50 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        Keanggotaan Organisasi
                      </span>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                        {currentOrganization ? 'TERDAFTAR' : 'BELUM GABUNG'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-md">
                        {currentOrganization?.code?.slice(0, 3) || 'USR'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {currentOrganization ? currentOrganization.name : 'Belum Bergabung dengan Organisasi'}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Kode Akses: <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{currentOrganization?.code || '-'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 text-xs text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 text-[11px] block">Role Pengguna</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300">Pengguna / Anggota</span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 text-[11px] block">Status Keanggotaan</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> {currentOrganization ? 'Aktif' : 'Menunggu Pilihan'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">Hak Akses Anggota</h4>
                    <div className="space-y-2">
                      <div className="p-2.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Tanya AI Cerdas seputar Dokumen, SOP, dan Pengetahuan Organisasi</span>
                      </div>
                      <div className="p-2.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Akses Arsip Dokumen Publik Organisasi</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
