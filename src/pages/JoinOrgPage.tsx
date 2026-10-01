import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  Search, 
  CheckCircle2, 
  Users, 
  FileText, 
  UserPlus, 
  Sparkles,
  ShieldCheck,
  LogOut,
  AlertTriangle,
  X
} from 'lucide-react';

export const JoinOrgPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { organizations, currentUser, currentOrganization, joinOrganization, leaveOrganization } = useApp();

  const urlSearch = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [selectedType, setSelectedType] = useState('all');
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null && q !== searchQuery) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const categories = [
    { id: 'all', label: 'Semua Kategori' },
    { id: 'BUMD Air Minum', label: 'Air Minum' },
    { id: 'BUMD Perbankan', label: 'Perbankan' },
    { id: 'BUMD Pangan & Pasar', label: 'Pangan & Pasar' },
    { id: 'BUMD Transportasi', label: 'Transportasi' },
    { id: 'BUMD Energi & Infrastruktur', label: 'Energi & Infra' },
  ];

  const filteredOrgs = organizations.filter(o => {
    const q = searchQuery.toLowerCase();
    const matchSearch = o.name.toLowerCase().includes(q) ||
      o.city.toLowerCase().includes(q) ||
      o.type.toLowerCase().includes(q) ||
      (o.description || '').toLowerCase().includes(q) ||
      (o.adminName || '').toLowerCase().includes(q);
    const matchType = selectedType === 'all' || o.type === selectedType;
    return matchSearch && matchType;
  });

  const handleJoin = (orgId: string, orgName: string) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const res = joinOrganization(orgId);
    if (res.success) {
      setFeedback({ type: 'success', message: `Berhasil bergabung ke ${orgName}!` });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleConfirmLeave = () => {
    const orgName = currentOrganization?.name || 'organisasi';
    leaveOrganization();
    setLeaveModalOpen(false);
    setFeedback({ type: 'success', message: `Anda telah keluar dari ${orgName}.` });
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full pb-10">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Keanggotaan Organisasi
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {currentOrganization 
            ? 'Informasi organisasi aktif dan status keanggotaan Anda.' 
            : 'Pilih organisasi untuk mengakses repositori dokumen dan unggahan berkas RAG.'}
        </p>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs animate-in fade-in ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STATE 1: USER IS CURRENTLY JOINED TO AN ORGANIZATION */}
      {currentOrganization ? (
        <div className="space-y-6">
          {/* Active Organization Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-700/80">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shrink-0">
                  {currentOrganization.code.slice(0, 3)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                      {currentOrganization.name}
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Organisasi Aktif Anda
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {currentOrganization.type} · {currentOrganization.city}, {currentOrganization.province} · Kode: <span className="font-mono font-semibold">{currentOrganization.code}</span>
                  </p>
                  <p className="text-xs text-slate-400 pt-2 leading-relaxed max-w-2xl">
                    {currentOrganization.description}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row md:flex-col items-center gap-2 shrink-0">
                <Link
                  to="/app/documents"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Buka Repositori</span>
                </Link>

                <button
                  onClick={() => setLeaveModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Keluar Organisasi</span>
                </button>
              </div>
            </div>

            {/* Metrics Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-700/60">
              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
                <div className="flex items-center gap-2 text-slate-400 text-[11px] mb-1">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Basis Pengetahuan</span>
                </div>
                <p className="text-base font-bold text-white">{currentOrganization.documentsCount} Topik</p>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
                <div className="flex items-center gap-2 text-slate-400 text-[11px] mb-1">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Total Anggota</span>
                </div>
                <p className="text-base font-bold text-white">{currentOrganization.usersCount} Pengguna</p>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
                <div className="flex items-center gap-2 text-slate-400 text-[11px] mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>RAG AI Retrieval</span>
                </div>
                <p className="text-base font-bold text-white">Siap Digunakan</p>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
                <div className="flex items-center gap-2 text-slate-400 text-[11px] mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Status Akun</span>
                </div>
                <p className="text-base font-bold text-emerald-300">Terverifikasi</p>
              </div>
            </div>
          </div>

          {/* Info Card about Switching Organization */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Peraturan Keanggotaan Multi-Tenant KMS</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Setiap pengguna hanya dapat terdaftar pada satu organisasi aktif dalam satu waktu demi menjaga privasi dan isolasi repositori dokumen RAG organisasi. Untuk bergabung ke organisasi lain, silakan klik tombol <strong>Keluar Organisasi</strong> di atas terlebih dahulu.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STATE 2: USER IS NOT CURRENTLY JOINED TO ANY ORGANIZATION */
        <div className="space-y-6">
          {/* Banner Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-amber-900">
            <div className="p-2 bg-amber-100/80 rounded-xl text-amber-700 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-amber-950">
                Anda Belum Tergabung dalam Organisasi
              </h3>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Pilih salah satu organisasi di bawah ini untuk mulai mengakses repositori berkas &amp; dokumen RAG.
              </p>
            </div>
          </div>

          {/* Search & Categories Bar */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari organisasi berdasarkan nama, kota, sektor, atau PIC admin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedType(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    selectedType === cat.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Directory Grid */}
          {filteredOrgs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredOrgs.map((o) => (
                <div
                  key={o.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-100 dark:from-slate-700 to-slate-200 dark:to-slate-600 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {o.code.slice(0, 3)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug truncate">
                          {o.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {o.city} · <span className="font-medium text-slate-700 dark:text-slate-300">{o.type}</span>
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 line-clamp-3 leading-relaxed">
                      {o.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span><strong>{o.usersCount}</strong> Anggota</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span><strong>{o.documentsCount}</strong> Topik Pengetahuan</span>
                      </div>
                      <div className="col-span-2 text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        PIC: {o.adminName || 'Admin BUMD'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => handleJoin(o.id, o.name)}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer group"
                    >
                      <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Gabung Organisasi</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tidak ada organisasi yang cocok dengan pencarian "{searchQuery}".
              </p>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal to Leave Organization */}
      {leaveModalOpen && currentOrganization && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Keluar dari Organisasi?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Apakah Anda yakin ingin keluar dari <strong className="text-slate-800 dark:text-slate-200">{currentOrganization.name}</strong>? 
                  Anda tidak akan dapat lagi mengakses repositori dokumen dan berkas RAG organisasi ini sampai Anda bergabung kembali.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setLeaveModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmLeave}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ya, Keluar Organisasi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
