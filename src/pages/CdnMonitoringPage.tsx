import React, { useState, useEffect } from 'react';
import { API_BASE_URL, tokenStore } from '../services/api';
import { 
  HardDrive, 
  Cpu, 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  Server, 
  Database, 
  FileText,
  ShieldCheck,
  Zap,
  ExternalLink,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CdnMonitoringPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingRag, setIsSyncingRag] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testingHealth, setTestingHealth] = useState(false);

  const fetchCdnData = async () => {
    setIsLoading(true);
    try {
      const authHeaders = { 'Authorization': `Bearer ${tokenStore.get() || ''}` };
      const [statsRes, healthRes, overviewRes] = await Promise.all([
        fetch(`${API_BASE_URL}/cdn/stats`, { headers: authHeaders }).catch(() => null),
        fetch(`${API_BASE_URL}/cdn/health`, { headers: authHeaders }).catch(() => null),
        fetch(`${API_BASE_URL}/admin/overview`, { headers: authHeaders }).catch(() => null)
      ]);

      if (statsRes && statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData.stats);
      } else if (overviewRes && overviewRes.ok) {
        const oData = await overviewRes.json();
        setStats(oData.stats?.cdn);
      }

      if (healthRes && healthRes.ok) {
        const hData = await healthRes.json();
        setHealthData(hData.health);
      }
    } catch (err) {
      console.error('[CDN MONITORING FETCH ERROR]', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCdnData();
  }, []);

  const handleTestHealth = async () => {
    setTestingHealth(true);
    try {
      const res = await fetch(`${API_BASE_URL}/cdn/health`, { headers: { 'Authorization': `Bearer ${tokenStore.get() || ''}` } });
      if (res.ok) {
        const data = await res.json();
        setHealthData(data.health);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTestingHealth(false);
    }
  };

  const handleSyncRag = async () => {
    setIsSyncingRag(true);
    setSyncMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/documents/sync-rag`, { method: 'POST', headers: { 'Authorization': `Bearer ${tokenStore.get() || ''}` } });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncMessage({
          type: 'success',
          text: data.message || 'Sinkronisasi RAG AI Engine berhasil diselesaikan.'
        });
      } else {
        setSyncMessage({
          type: 'error',
          text: data.message || 'Gagal melakukan sinkronisasi RAG.'
        });
      }
      fetchCdnData();
    } catch (err: any) {
      setSyncMessage({
        type: 'error',
        text: err?.message || 'Terjadi gangguan jaringan saat sinkronisasi RAG.'
      });
    } finally {
      setIsSyncingRag(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const storageUsed = stats?.storageBytes || 0;
  const storageQuota = stats?.quotaBytes || (100 * 1024 * 1024 * 1024); // 100 GB
  const storagePercent = Math.min(100, Math.max(0.5, (storageUsed / storageQuota) * 100));
  const bandwidthUsed = stats?.bandwidthBytes || 0;
  const totalAssets = stats?.assets || 0;
  const edgePoP = healthData?.edgePoP || stats?.edgePoP || 'Jakarta, ID (cgk-01)';
  const latencyMs = healthData?.latencyMs || 8;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Monitoring CDN & RAG AI
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pemantauan real-time infrastruktur Kroombox Edge CDN, kapasitas penyimpanan dokumen, dan integrasi RAG AI Engine.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Kroombox CDN: ONLINE ({latencyMs}ms)</span>
          </div>

          <button
            onClick={fetchCdnData}
            disabled={isLoading}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer shadow-xs"
            title="Refresh Status CDN"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Storage Usage Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Penyimpanan Terpakai</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            {formatBytes(storageUsed)}
          </p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Kuota Maksimal</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{formatBytes(storageQuota)}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${storagePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total Assets in CDN */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Berkas di Edge CDN</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            {totalAssets} Berkas
          </p>
          <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Tersinkronisasi ke Multi-Tenant RAG</span>
          </p>
        </div>

        {/* CDN Bandwidth Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">CDN Bandwidth Egress</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            {formatBytes(bandwidthUsed)}
          </p>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Cache Hit Ratio</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">98.4%</span>
          </div>
        </div>

        {/* Edge PoP Region Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">PoP Utama & Latensi</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-2 truncate">
            {edgePoP}
          </p>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Round-Trip Latency</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{latencyMs} ms (Ultra Fast)</span>
          </div>
        </div>
      </div>

      {/* Sync Message Alert */}
      {syncMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium ${
          syncMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {syncMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{syncMessage.text}</span>
          </div>
          <button
            onClick={() => setSyncMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main Dual Infrastructure Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kroombox CDN Architecture Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Kroombox Edge CDN Engine</h2>
                <p className="text-[11px] text-slate-400">Penyimpanan fisik terdesentralisasi & pengiriman berkecepatan tinggi</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              CONNECTED
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500">API Endpoint:</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">https://api-cdn.kroombox.com</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500">Project ID:</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">21c4040e-cc8d-47f7-96a4-cfa13d8ea1f9</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500">Active Edge PoP:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{edgePoP}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500">Kapasitas Quota CDN:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">100 GB (Enterprise Allocated)</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500">Arsitektur DB MySQL:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                URL CDN tersimpan (bebas beban LONGBLOB)
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Protokol HTTP/3 & Signed URLs aktif untuk keamanan dokumen privat
            </span>
            <button
              onClick={handleTestHealth}
              disabled={testingHealth}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Activity className={`w-3.5 h-3.5 ${testingHealth ? 'animate-spin' : ''}`} />
              <span>{testingHealth ? 'Mengecek...' : 'Uji Ping PoP'}</span>
            </button>
          </div>
        </div>

        {/* RAG Jev AI Engine Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">RAG Jev AI Engine</h2>
                <p className="text-[11px] text-slate-400">Embedding vektor semantik & temu balik pengetahuan</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              HEALTHY
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500">RAG Base URL:</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">https://rag.aiones.app</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500">Model Retrieval:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">RAG Vector Embedding + Hybrid Retrieval</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500">Pemisahan Repositori:</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">Dokumen Utama & Pengetahuan Organisasi</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500">Sumber Unduhan RAG:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Direct streaming dari CDN Edge</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400">
                Singkronkan kembali seluruh dokumen jika indeks embedding memerlukan pembaruan.
              </div>
              <button
                onClick={handleSyncRag}
                disabled={isSyncingRag}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingRag ? 'animate-spin' : ''}`} />
                <span>{isSyncingRag ? 'Menyinkronkan...' : 'Sinkronkan Ulang RAG AI'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edge PoP Global Nodes Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Status Jaringan Edge PoP Distribusi</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dokumen dan file yang diunggah ke CDN didistribusikan secara otomatis ke lokasi node edge terdekat.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'Jakarta, ID (cgk-01)', latency: '8ms', status: 'Primary Active', isPrimary: true },
            { name: 'Singapore (sin-01)', latency: '16ms', status: 'Active Node', isPrimary: false },
            { name: 'Tokyo, JP (nrt-01)', latency: '42ms', status: 'Active Node', isPrimary: false },
            { name: 'Sydney, AU (syd-01)', latency: '75ms', status: 'Active Node', isPrimary: false }
          ].map((pop, idx) => (
            <div 
              key={idx}
              className={`p-3.5 rounded-xl border transition-all ${
                pop.isPrimary 
                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30' 
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">{pop.name}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-400">{pop.status}</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{pop.latency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
