import { getPool } from '../db';
import { deleteFromKroomboxCDN } from './cdn';
import { listAllRagKnowledgeBases } from './rag';
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
 * Rekonsiliasi database lokal & CDN dengan layanan RAG di https://rag.aiones.app/.
 *
 * PENGAMAN: secara default fungsi ini HANYA MEMERIKSA (dry-run) dan tidak pernah
 * menghapus apa pun. Penghapusan otomatis pernah menyebabkan data produksi hilang
 * (nama berkas di DB NULL sehingga dokumen dianggap "sudah dihapus di RAG").
 * Penghapusan hanya berjalan bila `allowDelete` bernilai true — yaitu saat admin
 * menekan tombol sinkronisasi manual.
 */
export async function reconcileRagDeletions(orgId?: string, force: boolean = false, allowDelete: boolean = false): Promise<ReconcileResult> {
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
        // Catatan: RAG menolak limit > 500 (422), jadi pakai 500.
        const ragUrl = `${RAG_BASE_URL}/api/v1/knowledge?knowledge_base_id=${encodeURIComponent(kbId)}&limit=500`;
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
        const ragChunksByName = new Map<string, number>();

        for (const rd of ragDocuments) {
          if (rd.document_id) {
            activeRagIds.add(String(rd.document_id).toLowerCase().trim());
          }
          if (rd.document_name) {
            const rawName = String(rd.document_name).toLowerCase().trim();
            activeRagNames.add(rawName);
            // Simpan juga versi tanpa ekstensi .txt / .pdf
            activeRagNames.add(rawName.replace(/\.[a-z0-9]+$/i, ''));
            ragChunksByName.set(rawName, Number(rd.chunks) || 0);
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
            (fileNameLower && activeRagNames.has(fileNameLower)) ||
            (baseFileNameLower && activeRagNames.has(baseFileNameLower)) ||
            (titleLower && activeRagNames.has(titleLower));

          // Selalu selaraskan jumlah chunk dengan angka asli dari RAG (hanya UPDATE, tidak menghapus).
          const matchedName = [fileNameLower, baseFileNameLower, titleLower].find(
            (n) => n && ragChunksByName.has(n)
          );
          if (matchedName) {
            const realChunks = ragChunksByName.get(matchedName) || 0;
            await p.query('UPDATE documents SET chunks_count = ? WHERE id = ? AND (chunks_count IS NULL OR chunks_count != ?)', [realChunks, doc.id, realChunks]);
          }

          // Jika dokumen tidak ditemukan di RAG, dokumen mungkin sudah dihapus di
          // https://rag.aiones.app/. Penghapusan HANYA dijalankan bila allowDelete=true
          // (tombol sinkronisasi manual admin) — worker latar belakang tidak menghapus apa pun.
          if (!existsInRag && allowDelete) {
            // Pengaman: Jangan pernah hapus dokumen seed atau dokumen default platform
            if (doc.id.startsWith('doc-seed-')) {
              continue;
            }
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

export interface AutoImportResult {
  success: boolean;
  importedCount: number;
  imported: Array<{ id: string; name: string; code: string; knowledgeBaseId: string }>;
  error?: string;
}

/** Penanda pemilik project hasil auto-import (KB dibuat langsung di rag.aiones.app). */
export const AUTO_IMPORT_OWNER = 'Sistem (Auto-Import RAG)';

// Throttle terpisah khusus auto-import KB (tidak berbagi batas waktu dengan reconcileRagDeletions)
let lastKbImportTimestamp = 0;
const MIN_KB_IMPORT_INTERVAL_MS = 45 * 1000;

/**
 * Sinkronisasi OTOMATIS satu arah: KB baru di rag.aiones.app -> project baru di KMS.
 *
 * PENGAMAN WAJIB (rag.aiones.app adalah server BERSAMA lintas aplikasi, bukan
 * eksklusif milik KMS ini):
 *   1. SEMUA Knowledge Base yang terdaftar di RAG (apa pun pola namanya --
 *      prefix "kb_" dan lainnya) diimpor jadi project baru di KMS. Ini
 *      keputusan eksplisit user: lebih penting semua KB di RAG kebaca,
 *      walau artinya KB app lain (kb-vibecontent-*, dm-*, dst) ikut
 *      tersalin sebagai project di KMS BUMD.
 *   2. KB yang sudah terdaftar sebagai knowledge_base project manapun di KMS
 *      dilewati (tidak dibuat duplikat).
 *   3. Project baru dibuat dengan status 'active' dan ditandai sumbernya
 *      ("Diimpor otomatis dari rag.aiones.app") lewat kolom description agar
 *      admin tahu asal-usulnya saat meninjau.
 *   4. Best-effort & non-blocking -- kegagalan RAG tidak pernah mengganggu
 *      server utama (dipanggil dari worker interval, bukan dari request user).
 */
export async function autoImportNewRagKnowledgeBases(force: boolean = false): Promise<AutoImportResult> {
  const now = Date.now();
  if (!force && (now - lastKbImportTimestamp) < MIN_KB_IMPORT_INTERVAL_MS) {
    return { success: true, importedCount: 0, imported: [] };
  }
  lastKbImportTimestamp = now;

  const imported: Array<{ id: string; name: string; code: string; knowledgeBaseId: string }> = [];

  try {
    const p = getPool();
    const ragResult = await listAllRagKnowledgeBases();
    if (!ragResult.success) {
      return { success: false, importedCount: 0, imported: [], error: ragResult.error };
    }

    // Semua KB di RAG dianggap kandidat (tidak difilter prefix) -- keputusan user.
    const candidates = ragResult.data || [];
    if (candidates.length === 0) {
      return { success: true, importedCount: 0, imported: [] };
    }

    const [existingOrgs] = await p.query<any[]>(
      'SELECT knowledge_base FROM organizations WHERE knowledge_base IS NOT NULL AND knowledge_base != ""'
    );
    const existingKbSet = new Set(existingOrgs.map(o => o.knowledge_base));

    for (const kb of candidates) {
      if (existingKbSet.has(kb.knowledgeBaseId)) continue;

      // Buang prefix "kb_" bila ada; sisanya (nama KB apa pun bentuknya, mis.
      // "dm-640d79d2-...", "testing-bumd") dirapikan jadi kode project valid.
      const slug = kb.knowledgeBaseId.replace(/^kb_/, '').slice(0, 30);
      const code = `RAG-${slug}`.toUpperCase().replace(/[^A-Z0-9_-]/g, '-').slice(0, 40);
      const name = `[RAG] ${slug.replace(/[_-]/g, ' ')}`;
      const orgId = `org-ragimport-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      try {
        // Hindari tabrakan kode jika proses berjalan dua kali bersamaan.
        const [dup] = await p.query<any[]>('SELECT id FROM organizations WHERE LOWER(code) = LOWER(?)', [code]);
        if (dup.length > 0) continue;

        await p.query(
          `INSERT INTO organizations (id, name, code, knowledge_base, type, description, admin_name, status)
           VALUES (?, ?, ?, ?, 'Lainnya', ?, ?, 'active')`,
          [
            orgId, name, code, kb.knowledgeBaseId,
            `Project dibuat otomatis oleh sistem karena Knowledge Base "${kb.knowledgeBaseId}" terdeteksi sudah ada di rag.aiones.app (${kb.documents} dokumen, ${kb.chunks} chunk) namun belum terdaftar di KMS. Tinjau & lengkapi detail project ini.`,
            AUTO_IMPORT_OWNER
          ]
        );

        await p.query(`
          INSERT INTO activity_logs (id, organization_id, organization_name, actor_name, actor_role, action, target, type)
          VALUES (?, ?, ?, 'Sistem Sinkronisasi RAG', 'system', 'Auto-Import Project dari RAG', ?, 'organization')
        `, [`act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, orgId, name, name]);

        console.log(`[RAG AUTO-IMPORT OK] Project baru "${name}" (${code}) dibuat dari KB RAG "${kb.knowledgeBaseId}".`);
        imported.push({ id: orgId, name, code, knowledgeBaseId: kb.knowledgeBaseId });
      } catch (rowErr: any) {
        console.warn(`[RAG AUTO-IMPORT WARN] Gagal impor KB "${kb.knowledgeBaseId}":`, rowErr?.message || rowErr);
      }
    }

    return { success: true, importedCount: imported.length, imported };
  } catch (err: any) {
    console.warn('[RAG AUTO-IMPORT TOP-LEVEL ERROR]', err?.message || err);
    return { success: false, importedCount: imported.length, imported, error: err?.message || String(err) };
  }
}
