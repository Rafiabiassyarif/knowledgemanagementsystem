import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BottomSheet } from './BottomSheet';
import { OrgType, Organization } from '../../types';
import { Building2, AlertTriangle, Check } from 'lucide-react';

interface EditOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  org: Organization | null;
}

export const EditOrgModal: React.FC<EditOrgModalProps> = ({ isOpen, onClose, org }) => {
  const { updateOrganization } = useApp();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<OrgType>('BUMD Air Minum');
  const [sector, setSector] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const orgTypes: OrgType[] = [
    'BUMD Air Minum',
    'BUMD Perbankan',
    'BUMD Pangan & Pasar',
    'BUMD Transportasi',
    'BUMD Energi & Infrastruktur'
  ];

  useEffect(() => {
    if (org) {
      setName(org.name || '');
      setCode(org.code || '');
      setDescription(org.description || '');
      setType(org.type || 'BUMD Air Minum');
      setSector(org.sector || '');
      setProvince(org.province || '');
      setCity(org.city || '');
      setAdminName(org.adminName || '');
      setAdminEmail(org.adminEmail || '');
      setKnowledgeBase(org.knowledgeBase || ('kb_' + (org.code || 'utama').toLowerCase().replace(/[^a-z0-9_]/g, '_')));
      setErrorMessage(null);
    }
  }, [org]);

  if (!isOpen || !org) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !code.trim()) {
      setErrorMessage('Nama dan kode unik organisasi wajib diisi.');
      return;
    }

    updateOrganization(org.id, {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      knowledgeBase: knowledgeBase.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') || undefined,
      description: description.trim(),
      type,
      sector: sector.trim() || 'Utilitas Publik',
      province: province.trim() || 'Jawa Barat',
      city: city.trim() || 'Bandung',
      adminName: adminName.trim(),
      adminEmail: adminEmail.trim(),
    });

    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Data Organisasi"
      subtitle={`Perbarui rincian profil organisasi ${org.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Perumda Air Minum Tirtawening"
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
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="TRT-BDG-01"
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
            />
          </div>
        </div>

        {/* Knowledge Base (RAG Partition) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
            <span>Knowledge Base (Partisi RAG AI) *</span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">Pemisah dokumen RAG AI</span>
          </label>
          <input
            type="text"
            required
            value={knowledgeBase}
            onChange={(e) => setKnowledgeBase(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
            placeholder="kb_nama_project"
            className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-mono font-bold placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            Kode unik untuk menghubungkan dan mempartisi memori AI pada RAG Service (<code className="text-blue-600 dark:text-blue-400">https://rag.aiones.app</code>).
          </p>
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
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              placeholder="Contoh: Air Bersih & Sanitasi"
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Region */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Provinsi
            </label>
            <input
              type="text"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              placeholder="Jawa Barat"
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Kota / Kabupaten
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Kota Bandung"
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Admin PIC & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nama Admin PIC
            </label>
            <input
              type="text"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="Ir. Husmi"
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Admin PIC
            </label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="husmi@bumd.id"
              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Deskripsi Singkat
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi layanan atau profil BUMD..."
            className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            Simpan Perubahan
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};
