import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, tokenStore } from '../services/api';
import {
  KeyRound,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  Clock
} from 'lucide-react';

interface ApiKeyRow {
  id: string;
  userId: string;
  label: string;
  prefix: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  userName?: string | null;
  userEmail?: string | null;
  copyable?: boolean;
}

function authHeaders() {
  return { Authorization: `Bearer ${tokenStore.get() || ''}` };
}

export const ApiKeysPage: React.FC = () => {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [label, setLabel] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [userEmails, setUserEmails] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [newKeyOwner, setNewKeyOwner] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/api-keys`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setKeys(data.keys || []);
    } catch (err) {
      console.error('[API KEYS FETCH ERROR]', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
    // Saran email pemilik (endpoint khusus admin; gagal = tanpa saran).
    fetch(`${API_BASE_URL}/users`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setUserEmails((d.users || []).map((u: any) => u.email).filter(Boolean)))
      .catch(() => {});
  }, [fetchKeys]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsCreating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/api-keys`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim() || undefined, userEmail: ownerEmail.trim() || undefined })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Gagal membuat kunci API.');
        return;
      }
      setNewKey(data.apiKey);
      setNewKeyOwner(data.key?.user?.email || null);
      setLabel('');
      setOwnerEmail('');
      fetchKeys();
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Cabut kunci ini? Setelah dicabut, kunci langsung tidak bisa dipakai lagi dan tidak dapat dipulihkan.')) return;
    setRevokingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/api-keys/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) fetchKeys();
    } catch (err) {
      console.error('[API KEY REVOKE ERROR]', err);
    } finally {
      setRevokingId(null);
    }
  };

  const copyToClipboard = () => {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Salin kunci lengkap dari daftar (diambil dari server saat diklik).
  const copyKey = async (id: string) => {
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/api-keys/${id}/reveal`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Gagal mengambil kunci.');
        return;
      }
      await navigator.clipboard.writeText(data.apiKey);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err: any) {
      setError(err?.message || 'Gagal menyalin kunci.');
    }
  };

  const fmtDate = (d: string | null) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return d;
    }
  };

  const activeKeys = keys.filter(k => !k.revokedAt);
  const revokedKeys = keys.filter(k => k.revokedAt);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Kunci API
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Terbitkan dan kelola kunci API untuk integrasi eksternal (mis. akses teman/mitra ke endpoint
          <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">ragkms.aiones.app</code>
          lewat header <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">X-API-Key</code>).
        </p>
      </div>

      {/* Panduan singkat */}
      <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 space-y-1.5">
        <div className="flex items-center gap-1.5 font-semibold">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Cara pakai</span>
        </div>
        <p>
          Kirim header <code className="px-1 py-0.5 rounded bg-white/70 dark:bg-slate-900/60 font-mono">X-API-Key: kms_ak_...</code>{' '}
          (atau <code className="px-1 py-0.5 rounded bg-white/70 dark:bg-slate-900/60 font-mono">Authorization: Bearer kms_ak_...</code>) pada
          setiap request ke <code className="px-1 py-0.5 rounded bg-white/70 dark:bg-slate-900/60 font-mono">https://ragkms.aiones.app/api/...</code>.
          Kunci memiliki akses sebesar akun pemiliknya (email yang dipilih saat membuat), dan semua project/dokumen yang dibuat lewat kunci tercatat atas nama pemilik itu. Bisa dicabut kapan saja tanpa memengaruhi kunci lain.
        </p>
      </div>

      {/* Form buat kunci baru */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Buat Kunci Baru</h3>
        </div>

        {newKey ? (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Kunci berhasil dibuat{newKeyOwner ? ` untuk ${newKeyOwner}` : ''}. Kunci bisa disalin lagi kapan saja dari daftar Kunci Aktif.</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 text-xs font-mono break-all text-slate-800 dark:text-slate-200">
                {newKey}
              </code>
              <button
                type="button"
                onClick={copyToClipboard}
                className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setNewKey(null)}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Tutup & buat kunci lain
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email pemilik kunci
              </label>
              <input
                type="email"
                list="api-key-owner-emails"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="kosongkan = akun Anda sendiri"
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              <datalist id="api-key-owner-emails">
                {userEmails.map(em => <option key={em} value={em} />)}
              </datalist>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nama / label kunci
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="kosongkan = nama pemilik"
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Buat Kunci</span>
            </button>
          </form>
        )}

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Daftar kunci aktif */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Kunci Aktif ({activeKeys.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="py-8 flex justify-center text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : activeKeys.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">Belum ada kunci API yang dibuat.</p>
        ) : (
          <div className="space-y-2">
            {activeKeys.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">{k.label}</span>
                    <code className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {k.prefix}...
                    </code>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Dibuat: {fmtDate(k.createdAt)}</span>
                    <span>Terakhir dipakai: {fmtDate(k.lastUsedAt)}</span>
                  </div>
                  {(k.userName || k.userEmail) && (
                    <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                      Pemilik: <span className="font-medium">{k.userName}</span>
                      {k.userEmail && <span className="ml-1 font-mono text-slate-400">({k.userEmail})</span>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => copyKey(k.id)}
                  disabled={!k.copyable}
                  title={k.copyable ? 'Salin kunci lengkap' : 'Kunci lama: dibuat sebelum fitur salin, tidak bisa ditampilkan lagi'}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {copiedId === k.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === k.id ? 'Tersalin' : 'Salin'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRevoke(k.id)}
                  disabled={revokingId === k.id}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-60"
                >
                  {revokingId === k.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Cabut</span>
                </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Riwayat kunci dicabut */}
      {revokedKeys.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs opacity-70">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <Trash2 className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Riwayat Dicabut ({revokedKeys.length})
            </h3>
          </div>
          <div className="space-y-1.5">
            {revokedKeys.map((k) => (
              <div key={k.id} className="flex items-center justify-between gap-3 p-2 text-xs text-slate-400 dark:text-slate-500">
                <span className="truncate">{k.label} — <code className="font-mono">{k.prefix}...</code></span>
                <span className="shrink-0">Dicabut: {fmtDate(k.revokedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeysPage;
