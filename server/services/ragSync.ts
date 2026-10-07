import { getPool } from '../db';
import { deleteFromKroomboxCDN } from './cdn';
import fs from 'fs';
import path from 'path';

export interface ReconcileResult {
  success: boolean;
  purgedCount: number;
  purgedDocuments: Array<{ id: string; title: string; cdnFileId?: string }>;
  errors?: string[];
}

// Throttle cache to avoid hammering RAG service when multiple requests come in at once
let lastSyncTimestamp = 0;
const MIN_SYNC_INTERVAL_MS = 15 * 1000; // 15 seconds throttle

/**
 * Reconciles the local database and CDN with the RAG service at https://rag.aiones.app/.
 * When a document was deleted on https://rag.aiones.app/, it is automatically
 * removed from this project's MySQL database and permanently deleted from Kroombox CDN.
 */
export async function reconcileRagDeletions(orgId?: string, force: boolean = false): Promise<ReconcileResult> {
  const now = Date.now();
  if (!force && (now - lastSyncTimestamp) < MIN_SYNC_INTERVAL_MS) {
    return { success: true, purgedCount: 0, purgedDocuments: [] };
  }
  lastSyncTimestamp = now;

  let p: any;
  try {
    p = getPool();
  } catch {
    // Database pool not ready yet
    return { success: false, purgedCount: 0, purgedDocuments: [], errors: ['Database belum siap'] };
  }

  const purgedDocs: Array<{ id: string; title: string; cdnFileId?: string }> = [];
  const errors: string[] = [];

  try {
    // 1. Fetch organizations with active knowledge base IDs
    let sqlOrg = 'SELECT id, name, knowledge_base FROM organizations WHERE knowledge_base IS NOT NULL AND knowledge_base != ""';
    const orgParams: any[] = [];
    if (orgId && orgId !== 'all') {
      sqlOrg += ' AND id = ?';
      orgParams.push(orgId);
    }
    const [orgs] = (await p.query(sqlOrg, orgParams)) as [any[], any];
    if (!orgs || orgs.length === 0) {
      return { success: true, purgedCount: 0, purgedDocuments: [] };
    }

    const RAG_BASE_URL = process.env.RAG_BASE_URL || 'https://rag.aiones.app';
    const RAG_API_KEY = process.env.RAG_API_KEY || '';

    if (!RAG_API_KEY) {
      console.warn('[RAG SYNC] RAG_API_KEY belum disetel di .env; lewati sinkronisasi penghapusan.');
      return { success: false, purgedCount: 0, purgedDocuments: [], errors: ['RAG_API_KEY tidak disetel'] };
    }

    for (const org of orgs) {
      const kbId = org.knowledge_base;
      try {
        // 2. Fetch list of active documents for this knowledge base from RAG
        const ragUrl = `${RAG_BASE_URL}/api/v1/knowledge?knowledge_base_id=${encodeURIComponent(kbId)}&limit=1000`;
        const res = await fetch(ragUrl, {
          headers: {
            'Authorization': `Bearer ${RAG_API_KEY}`
          }
        });

        if (!res.ok) {
          console.warn(`[RAG SYNC WARN] Gagal mengambil daftar knowledge RAG untuk ${org.name} (${res.status})`);
          continue;
        }

        const data = await res.json().catch(() => ({}));
        if (!data.success && !data.data) {
          continue;
        }

        const ragDocuments: any[] = Array.isArray(data.data?.documents)
          ? data.data.documents
          : (Array.isArray(data.data) ? data.data : []);

        // Himpunan ID dan Nama dokumen yang MASIH AKTIF di RAG
        const activeRagIds = new Set<string>();
        const activeRagNames = new Set<string>();

        for (const rd of ragDocuments) {
          if (rd.document_id) {
            activeRagIds.add(String(rd.document_id).toLowerCase().trim());
          }
          if (rd.document_name) {
            const rawName = String(rd.document_name).toLowerCase().trim();
            activeRagNames.add(rawName);
            // Simpan juga versi tanpa ekstensi .txt / .pdf
            activeRagNames.add(rawName.replace(/\.[a-z0-9]+$/i, ''));
          }
        }

        // 3. Ambil seluruh dokumen lokal di MySQL untuk organisasi ini
        // Beri masa tenggang 60 detik (created_at <= 60 detik lalu) agar dokumen yang baru diunggah
        // tidak terhapus saat proses indeks awal sedang berlangsung
        const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
        const [localDocs] = (await p.query(
          `SELECT id, organization_id, title, file_name, cdn_file_id, file_url, created_at 
           FROM documents 
           WHERE organization_id = ? AND (created_at <= ? OR created_at IS NULL)`,
          [org.id, sixtySecondsAgo]
        )) as [any[], any];

        for (const doc of localDocs) {
          const docIdLower = String(doc.id || '').toLowerCase().trim();
          const cdnFileIdLower = String(doc.cdn_file_id || '').toLowerCase().trim();
          const fileNameLower = String(doc.file_name || '').toLowerCase().trim();
          const baseFileNameLower = fileNameLower.replace(/\.[a-z0-9]+$/i, '');
          const titleLower = String(doc.title || '').toLowerCase().trim();

          // Cek apakah dokumen ini masih ada di RAG
          const existsInRag =
            activeRagIds.has(docIdLower) ||
            (cdnFileIdLower && activeRagIds.has(`doc-seed-${cdnFileIdLower}`)) ||
            (cdnFileIdLower && Array.from(activeRagIds).some(rid => rid.includes(cdnFileIdLower))) ||
            activeRagNames.has(fileNameLower) ||
            activeRagNames.has(baseFileNameLower) ||
            (titleLower && activeRagNames.has(titleLower));

          // Jika dokumen tidak ditemukan sama sekali di RAG, berarti telah dihapus di https://rag.aiones.app/!
          if (!existsInRag) {
            console.log(`[RAG SYNC -> PURGE] Dokumen "${doc.title}" (${doc.id}) terdeteksi telah dihapus di https://rag.aiones.app/. Memulai pembersihan otomatis dari CDN & database...`);

            // 1. Hapus aset fisik dari Kroombox Edge CDN
            if (doc.cdn_file_id) {
              try {
                await deleteFromKroomboxCDN(doc.cdn_file_id);
                console.log(`[RAG SYNC -> CDN] Berkas CDN ID: ${doc.cdn_file_id} berhasil dihapus.`);
              } catch (cdnErr: any) {
                console.warn(`[RAG SYNC -> CDN ERROR] Gagal menghapus berkas CDN:`, cdnErr?.message);
              }
            }

            // 2. Hapus berkas lokal fallback jika tersimpan di /uploads/
            if (doc.file_url && doc.file_url.startsWith('/uploads/')) {
              try {
                const localPath = path.resolve('.' + doc.file_url);
                if (fs.existsSync(localPath)) {
                  fs.unlinkSync(localPath);
                }
              } catch (fErr) {
                console.warn('[RAG SYNC -> LOCAL FILE ERROR]', fErr);
              }
            }

            // 3. Hapus record dari MySQL database
            await p.query('DELETE FROM documents WHERE id = ?', [doc.id]);

            // 4. Catat ke log aktivitas
            await p.query(`
              INSERT INTO activity_logs (id, organization_id, organization_name, actor_name, actor_role, action, target, type)
              VALUES (?, ?, ?, 'Sistem Sinkronisasi RAG', 'system', 'Hapus Otomatis (Dihapus di RAG)', ?, 'document')
            `, [`act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, org.id, org.name, doc.title]);

            purgedDocs.push({
              id: doc.id,
              title: doc.title,
              cdnFileId: doc.cdn_file_id
            });
          }
        }
      } catch (orgErr: any) {
        console.warn(`[RAG SYNC ERROR] Gagal memproses ${org.name}:`, orgErr?.message || orgErr);
        errors.push(`${org.name}: ${orgErr?.message || orgErr}`);
      }
    }
  } catch (err: any) {
    console.warn('[RAG SYNC TOP-LEVEL ERROR]', err?.message || err);
    errors.push(err?.message || String(err));
  }

  return {
    success: true,
    purgedCount: purgedDocs.length,
    purgedDocuments: purgedDocs,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Direct webhook receiver when RAG service or an external caller notifies about document deletion
 */
export async function handleRagDocumentDeletedWebhook(payload: any): Promise<{ success: boolean; message: string; doc?: any }> {
  let p: any;
  try {
    p = getPool();
  } catch {
    return { success: false, message: 'Database belum siap' };
  }

  const documentId = payload.document_id || payload.documentId || payload.id;
  const documentName = payload.document_name || payload.documentName || payload.name;

  if (!documentId && !documentName) {
    return { success: false, message: 'Parameter document_id atau document_name diperlukan.' };
  }

  const clauses: string[] = [];
  const params: any[] = [];

  if (documentId) {
    clauses.push('id = ? OR cdn_file_id = ? OR id = ?');
    params.push(documentId, documentId, `doc-seed-${documentId}`);
  }
  if (documentName) {
    clauses.push('file_name = ? OR title = ?');
    params.push(documentName, documentName);
  }

  const sql = `SELECT * FROM documents WHERE ${clauses.join(' OR ')}`;
  const [rows] = (await p.query(sql, params)) as [any[], any];

  if (!rows || rows.length === 0) {
    return { success: true, message: 'Dokumen tidak ditemukan di database (mungkin sudah terhapus).' };
  }

  for (const doc of rows) {
    // 1. Hapus dari Kroombox CDN
    if (doc.cdn_file_id) {
      try {
        await deleteFromKroomboxCDN(doc.cdn_file_id);
      } catch (cdnErr) {
        console.warn('[WEBHOOK CDN DELETE WARN]', cdnErr);
      }
    }

    // 2. Hapus berkas lokal fallback
    if (doc.file_url && doc.file_url.startsWith('/uploads/')) {
      try {
        const localPath = path.resolve('.' + doc.file_url);
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      } catch (fErr) {}
    }

    // 3. Hapus dari database
    await p.query('DELETE FROM documents WHERE id = ?', [doc.id]);

    // 4. Catat ke log aktivitas
    await p.query(`
      INSERT INTO activity_logs (id, organization_id, organization_name, actor_name, actor_role, action, target, type)
      VALUES (?, ?, ?, 'RAG Webhook', 'system', 'Hapus Otomatis (RAG Webhook)', ?, 'document')
    `, [`act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, doc.organization_id, null, doc.title]);
  }

  return { success: true, message: `${rows.length} dokumen berhasil dihapus dari database & CDN.`, doc: rows[0] };
}
