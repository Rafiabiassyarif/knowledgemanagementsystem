import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Building2, User, ChevronDown, Check, ArrowRightLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RoleSwitcher: React.FC = () => {
  const { currentUser, setCurrentUser, users } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const presets = [
    {
      role: 'superadmin' as const,
      orgId: undefined,
      title: 'Superadmin (Platform)',
      sub: 'Akses global seluruh BUMD & Sistem RAG',
      user: users.find(u => u.role === 'superadmin')
    },
    {
      role: 'admin' as const,
      orgId: 'org-pam-jaya',
      title: 'Admin · PAM Jaya',
      sub: 'Kelola dokumen, anggota, & profil PAM Jaya',
      user: users.find(u => u.role === 'admin' && u.organizationId === 'org-pam-jaya')
    },
    {
      role: 'admin' as const,
      orgId: 'org-bank-bjb',
      title: 'Admin · Bank BJB',
      sub: 'Kelola dokumen kredit & kepatuhan Bank BJB',
      user: users.find(u => u.role === 'admin' && u.organizationId === 'org-bank-bjb')
    },
    {
      role: 'user' as const,
      orgId: 'org-pam-jaya',
      title: 'User · Budi (PAM Jaya)',
      sub: 'Akses SOP distribusi & tanya AI PAM Jaya',
      user: users.find(u => u.role === 'user' && u.organizationId === 'org-pam-jaya')
    },
    {
      role: 'user' as const,
      orgId: 'org-bank-bjb',
      title: 'User · Dewi (Bank BJB)',
      sub: 'Akses pedoman kredit & tanya AI Bank BJB',
      user: users.find(u => u.role === 'user' && u.organizationId === 'org-bank-bjb')
    },
    {
      role: 'user' as const,
      orgId: null as any,
      title: 'User Baru · Rina (Belum Tergabung)',
      sub: 'Uji Kondisi Beranda Kosong & Alur Gabung',
      user: users.find(u => u.email === 'rina.baru@gmail.com') || users.find(u => u.role === 'user' && !u.organizationId)
    },
    {
      role: 'admin' as const,
      orgId: null as any,
      title: 'Admin Baru · Dedi (Belum Punya Org)',
      sub: 'Uji Aturan 1 Admin = 1 Organisasi',
      user: users.find(u => u.email === 'admin.baru@kms.id') || users.find(u => u.role === 'admin' && !u.organizationId)
    }
  ];

  const currentPreset = presets.find(p => {
    if (!currentUser) return false;
    if (currentUser.role === 'superadmin') return p.role === 'superadmin';
    if (!currentUser.organizationId) return p.role === currentUser.role && !p.orgId;
    return p.role === currentUser.role && p.orgId === currentUser.organizationId;
  }) || presets[0];

  const getRoleIcon = (role: string) => {
    if (role === 'superadmin') return <Shield className="w-3.5 h-3.5 text-blue-600" />;
    if (role === 'admin') return <Building2 className="w-3.5 h-3.5 text-indigo-600" />;
    return <User className="w-3.5 h-3.5 text-slate-600" />;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-xs text-slate-700 shadow-2xs font-medium"
        title="Ganti Akun Demo"
      >
        <span className="flex items-center gap-1.5">
          <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-900">{currentPreset.title}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {dropdownOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setDropdownOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-slate-200 shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1.5 border-b border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ganti Akun Demo</p>
              <p className="text-xs text-slate-500 mt-0.5">Uji batasan akses data antar organisasi</p>
            </div>

            <div className="p-1 space-y-0.5">
              {presets.map((preset, index) => {
                const isSelected = Boolean(
                  currentUser && (
                    (currentUser.role === 'superadmin' && preset.role === 'superadmin') ||
                    (currentUser.role === preset.role && currentUser.organizationId === preset.orgId)
                  )
                );

                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (preset.user) {
                        setCurrentUser(preset.user);
                      }
                      setDropdownOpen(false);
                      if (preset.role === 'superadmin') {
                        navigate('/superadmin');
                      } else {
                        navigate('/app');
                      }
                    }}
                    className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                      isSelected ? 'bg-slate-100 text-slate-900 font-medium' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="mt-0.5 p-1 rounded-md bg-slate-100/80 border border-slate-200/50">
                      {getRoleIcon(preset.role)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900 truncate">{preset.title}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{preset.sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-1 pt-1 border-t border-slate-100 px-2 space-y-1">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/login');
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-md transition-colors"
              >
                Ke Halaman Login KMS
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/register');
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-md transition-colors"
              >
                Registrasi Akun Baru
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/superadmin/login');
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-md transition-colors font-medium"
              >
                Login Portal Superadmin
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
