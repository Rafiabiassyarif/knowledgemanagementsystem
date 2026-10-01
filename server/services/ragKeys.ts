import { getPool } from '../db';
import dotenv from 'dotenv';

dotenv.config();

const RAG_BASE_URL = process.env.RAG_BASE_URL || 'https://rag.aiones.app';
// Operator/master key from .env — used ONLY to mint/revoke per-project keys, never exposed to clients.
const RAG_API_KEY = process.env.RAG_API_KEY || '';

if (!RAG_API_KEY) {
  console.warn('[RAG KEYS] RAG_API_KEY tidak ditemukan di .env — key per project tidak dapat dibuat.');
}

export interface ProjectRagKeyResult {
  key: string;
  keyId: string | null;
  source: 'existing' | 'created' | 'fallback';
}

/**
 * Pastikan tabel pemetaan project -> RAG key tersedia (idempotent, dipanggil lazy).
 */
async function ensureTable(): Promise<void> {
  const p = getPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS project_rag_keys (
      project_id VARCHAR(64) PRIMARY KEY,
      rag_key_id VARCHAR(64) NULL,
      rag_key_value TEXT NOT NULL,
      label VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      revoked_at TIMESTAMP NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

/**
 * Ambil key RAG aktif milik project dari DB (jika ada).
 */
async function findActiveKey(projectId: string): Promise<{ keyId: string | null; keyValue: string } | null> {
  const p = getPool();
  const [rows] = await p.query<any[]>(
    'SELECT rag_key_id, rag_key_value FROM project_rag_keys WHERE project_id = ? AND revoked_at IS NULL ORDER BY created_at DESC LIMIT 1',
    [projectId]
  );
  if (rows.length === 0) return null;
  return { keyId: rows[0].rag_key_id || null, keyValue: rows[0].rag_key_value };
}

/**
 * Minta RAG service membuat API key baru untuk project.
 * Return null jika request gagal (mis. RAG sedang down).
 */
async function createRagKeyViaApi(projectId: string, projectName: string): Promise<{ key: string; keyId: string } | null> {
  if (!RAG_API_KEY) return null;
  try {
    const res = await fetch(`${RAG_BASE_URL}/api/v1/settings/api-keys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RAG_API_KEY}`,
        'Content-Type': 'application/json'
      },
      // Catatan: JANGAN kirim user_id/application_id/organization_id berbeda dari
      // konteks operator — RAG menolak dengan 403 kecuali key operator punya
      // permission khusus. Cukup label + permissions (mewarisi konteks operator).
      body: JSON.stringify({
        label: `kms-project-${projectId}`,
        permissions: ['read', 'write']
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) {
      console.warn(`[RAG KEYS WARN] Gagal membuat key untuk project ${projectId} (HTTP ${res.status})`);
      return null;
    }

    const data: any = await res.json().catch(() => null);
    const key: string | undefined = data?.data?.key;
    const keyId: string | undefined = data?.data?.entry?.key_id;
    if (!key) {
      console.warn('[RAG KEYS WARN] Respons create key tidak memuat nilai key:', JSON.stringify(data).slice(0, 200));
      return null;
    }
    console.log(`[RAG KEYS OK] Key RAG baru dibuat untuk project "${projectName}" (${projectId})`);
    return { key, keyId: keyId || '' };
  } catch (err: any) {
    console.warn('[RAG KEYS WARN] Koneksi ke RAG gagal saat membuat key:', err?.message || err);
    return null;
  }
}

/**
 * Pastikan project memiliki API key RAG sendiri (idempotent):
 * 1. Ada di DB -> pakai yang lama.
 * 2. Belum ada -> mint via RAG API, simpan ke DB.
 * 3. RAG down / gagal -> fallback ke master key agar upload knowledge tidak terblokir.
 */
export async function ensureProjectRagKey(projectId: string, projectName: string = ''): Promise<ProjectRagKeyResult> {
  try {
    await ensureTable();

    const existing = await findActiveKey(projectId);
    if (existing) {
      return { key: existing.keyValue, keyId: existing.keyId, source: 'existing' };
    }

    const created = await createRagKeyViaApi(projectId, projectName);
    if (created) {
      const p = getPool();
      await p.query(
        `INSERT INTO project_rag_keys (project_id, rag_key_id, rag_key_value, label)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE rag_key_id = VALUES(rag_key_id), rag_key_value = VALUES(rag_key_value), revoked_at = NULL`,
        [projectId, created.keyId || null, created.key, `kms-project-${projectId}`]
      );
      return { key: created.key, keyId: created.keyId || null, source: 'created' };
    }
  } catch (err: any) {
    console.warn('[RAG KEYS WARN] ensureProjectRagKey gagal:', err?.message || err);
  }

  // Fallback: tetap index-able memakai master key (kalau ada).
  return { key: RAG_API_KEY, keyId: null, source: 'fallback' };
}

/**
 * Cabut & hapus key RAG milik project (dipanggil saat project dihapus). Best-effort, non-blocking.
 */
export async function revokeProjectRagKey(projectId: string): Promise<void> {
  try {
    await ensureTable();
    const existing = await findActiveKey(projectId);
    if (!existing) return;

    if (existing.keyId && RAG_API_KEY) {
      await fetch(`${RAG_BASE_URL}/api/v1/settings/api-keys/${encodeURIComponent(existing.keyId)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${RAG_API_KEY}` },
        signal: AbortSignal.timeout(10000)
      }).catch((err: any) => console.warn('[RAG KEYS WARN] Revoke key gagal (diabaikan):', err?.message || err));
    }

    const p = getPool();
    await p.query('UPDATE project_rag_keys SET revoked_at = CURRENT_TIMESTAMP WHERE project_id = ?', [projectId]);
    console.log(`[RAG KEYS OK] Key RAG project ${projectId} dicabut.`);
  } catch (err: any) {
    console.warn('[RAG KEYS WARN] revokeProjectRagKey gagal (diabaikan):', err?.message || err);
  }
}
