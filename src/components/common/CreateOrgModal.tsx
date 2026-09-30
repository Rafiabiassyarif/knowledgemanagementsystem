import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BottomSheet } from './BottomSheet';
import { OrgType } from '../../types';
import { Building2, Plus, Shield, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface CreateOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateOrgModal: React.FC<CreateOrgModalProps> = ({ isOpen, onClose }) => {
  const { addOrganization, currentUser } = useApp();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<OrgType>('BUMD Air Minum');
  const [sector, setSector] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [adminName, setAdminName] = useState(currentUser?.role === 'admin' ? currentUser.name : '');
  const [adminEmail, setAdminEmail] = useState(currentUser?.role === 'admin' ? currentUser.email : '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const orgTypes: OrgType[] = [
    'BUMD Air Minum',
    'BUMD Perbankan',
    'BUMD Pangan & Pasar',
    'BUMD Transportasi',
    'BUMD Energi & Infrastruktur'
  ];

  const hasActiveOrg = currentUser?.role === 'admin' && Boolean(currentUser?.organizationId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const finalAdminName = (currentUser?.role === 'admin' ? currentUser.name : adminName).trim();
    const finalAdminEmail = (currentUser?.role === 'admin' ? currentUser.email : adminEmail).trim();
    if (!name.trim() || !code.trim() || !finalAdminName || !finalAdminEmail) {
      setErrorMessage('Harap lengkapi semua kolom wajib (*)');
      return;
    }

    const res = addOrganization({
      name,
      code: code.toUpperCase().trim(),
      description,
      type,
      sector: sector || 'Utilitas Publik',
      province: province || 'DKI Jakarta',
      city: city || 'Jakarta',
      adminId: currentUser?.role === 'admin' ? currentUser.id : `admin-${Date.now()}`,
      adminName: finalAdminName,
      adminEmail: finalAdminEmail,
      status: 'active'
    });

    if (!res.success) {
      setErrorMessage(res.message);
      return;
    }

    // Reset and close
    setName('');
    setCode('');
    setDescription('');
    setSector('');
    setProvince('');
    setCity('');
    setErrorMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Organisasi Baru"
      subtitle="Daftarkan entitas BUMD atau organisasi baru ke dalam jaringan KMS"
    >
      {/* Admin 1-Org Limit Check Alert */}
      {hasActiveOrg ? (
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-xs text-amber-950 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Batas Kuota Tercapai: Maksimal 1 Organisasi per Admin</span>
            </div>
            <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              Akun Anda saat ini telah memiliki dan mengelola organisasi aktif <strong>{currentUser?.organizationName}</strong>. 
              Sesuai kebijakan KMS BUMD, setiap akun Admin dibatasi memiliki <strong>maksimal 1 organisasi</strong>.
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Jika Anda ingin membuat organisasi baru, Anda dapat <strong>menghapus organisasi saat ini</strong> terlebih dahulu melalui menu Pengaturan atau tombol Hapus Organisasi di Dashboard. Setelah dihapus, kuota Anda akan kembali tersedia untuk membuat 1 organisasi baru.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {currentUser?.role === 'admin' && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl text-blue-900 dark:text-blue-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span className="font-semibold block text-blue-950 dark:text-blue-200">Kebijakan 1 Akun Admin = 1 Organisasi</span>
                Anda memiliki 1 kuota pembuatan organisasi. Organisasi ini akan otomatis terhubung ke akun Anda sebagai Admin Penanggung Jawab.
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        {/* Name & Code */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nama Organisasi / BUMD *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Perumdam Tirta Asri"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!code) {
                  const autoCode = e.target.value
                    .split(' ')
                    .map(w => w[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 6);
                  if (autoCode) setCode(`${autoCode}-01`);
                }
              }}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Kode Unik Org *
            </label>
            <input
              type="text"
              required
              placeholder="TRT-ASR-01"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
            />
          </div>
        </div>

        {/* Type & Sector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tipe Organisasi *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as OrgType)}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              {orgTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Sektor Usaha
            </label>
            <input
              type="text"
              placeholder="Contoh: Pengelolaan Air Minum Daerah"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Region: Province & City */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Provinsi
            </label>
            <input
              type="text"
              placeholder="Contoh: Jawa Barat"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Kota / Kabupaten
            </label>
            <input
              type="text"
              placeholder="Contoh: Kota Bekasi"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Deskripsi Organisasi
          </label>
          <textarea
            rows={2}
            placeholder="Deskripsi singkat mandat, profil bisnis, atau fokus operasional organisasi..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>

        {/* Designated Admin */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 rounded-xl space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Admin Penanggung Jawab Organisasi</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Nama Lengkap Admin *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Ir. Herman Susanto"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Email Resmi Admin *
              </label>
              <input
                type="email"
                required
                placeholder="admin@tirtaasri.co.id"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-slate-300 dark:text-blue-200" />
            <span>Buat Organisasi</span>
          </button>
        </div>
      </form>
      )}
    </BottomSheet>
  );
};
