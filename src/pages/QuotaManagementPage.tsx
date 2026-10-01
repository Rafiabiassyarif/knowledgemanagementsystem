import React, { useState, useEffect } from 'react';
import {
  Zap,
  Users,
  Crown,
  Search,
  Edit3,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Sparkles,
  Building2,
  Filter,
  UserPlus,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  Coins,
  Package,
  HardDrive,
  Layers,
  ArrowRight,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export interface PackageTier {
  id: string;
  key: string;
  name: string;
  tagline: string;
  price: number; // in IDR
  billingPeriod: string;
  docQuota: number;
  isUnlimited: boolean;
  storageGb: number;
  color: 'slate' | 'blue' | 'indigo' | 'purple' | 'amber' | 'emerald';
  features: string[];
  popular?: boolean;
  isSystem?: boolean;
}

export interface UserQuotaItem {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'superadmin';
  organizationName: string;
  department: string;
  planKey: string;
  planName: string;
  docQuota: number;
  docCount: number;
  status: 'active' | 'inactive';
}

const DEFAULT_PACKAGES: PackageTier[] = [
  {
    id: 'pkg-free',
    key: 'free',
    name: 'Paket Free (Dasar)',
    tagline: 'Akses awal untuk pengenalan dokumen SOP & repositori',
    price: 0,
    billingPeriod: '/bulan',
    docQuota: 5,
    isUnlimited: false,
    storageGb: 0.5,
    color: 'slate',
    features: [
      'Maksimal 5 Dokumen RAG',
      'Penyimpanan CDN 500 MB',
      'Pencarian Semantik Standar',
      'Dukungan Komunitas BUMD'
    ],
    isSystem: true
  },
  {
    id: 'pkg-pro',
    key: 'pro',
    name: 'Paket Pro (Bisnis)',
    tagline: 'Dirancang untuk divisi operasional dengan volume dokumen rutin',
    price: 299000,
    billingPeriod: '/bulan',
    docQuota: 100,
    isUnlimited: false,
    storageGb: 10,
    color: 'blue',
    popular: true,
    features: [
      'Hingga 100 Dokumen RAG',
      'Penyimpanan CDN 10 GB Dedicated',
      'Prioritas Node Edge PoP Jakarta',
      'Vector Embeddings RAG Cepat',
      'Ekspor Metadata Dokumen & SOP'
    ],
    isSystem: true
  },
  {
    id: 'pkg-enterprise',
    key: 'enterprise',
    name: 'Paket Enterprise (BUMD)',
    tagline: 'Kapasitas maksimal terintegrasi untuk instansi skala besar',
    price: 999000,
    billingPeriod: '/bulan',
    docQuota: 999999,
    isUnlimited: true,
    storageGb: 100,
    color: 'purple',
    features: [
      'Dokumen RAG Tanpa Batas (Unlimited)',
      'Penyimpanan CDN 100 GB Full Akses',
      'Multi-tenant Repositori Lintas Sektor',
      'Signed URL Proteksi Berkas Privat',
      'SLA Uptime 99.9% & Dukungan Prioritas 24/7'
    ],
    isSystem: true
  }
];

const DEFAULT_DUMMY_USERS: UserQuotaItem[] = [
  {
    id: 'usr-budi-pam',
    name: 'Budi Santoso',
    email: 'budi.santoso@pamjaya.co.id',
    role: 'user',
    organizationName: 'PAM Jaya (DKI Jakarta)',
    department: 'Distribusi & Pemeliharaan Jaringan',
    planKey: 'free',
    planName: 'Paket Free (Dasar)',
    docQuota: 5,
    docCount: 5,
    status: 'active'
  },
  {
    id: 'usr-ratna-pam',
    name: 'Ratna Wulandari',
    email: 'ratna.w@pamjaya.co.id',
    role: 'user',
    organizationName: 'PAM Jaya (DKI Jakarta)',
    department: 'Laboratorium & Kualitas Air',
    planKey: 'free',
    planName: 'Paket Free (Dasar)',
    docQuota: 5,
    docCount: 3,
    status: 'active'
  },
  {
    id: 'usr-dewi-bjb',
    name: 'Dewi Lestari',
    email: 'dewi.lestari@bankbjb.co.id',
    role: 'user',
    organizationName: 'Bank BJB (Jawa Barat)',
    department: 'Divisi Kredit Komersial & UMKM',
    planKey: 'pro',
    planName: 'Paket Pro (Bisnis)',
    docQuota: 100,
    docCount: 48,
    status: 'active'
  },
  {
    id: 'usr-fajar-bjb',
    name: 'Fajar Nugraha',
    email: 'fajar.nugraha@bankbjb.co.id',
    role: 'user',
    organizationName: 'Bank BJB (Jawa Barat)',
    department: 'Kepatuhan & Tata Kelola Perbankan',
    planKey: 'free',
    planName: 'Paket Free (Dasar)',
    docQuota: 5,
    docCount: 4,
    status: 'active'
  },
  {
    id: 'usr-hendra-psj',
    name: 'Hendra Wijaya',
    email: 'hendra.w@pasarjaya.co.id',
    role: 'admin',
    organizationName: 'Perumda Pasar Jaya',
    department: 'Operasional & Distribusi Pasar',
    planKey: 'pro',
    planName: 'Paket Pro (Bisnis)',
    docQuota: 100,
    docCount: 76,
    status: 'active'
  },
  {
    id: 'usr-bambang-trx',
    name: 'Bambang Soetrisno',
    email: 'bambang.s@transjakarta.co.id',
    role: 'admin',
    organizationName: 'PT Transjakarta',
    department: 'Operasional Armada & Rute',
    planKey: 'enterprise',
    planName: 'Paket Enterprise (BUMD)',
    docQuota: 999999,
    docCount: 142,
    status: 'active'
  },
  {
    id: 'usr-siti-bjb',
    name: 'Siti Rahma',
    email: 'siti.rahma@bankbjb.co.id',
    role: 'admin',
    organizationName: 'Bank BJB (Jawa Barat)',
    department: 'Risk Management & Knowledge',
    planKey: 'enterprise',
    planName: 'Paket Enterprise (BUMD)',
    docQuota: 999999,
    docCount: 96,
    status: 'active'
  },
  {
    id: 'usr-andi-pam',
    name: 'Andi Pratama',
    email: 'andi.pratama@pamjaya.co.id',
    role: 'admin',
    organizationName: 'PAM Jaya (DKI Jakarta)',
    department: 'Teknologi Informasi & Pengetahuan',
    planKey: 'enterprise',
    planName: 'Paket Enterprise (BUMD)',
    docQuota: 999999,
    docCount: 124,
    status: 'active'
  },
  {
    id: 'usr-rina-mrt',
    name: 'Rina Melati',
    email: 'rina.melati@mrtjakarta.co.id',
    role: 'user',
    organizationName: 'PT MRT Jakarta',
    department: 'Pelayanan Pelanggan & Ticketing',
    planKey: 'free',
    planName: 'Paket Free (Dasar)',
    docQuota: 5,
    docCount: 2,
    status: 'active'
  },
  {
    id: 'usr-husmi-trt',
    name: 'Ir. Husmi',
    email: 'husmi@tirtawening.co.id',
    role: 'admin',
    organizationName: 'Perumda Air Minum Tirtawening',
    department: 'Direksi Operasional Air Bersih',
    planKey: 'pro',
    planName: 'Paket Pro (Bisnis)',
    docQuota: 100,
    docCount: 35,
    status: 'active'
  },
  {
    id: 'usr-ahmad-jkr',
    name: 'Ahmad Fauzi',
    email: 'ahmad.fauzi@jamkrida.co.id',
    role: 'user',
    organizationName: 'PT Jamkrida Jabar',
    department: 'Penjaminan Kredit Daerah',
    planKey: 'free',
    planName: 'Paket Free (Dasar)',
    docQuota: 5,
    docCount: 5,
    status: 'active'
  },
  {
    id: 'usr-nadia-png',
    name: 'Nadia Safitri',
    email: 'nadia.s@panganjabar.co.id',
    role: 'user',
    organizationName: 'BUMD Pangan Jabar',
    department: 'Rantai Pasok Logistik',
    planKey: 'pro',
    planName: 'Paket Pro (Bisnis)',
    docQuota: 100,
    docCount: 64,
    status: 'active'
  }
];

export const QuotaManagementPage: React.FC = () => {
  const { currentUser } = useApp();

  // Tab State: 'packages' (Katalog & Harga Paket) vs 'users' (Alokasi Kuota Pengguna)
  const [activeTab, setActiveTab] = useState<'packages' | 'users'>('packages');

  // Master Packages State
  const [packages, setPackages] = useState<PackageTier[]>(() => {
    const saved = localStorage.getItem('kms_packages_master_store');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_PACKAGES;
  });

  // User List State
  const [userList, setUserList] = useState<UserQuotaItem[]>(() => {
    const saved = localStorage.getItem('kms_admin_user_quota_store');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_DUMMY_USERS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('all');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit / Add Package Modal States
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [isEditingPackage, setIsEditingPackage] = useState(false);
  const [targetPackageId, setTargetPackageId] = useState<string | null>(null);

  const [pkgName, setPkgName] = useState('');
  const [pkgTagline, setPkgTagline] = useState('');
  const [pkgPrice, setPkgPrice] = useState<number>(0);
  const [pkgDocQuota, setPkgDocQuota] = useState<number>(50);
  const [pkgIsUnlimited, setPkgIsUnlimited] = useState<boolean>(false);
  const [pkgStorageGb, setPkgStorageGb] = useState<number>(5);
  const [pkgColor, setPkgColor] = useState<PackageTier['color']>('blue');
  const [pkgFeaturesStr, setPkgFeaturesStr] = useState<string>('');

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<UserQuotaItem | null>(null);
  const [selectedPlanKey, setSelectedPlanKey] = useState<string>('free');
  const [customQuota, setCustomQuota] = useState<number>(5);
  const [isSavingQuota, setIsSavingQuota] = useState(false);

  // Add Dummy User Modal State
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserOrg, setNewUserOrg] = useState('PAM Jaya (DKI Jakarta)');
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user');
  const [newUserPlanKey, setNewUserPlanKey] = useState<string>('free');

  // Persist Packages to LocalStorage
  useEffect(() => {
    localStorage.setItem('kms_packages_master_store', JSON.stringify(packages));
  }, [packages]);

  // Persist Users to LocalStorage
  useEffect(() => {
    localStorage.setItem('kms_admin_user_quota_store', JSON.stringify(userList));
  }, [userList]);

  const formatRupiah = (val: number) => {
    if (!val || val === 0) return 'Gratis (Rp 0)';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // --- Handlers for Package Management ---
  const handleOpenAddPackage = () => {
    setIsEditingPackage(false);
    setTargetPackageId(null);
    setPkgName('');
    setPkgTagline('');
    setPkgPrice(150000);
    setPkgDocQuota(50);
    setPkgIsUnlimited(false);
    setPkgStorageGb(5);
    setPkgColor('emerald');
    setPkgFeaturesStr('50 Dokumen RAG Terindeks\nPenyimpanan CDN 5 GB\nPencarian Semantik Cepat\nDukungan Teknis');
    setPackageModalOpen(true);
  };

  const handleOpenEditPackage = (pkg: PackageTier) => {
    setIsEditingPackage(true);
    setTargetPackageId(pkg.id);
    setPkgName(pkg.name);
    setPkgTagline(pkg.tagline);
    setPkgPrice(pkg.price);
    setPkgDocQuota(pkg.docQuota);
    setPkgIsUnlimited(pkg.isUnlimited);
    setPkgStorageGb(pkg.storageGb);
    setPkgColor(pkg.color);
    setPkgFeaturesStr(pkg.features.join('\n'));
    setPackageModalOpen(true);
  };

  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName.trim()) {
      alert('Nama paket wajib diisi.');
      return;
    }

    const featureList = pkgFeaturesStr
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    const docQuotaNum = pkgIsUnlimited ? 999999 : Math.max(1, Number(pkgDocQuota) || 1);

    if (isEditingPackage && targetPackageId) {
      setPackages(prev => prev.map(p => {
        if (p.id === targetPackageId) {
          return {
            ...p,
            name: pkgName.trim(),
            tagline: pkgTagline.trim(),
            price: Number(pkgPrice) || 0,
            docQuota: docQuotaNum,
            isUnlimited: pkgIsUnlimited,
            storageGb: Number(pkgStorageGb) || 1,
            color: pkgColor,
            features: featureList
          };
        }
        return p;
      }));

      // Update existing users in that package if they were on it
      setUserList(prev => prev.map(u => {
        const found = packages.find(p => p.id === targetPackageId);
        if (found && u.planKey === found.key) {
          return {
            ...u,
            planName: pkgName.trim(),
            docQuota: docQuotaNum
          };
        }
        return u;
      }));

      setFeedbackMsg({
        type: 'success',
        text: `Paket "${pkgName}" berhasil diperbarui: Harga ${formatRupiah(pkgPrice)} & Kuota ${pkgIsUnlimited ? 'Unlimited' : `${docQuotaNum} Dokumen`}.`
      });
    } else {
      const generatedKey = `pkg-${Date.now().toString(36)}`;
      const newPkg: PackageTier = {
        id: `pkg-${Date.now()}`,
        key: generatedKey,
        name: pkgName.trim(),
        tagline: pkgTagline.trim(),
        price: Number(pkgPrice) || 0,
        billingPeriod: '/bulan',
        docQuota: docQuotaNum,
        isUnlimited: pkgIsUnlimited,
        storageGb: Number(pkgStorageGb) || 1,
        color: pkgColor,
        features: featureList,
        isSystem: false
      };

      setPackages(prev => [...prev, newPkg]);
      setFeedbackMsg({
        type: 'success',
        text: `Paket baru "${newPkg.name}" berhasil ditambahkan ke katalog langganan!`
      });
    }

    setPackageModalOpen(false);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleDeletePackage = (pkg: PackageTier) => {
    if (pkg.isSystem) {
      alert('Paket sistem bawaan (Free, Pro, Enterprise) tidak dapat dihapus.');
      return;
    }
    if (window.confirm(`Hapus paket "${pkg.name}" dari katalog? Pengguna dalam paket ini akan dipindahkan ke Paket Free.`)) {
      setPackages(prev => prev.filter(p => p.id !== pkg.id));
      setUserList(prev => prev.map(u => {
        if (u.planKey === pkg.key) {
          return {
            ...u,
            planKey: 'free',
            planName: 'Paket Free (Dasar)',
            docQuota: 5
          };
        }
        return u;
      }));
      setFeedbackMsg({ type: 'success', text: `Paket "${pkg.name}" telah dihapus.` });
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  // --- Handlers for User Quota Management ---
  const handleOpenEditUser = (user: UserQuotaItem) => {
    setEditingUser(user);
    const targetPkg = packages.find(p => p.key === user.planKey) || packages[0];
    setSelectedPlanKey(user.planKey);
    setCustomQuota(user.docQuota || targetPkg.docQuota);
    setFeedbackMsg(null);
  };

  const handleSelectUserPlan = (key: string) => {
    setSelectedPlanKey(key);
    const targetPkg = packages.find(p => p.key === key);
    if (targetPkg) {
      setCustomQuota(targetPkg.docQuota);
    }
  };

  const handleSaveUserQuota = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSavingQuota(true);

    try {
      const targetPkg = packages.find(p => p.key === selectedPlanKey);
      const isUnlim = targetPkg?.isUnlimited || customQuota >= 999999;
      const finalQuota = isUnlim ? 999999 : Number(customQuota);

      setUserList(prev => prev.map(u => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            planKey: selectedPlanKey,
            planName: targetPkg?.name || 'Paket Kustom',
            docQuota: finalQuota
          };
        }
        return u;
      }));

      setEditingUser(null);
      setFeedbackMsg({
        type: 'success',
        text: `Paket & kuota untuk "${editingUser.name}" berhasil diubah menjadi ${targetPkg?.name || selectedPlanKey} (${isUnlim ? 'Unlimited' : `${finalQuota} Dokumen`}).`
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } finally {
      setIsSavingQuota(false);
    }
  };

  const handleCreateDummyUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      alert('Nama dan email wajib diisi.');
      return;
    }

    const targetPkg = packages.find(p => p.key === newUserPlanKey) || packages[0];
    const newUser: UserQuotaItem = {
      id: `usr-custom-${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      organizationName: newUserOrg,
      department: 'Divisi Operasional & Manajemen',
      planKey: targetPkg.key,
      planName: targetPkg.name,
      docQuota: targetPkg.docQuota,
      docCount: 0,
      status: 'active'
    };

    setUserList(prev => [newUser, ...prev]);
    setAddUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setFeedbackMsg({
      type: 'success',
      text: `Pengguna dummy "${newUser.name}" berhasil ditambahkan dengan ${targetPkg.name}.`
    });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleResetAllDummyData = () => {
    if (window.confirm('Kembalikan seluruh katalog paket & kuota pengguna ke nilai bawaan?')) {
      setPackages(DEFAULT_PACKAGES);
      setUserList(DEFAULT_DUMMY_USERS);
      localStorage.setItem('kms_packages_master_store', JSON.stringify(DEFAULT_PACKAGES));
      localStorage.setItem('kms_admin_user_quota_store', JSON.stringify(DEFAULT_DUMMY_USERS));
      setFeedbackMsg({ type: 'success', text: 'Katalog paket dan data pengguna berhasil di-reset ke nilai default.' });
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const filteredUsers = userList.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.organizationName?.toLowerCase().includes(q);

    const matchPlan = selectedPlanFilter === 'all' || u.planKey === selectedPlanFilter;
    return matchSearch && matchPlan;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Manajemen Paket & Kuota
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Mode Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Atur tarif harga paket, batas kuota dokumen, kapasitas CDN, serta alokasi ke pengguna BUMD.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeTab === 'packages' ? (
            <button
              onClick={handleOpenAddPackage}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Paket Baru</span>
            </button>
          ) : (
            <button
              onClick={() => setAddUserModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah User Dummy</span>
            </button>
          )}

          <button
            onClick={handleResetAllDummyData}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer shadow-xs"
            title="Reset ke pengaturan bawaan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Default</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs: Katalog Paket vs Alokasi Kuota Pengguna */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('packages')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'packages'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
        >
          <Coins className="w-4 h-4" />
          <span>Katalog Harga & Kuota Paket ({packages.length} Paket)</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
        >
          <Users className="w-4 h-4" />
          <span>Alokasi Kuota Pengguna ({userList.length} User)</span>
        </button>
      </div>

      {/* Feedback Alert Toast */}
      {feedbackMsg && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in ${feedbackMsg.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: KATALOG HARGA & KUOTA PAKET (PRICING & TIER MASTER) */}
      {/* ========================================================================= */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Daftar Paket Langganan & Batas Kuota Dokumen
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Setiap perubahan harga atau batas kuota di sini akan otomatis diterapkan pada opsi alokasi pengguna.
              </p>
            </div>
            <button
              onClick={handleOpenAddPackage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Paket Baru</span>
            </button>
          </div>

          {/* Grid Kartu Paket */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => {
              const userCountInPkg = userList.filter(u => u.planKey === pkg.key).length;

              const badgeColor =
                pkg.color === 'purple' ? 'border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20' :
                  pkg.color === 'blue' ? 'border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20' :
                    pkg.color === 'emerald' ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20' :
                      pkg.color === 'amber' ? 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20' :
                        'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';

              return (
                <div
                  key={pkg.id}
                  className={`rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all relative overflow-hidden ${badgeColor}`}
                >
                  {pkg.popular && (
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-bold px-3 py-0.5 rounded-bl-lg uppercase tracking-wider">
                      Populer
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Header Card */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          {pkg.name}
                        </span>
                        {pkg.isUnlimited && (
                          <Crown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {pkg.tagline}
                      </p>
                    </div>

                    {/* Harga Paket */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                          {formatRupiah(pkg.price)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {pkg.billingPeriod}
                        </span>
                      </div>
                    </div>

                    {/* Kuota Dokumen & Storage CDN Specs */}
                    <div className="grid grid-cols-2 gap-2 bg-white/80 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Batas Dokumen</span>
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                          <Package className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          {pkg.isUnlimited ? 'Unlimited' : `${pkg.docQuota} Dokumen`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Storage CDN</span>
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                          <HardDrive className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          {pkg.storageGb} GB
                        </span>
                      </div>
                    </div>

                    {/* Fitur-Fitur Paket */}
                    <div className="space-y-2 pt-1 text-xs">
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                        Keunggulan Paket:
                      </span>
                      <ul className="space-y-1.5">
                        {pkg.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
                            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Footer Card Actions */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Digunakan: <strong className="text-slate-700 dark:text-slate-200">{userCountInPkg} Pengguna</strong>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditPackage(pkg)}
                        className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit Harga & Kuota</span>
                      </button>

                      {!pkg.isSystem && (
                        <button
                          onClick={() => handleDeletePackage(pkg)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Paket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ALOKASI KUOTA PENGGUNA (USER ALLOCATION TABLE) */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Plan Filter Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              onClick={() => setSelectedPlanFilter('all')}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${selectedPlanFilter === 'all'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-600'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
            >
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Semua Pengguna</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{userList.length}</p>
            </div>

            {packages.map(p => {
              const count = userList.filter(u => u.planKey === p.key).length;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlanFilter(p.key)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${selectedPlanFilter === p.key
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-600'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                >
                  <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">{p.name}</span>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{count}</p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {formatRupiah(p.price)} · {p.isUnlimited ? 'Unlimited' : `${p.docQuota} Dok`}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Alokasi Kuota Dokumen Pengguna</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Menampilkan {filteredUsers.length} pengguna terdaftar
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-full sm:w-64 relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama, email, organisasi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-8.5 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/50">
                    <th className="py-3 px-4">Pengguna</th>
                    <th className="py-3 px-4">Organisasi</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Paket Aktif</th>
                    <th className="py-3 px-4">Penggunaan Kuota</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        Tidak ada pengguna yang cocok dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const targetPkg = packages.find(p => p.key === u.planKey);
                      const isUnlimited = targetPkg?.isUnlimited || u.docQuota >= 999999 || u.role === 'admin' || u.role === 'superadmin';
                      const maxQ = isUnlimited ? 999999 : (u.docQuota || targetPkg?.docQuota || 5);
                      const isFull = !isUnlimited && u.docCount >= maxQ;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                                {u.name?.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{u.name}</p>
                                <p className="text-[11px] text-slate-400">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[170px]">{u.organizationName}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.role === 'admin' || u.role === 'superadmin'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                              {u.role}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isUnlimited
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                : u.planKey === 'pro'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                              }`}>
                              {targetPkg?.name || u.planName || 'Free'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            {isUnlimited ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                <Crown className="w-3.5 h-3.5" />
                                <span>Unlimited ({u.docCount} Dokumen)</span>
                              </span>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`font-semibold ${isFull ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                                    {u.docCount} / {maxQ} Dokumen
                                  </span>
                                  {isFull && (
                                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-900">
                                      Penuh
                                    </span>
                                  )}
                                </div>
                                <div className="w-28 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${isFull ? 'bg-rose-500' : 'bg-blue-600'}`}
                                    style={{ width: `${Math.min(100, (u.docCount / maxQ) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 mx-auto transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Atur Paket & Kuota</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH / EDIT MASTER PAKET (PRICING & QUOTA) */}
      {/* ========================================================================= */}
      {packageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isEditingPackage ? 'Edit Harga & Kuota Paket' : 'Buat Paket Langganan Baru'}
                </h3>
              </div>
              <button
                onClick={() => setPackageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Paket
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Paket Pro Plus / Lembaga BUMD"
                  value={pkgName}
                  onChange={(e) => setPkgName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tagline / Deskripsi Singkat
                </label>
                <input
                  type="text"
                  placeholder="Misal: Solusi penyimpanan kuota dokumen skala menengah"
                  value={pkgTagline}
                  onChange={(e) => setPkgTagline(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Harga & Kuota Dokumen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tarif Harga (Rp / bulan)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 tabular-nums"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {formatRupiah(pkgPrice)} per bulan
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Batas Kuota Dokumen
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    disabled={pkgIsUnlimited}
                    value={pkgIsUnlimited ? 999999 : pkgDocQuota}
                    onChange={(e) => setPkgDocQuota(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:opacity-50 tabular-nums"
                  />
                  <label className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pkgIsUnlimited}
                      onChange={(e) => setPkgIsUnlimited(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Tanpa Batas Kuota (Unlimited)</span>
                  </label>
                </div>
              </div>

              {/* Storage CDN & Warna */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kapasitas Storage Edge CDN (GB)
                  </label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={pkgStorageGb}
                    onChange={(e) => setPkgStorageGb(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tema Warna Badge
                  </label>
                  <select
                    value={pkgColor}
                    onChange={(e) => setPkgColor(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="slate">Slate (Default / Free)</option>
                    <option value="blue">Blue (Pro / Bisnis)</option>
                    <option value="indigo">Indigo (Corporate)</option>
                    <option value="purple">Purple (Enterprise)</option>
                    <option value="emerald">Emerald (Dedicated)</option>
                    <option value="amber">Amber (Special)</option>
                  </select>
                </div>
              </div>

              {/* Fitur-Fitur Paket */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Daftar Fitur Paket (1 baris per fitur)
                </label>
                <textarea
                  rows={4}
                  value={pkgFeaturesStr}
                  onChange={(e) => setPkgFeaturesStr(e.target.value)}
                  placeholder="Maksimal 100 Dokumen RAG&#10;Penyimpanan CDN 10 GB&#10;Dukungan Prioritas"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPackageModalOpen(false)}
                  className="px-3.5 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  {isEditingPackage ? 'Simpan Perubahan Paket' : 'Terbitkan Paket Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ATUR PAKET & KUOTA PENGGUNA */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Atur Paket & Kuota Pengguna</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <p className="text-[11px] text-slate-400 font-medium">Pengguna Terpilih:</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{editingUser.name}</p>
              <p className="text-xs text-slate-400">{editingUser.email} · {editingUser.organizationName}</p>
              <div className="mt-2 text-xs flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span>Dokumen saat ini:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{editingUser.docCount} dokumen</span>
              </div>
            </div>

            <form onSubmit={handleSaveUserQuota} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pilih Paket Dari Katalog Langganan
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {packages.map(p => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectUserPlan(p.key)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${selectedPlanKey === p.key
                          ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 ring-1 ring-blue-600'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{p.name}</span>
                          {p.isUnlimited && <Crown className="w-3 h-3 text-purple-600" />}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          {p.isUnlimited ? 'Unlimited Dokumen' : `Batas ${p.docQuota} Dokumen`} · Storage {p.storageGb} GB
                        </span>
                      </div>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {formatRupiah(p.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kuota Dokumen Custom Adjustment */}
              {selectedPlanKey !== 'enterprise' ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Batas Maksimal Kuota Dokumen
                    </label>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                      {customQuota} Dokumen
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={customQuota}
                    onChange={(e) => setCustomQuota(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 tabular-nums"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Bisa disesuaikan khusus untuk kebutuhan user ini.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 text-xs flex items-center gap-2">
                  <Crown className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Pengguna memiliki akses tanpa batas kuota dokumen & penyimpanan (Enterprise).</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingQuota}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  {isSavingQuota ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH PENGGUNA DUMMY BARU */}
      {/* ========================================================================= */}
      {addUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tambah Pengguna Dummy Baru</h3>
              </div>
              <button
                onClick={() => setAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDummyUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Dimas Ramadhan"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Akun
                </label>
                <input
                  type="email"
                  required
                  placeholder="Misal: dimas.r@bumd.co.id"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Instansi Organisasi BUMD
                </label>
                <select
                  value={newUserOrg}
                  onChange={(e) => setNewUserOrg(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="PAM Jaya (DKI Jakarta)">PAM Jaya (DKI Jakarta)</option>
                  <option value="Bank BJB (Jawa Barat)">Bank BJB (Jawa Barat)</option>
                  <option value="Perumda Pasar Jaya">Perumda Pasar Jaya</option>
                  <option value="PT Transjakarta">PT Transjakarta</option>
                  <option value="PT MRT Jakarta">PT MRT Jakarta</option>
                  <option value="Perumda Air Minum Tirtawening">Perumda Air Minum Tirtawening</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role Akun
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Paket Langganan
                  </label>
                  <select
                    value={newUserPlanKey}
                    onChange={(e) => setNewUserPlanKey(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    {packages.map(p => (
                      <option key={p.id} value={p.key}>
                        {p.name} ({formatRupiah(p.price)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddUserModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  Tambahkan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
