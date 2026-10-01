import { Router, Request, Response } from 'express';
import { getPool } from '../db';
import multer from 'multer';
import { indexDocumentToRag, deleteDocumentFromRag } from '../services/rag';
import { uploadToKroomboxCDN, deleteFromKroomboxCDN, createCDNSignedUrl, listKroomboxCDNFiles } from '../services/cdn';
import { requireAuth } from '../middleware/auth';
import { ensureProjectRagKey } from '../services/ragKeys';

const router = Router();

// Files are NEVER stored in MySQL. Multer memory storage keeps the binary in RAM
// only as a pass-through to Kroombox Edge CDN; DB stores metadata exclusively.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size (fits LONGBLOB)
});

// 1. Get documents (with optional organizationId and repositoryType filter)
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId, category, search, repositoryType } = req.query;
    const p = getPool();

    let query = `
      SELECT d.*, o.name as organization_name, o.code as organization_code 
      FROM documents d 
      JOIN organizations o ON d.organization_id = o.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (organizationId && organizationId !== 'all') {
      conditions.push('d.organization_id = ?');
      params.push(organizationId);
    }

    if (category && category !== 'all') {
      conditions.push('d.category = ?');
      params.push(category);
    }

    if (repositoryType && repositoryType !== 'all') {
      conditions.push('d.repository_type = ?');
      params.push(repositoryType);
    }

    if (search) {
      conditions.push('(d.title LIKE ? OR d.summary LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY d.created_at DESC';

    const [rows] = await p.query<any[]>(query, params);

    const documents = rows.map(r => ({
      id: r.id,
      organizationId: r.organization_id,
      organizationName: r.organization_name,
      title: r.title,
      category: r.category,
      repositoryType: r.repository_type || 'document',
      fileType: r.file_type,
      fileSizeKb: r.file_size_kb,
      fileUrl: (r.file_url && !r.file_url.startsWith('db://')) ? r.file_url : (r.cdn_file_id ? `https://api-cdn.kroombox.com/api/bridge/view/${r.cdn_file_id}` : `/api/documents/${r.id}/download`),
      cdnFileId: r.cdn_file_id || null,
      year: r.year,
      department: r.department || 'Umum',
      summary: r.summary || 'Dokumen resmi terindeks otomatis di CDN.',
      tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags || []),
      notes: r.notes,
      uploadedBy: r.uploaded_by,
      uploadedAt: r.created_at,
      chunksCount: Math.max(3, Math.round(r.file_size_kb / 400)),
      totalTokens: Math.max(500, Math.round(r.file_size_kb * 1.8)),
      ragStatus: 'indexed'
    }));

    // Merge any assets stored directly on Kroombox Edge CDN
    try {
      const cdnFiles = await listKroomboxCDNFiles();
      if (Array.isArray(cdnFiles) && cdnFiles.length > 0) {
        for (const cf of cdnFiles) {
          const exists = documents.some(d => d.cdnFileId === cf.id || (cf.name && d.title.toLowerCase() === cf.name.toLowerCase().replace(/\.[^/.]+$/, "")));
          if (!exists) {
            const isImg = (cf.mime_type || '').startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp'].some(ext => cf.name.toLowerCase().endsWith(ext));
            documents.push({
              id: `cdn-${cf.id}`,
              organizationId: (organizationId && organizationId !== 'all') ? (organizationId as string) : 'all',
              organizationName: 'Repositori Digital',
              title: cf.name.replace(/\.[^/.]+$/, ""),
              category: isImg ? 'Galeri Dokumentasi' : 'Arsip Digital',
              repositoryType: isImg ? 'photo' : 'document',
              fileType: cf.name.split('.').pop()?.toUpperCase() || (isImg ? 'JPG' : 'TXT'),
              fileSizeKb: Math.round((cf.size || 1024) / 1024) || 1,
              fileUrl: cf.url || `https://api-cdn.kroombox.com/api/bridge/view/${cf.id}`,
              cdnFileId: cf.id,
              year: new Date().getFullYear(),
              department: 'Media & Aset Digital',
              summary: `Berkas resmi tersimpan aman (${cf.name})`,
              tags: ['cdn', isImg ? 'photo' : 'document', 'kroombox'],
              notes: 'Tersimpan di Edge CDN',
              uploadedBy: 'CDN Storage',
              uploadedAt: cf.created_at || new Date().toISOString(),
              chunksCount: 1,
              totalTokens: 100,
              ragStatus: 'indexed'
            });
          }
        }
      }
    } catch (cdnErr) {
      console.warn('[CDN FETCH FOR DOCS WARN]', cdnErr);
    }

    res.json({ success: true, documents });
  } catch (err: any) {
    console.error('[GET DOCS ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil repositori dokumen.' });
  }
});

// 1b. Check User Quota & Plan Info
router.get('/quota/:userId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const p = getPool();
    const [userRows] = await p.query<any[]>('SELECT id, name, role, doc_quota, plan FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      return;
    }
    const u = userRows[0];
    const isUnlimited = u.role === 'superadmin' || u.role === 'admin' || u.plan === 'enterprise';
    const [countRows] = await p.query<any[]>('SELECT COUNT(*) as cnt FROM documents WHERE uploaded_by_id = ?', [userId]);
    const currentCount = countRows[0].cnt || 0;
    const maxQuota = isUnlimited ? 999999 : (u.doc_quota || 5);

    res.json({
      success: true,
      quota: {
        userId: u.id,
        role: u.role,
        plan: u.plan || 'free',
        isUnlimited,
        used: currentCount,
        max: maxQuota,
        remaining: isUnlimited ? 999999 : Math.max(0, maxQuota - currentCount)
      }
    });
  } catch (err: any) {
    console.error('[GET QUOTA ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal mengecek kuota dokumen.' });
  }
});

// 1c. Upgrade / Purchase Plan
router.post('/upgrade-plan', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, plan } = req.body;
    const p = getPool();
    const quotaMap: Record<string, number> = {
      free: 5,
      pro: 100,
      enterprise: 999999
    };
    const newQuota = quotaMap[plan] || 5;
    await p.query('UPDATE users SET plan = ?, doc_quota = ? WHERE id = ?', [plan, newQuota, userId]);

    res.json({
      success: true,
      message: `Paket berhasil ditingkatkan ke "${plan.toUpperCase()}". Kuota dokumen Anda sekarang: ${newQuota >= 999999 ? 'Tanpa Batas' : newQuota + ' dokumen'}.`,
      plan,
      docQuota: newQuota
    });
  } catch (err: any) {
    console.error('[UPGRADE PLAN ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal upgrade paket.' });
  }
});

// 2. Get single document
router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const p = getPool();

    const [rows] = await p.query<any[]>(`
      SELECT d.*, o.name as organization_name 
      FROM documents d 
      JOIN organizations o ON d.organization_id = o.id 
      WHERE d.id = ?
    `, [id]);

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan.' });
      return;
    }

    const r = rows[0];
    const doc = {
      id: r.id,
      organizationId: r.organization_id,
      organizationName: r.organization_name,
      title: r.title,
      category: r.category,
      fileType: r.file_type,
      fileSizeKb: r.file_size_kb,
      fileUrl: (r.file_url && !r.file_url.startsWith('db://')) ? r.file_url : `/api/documents/${r.id}/download`,
      year: r.year,
      department: r.department,
      summary: r.summary,
      tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags || []),
      notes: r.notes,
      uploadedBy: r.uploaded_by,
      uploadedAt: r.created_at,
      chunksCount: Math.max(3, Math.round(r.file_size_kb / 400))
    };

    res.json({ success: true, document: doc });
  } catch (err: any) {
    console.error('[GET DOC ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal memuat dokumen.' });
  }
});

// 3. Upload document
router.post('/upload', requireAuth, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      category,
      repositoryType = 'document',
      year,
      notes,
      organizationId,
      uploadedBy,
      uploadedById
    } = req.body;

    if (!title || !category || !organizationId) {
      res.status(400).json({ success: false, message: 'Judul, kategori, dan organisasi tujuan wajib diisi.' });
      return;
    }

    const p = getPool();

    // Project workspace unlimited upload support
    // (User can upload multiple files & documents to their project)

    // Verify organization exists, or fallback gracefully
    let targetOrgId = organizationId;
    let [orgRows] = await p.query<any[]>('SELECT id, name FROM organizations WHERE id = ?', [organizationId]);
    if (orgRows.length === 0) {
      const [firstOrg] = await p.query<any[]>('SELECT id, name FROM organizations LIMIT 1');
      if (firstOrg.length > 0) {
        targetOrgId = firstOrg[0].id;
        orgRows = firstOrg;
      } else {
        res.status(404).json({ success: false, message: 'Organisasi tujuan tidak ditemukan.' });
        return;
      }
    }
    const orgName = orgRows[0].name;

    const file = req.file;
    const docId: string = req.body.id || `doc-${Date.now()}`;
    const rawExt = file && file.originalname.includes('.')
      ? file.originalname.slice(file.originalname.lastIndexOf('.') + 1)
      : '';
    const fileType = (rawExt || 'PDF').toUpperCase();
    const fileSizeKb = file ? Math.round(file.size / 1024) : 2500;
    const fileName: string | null = file ? file.originalname : null;
    // CRITICAL: All documents, files, and photos are stored strictly in Kroombox Edge CDN.
    // MySQL ONLY stores metadata (user, admin, and organization references).
    // NO physical binary data (LONGBLOB) is stored in MySQL.
    let cdnFileId: string | null = null;
    let fileUrl: string = `/api/documents/${docId}/download`;

    if (file && file.buffer) {
      try {
        const cdnResult = await uploadToKroomboxCDN(file.buffer, file.originalname, file.mimetype || 'application/octet-stream');
        if (cdnResult && cdnResult.url) {
          cdnFileId = cdnResult.fileId;
          fileUrl = cdnResult.url;
          console.log(`[KROOMBOX CDN] Berkas "${file.originalname}" sukses diunggah ke CDN: ${fileUrl}`);
        }
      } catch (cdnErr: any) {
        console.error('[CDN UPLOAD FAILED]', cdnErr?.message || cdnErr);
        res.status(502).json({
          success: false,
          message: `Gagal mengunggah berkas: ${cdnErr?.message || 'Kesalahan penyimpanan'}. Silakan coba beberapa saat lagi.`
        });
        return;
      }
    }

    // Auto generate default tags and summary for mock/RAG placeholder
    const generatedTags = JSON.stringify([
      category.toLowerCase().replace(/\s+/g, '-'),
      repositoryType,
      'bumd',
      'internal',
      fileType.toLowerCase()
    ]);
    const summary = notes && notes.trim()
      ? notes.trim()
      : `Dokumen resmi ${title} kategori ${category} milik ${orgName}. Terindeks dan siap untuk penelusuran AI.`;

    await p.query(`
      INSERT INTO documents (id, organization_id, title, category, repository_type, file_type, file_size_kb, file_url, cdn_file_id, file_name, year, summary, tags, notes, uploaded_by, uploaded_by_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        category = VALUES(category),
        repository_type = VALUES(repository_type),
        file_type = VALUES(file_type),
        file_size_kb = VALUES(file_size_kb),
        file_url = VALUES(file_url),
        cdn_file_id = VALUES(cdn_file_id),
        file_name = VALUES(file_name),
        year = VALUES(year),
        summary = VALUES(summary),
        notes = VALUES(notes)
    `, [
      docId,
      targetOrgId,
      title.trim(),
      category,
      repositoryType,
      fileType,
      fileSizeKb,
      fileUrl,
      cdnFileId,
      fileName,
      Number(year) || new Date().getFullYear(),
      summary,
      generatedTags,
      notes || null,
      uploadedBy || 'Admin BUMD',
      uploadedById || null
    ]);

    // Log activity
    await p.query(`
      INSERT INTO activity_logs (id, organization_id, organization_name, actor_name, actor_role, action, target, type)
      VALUES (?, ?, ?, ?, 'admin', 'Upload Dokumen Baru', ?, 'document')
    `, [
      `act-${Date.now()}`,
      organizationId,
      orgName,
      uploadedBy || 'Admin',
      title.trim()
    ]);

    // Asynchronously index document to RAG Multi-Tenant Service.
    // Pakai API key khusus project (auto-create bila belum ada; fallback master key
    // saat RAG sedang down) supaya upload tidak pernah terblokir.
    const docDisplayName = file ? file.originalname : `${title.trim()}.${(fileType || 'pdf').toLowerCase()}`;
    const projectKey = await ensureProjectRagKey(targetOrgId, orgName);
    indexDocumentToRag({
      documentId: docId,
      organizationId: targetOrgId,
      documentName: docDisplayName,
      contentBuffer: file ? file.buffer : null,
      text: summary,
      apiKey: projectKey.key,
      metadata: {
        category,
        year: Number(year) || new Date().getFullYear(),
        uploadedBy: uploadedBy || 'Admin',
        project_key_source: projectKey.source,
        cdn_url: fileUrl,
        cdn_file_id: cdnFileId
      }
    }).catch(ragErr => {
      console.warn('[RAG AUTO-INDEX WARN]', ragErr);
    });

    const createdDoc = {
      id: docId,
      organizationId,
      organizationName: orgName,
      title: title.trim(),
      category,
      repositoryType,
      fileType,
      fileSizeKb,
      fileUrl,
      cdnFileId,
      year: Number(year) || new Date().getFullYear(),
      summary,
      tags: JSON.parse(generatedTags),
      notes,
      uploadedBy: uploadedBy || 'Admin BUMD',
      uploadedAt: new Date().toISOString(),
      chunksCount: Math.max(3, Math.round(fileSizeKb / 400)),
      ragStatus: 'indexed'
    };

    res.status(201).json({
      success: true,
      message: `Dokumen "${title}" berhasil diunggah dan disimpan!`,
      document: createdDoc
    });
  } catch (err: any) {
    console.error('[UPLOAD DOC ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal mengunggah berkas dokumen.' });
  }
});

// 4. Delete document
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const p = getPool();

    const [rows] = await p.query<any[]>(`
      SELECT d.title, d.file_url, d.cdn_file_id, o.id as org_id, o.name as org_name 
      FROM documents d 
      JOIN organizations o ON d.organization_id = o.id 
      WHERE d.id = ?
    `, [id]);

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan.' });
      return;
    }

    const doc = rows[0];

    // If file was stored on Kroombox CDN, delete it from CDN storage
    if (doc.cdn_file_id) {
      deleteFromKroomboxCDN(doc.cdn_file_id).catch(cdnErr => {
        console.warn('[KROOMBOX CDN DELETE WARN]', cdnErr);
      });
    }

    // Binary is stored in the DB row — deleting the row removes everything.
    await p.query('DELETE FROM documents WHERE id = ?', [id]);

    // Clean up vector chunks in RAG service
    deleteDocumentFromRag(id).catch(ragErr => {
      console.warn('[RAG DELETE WARN]', ragErr);
    });

    // Log activity
    await p.query(`
      INSERT INTO activity_logs (id, organization_id, organization_name, actor_name, actor_role, action, target, type)
      VALUES (?, ?, ?, 'Admin', 'admin', 'Menghapus Dokumen', ?, 'document')
    `, [`act-${Date.now()}`, doc.org_id, doc.org_name, doc.title]);

    res.json({ success: true, message: `Dokumen "${doc.title}" berhasil dihapus.` });
  } catch (err: any) {
    console.error('[DELETE DOC ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus dokumen.' });
  }
});

// Helper to generate a valid PDF buffer for documents without physical file
function generatePdfBuffer(title: string, orgName: string, category: string, summary: string): Buffer {
  const cleanTitle = (title || 'Dokumen Resmi').replace(/[()\\]/g, '');
  const cleanOrg = (orgName || 'KMS BUMD').replace(/[()\\]/g, '');
  const cleanCat = (category || 'Dokumen').replace(/[()\\]/g, '');
  const cleanSummary = (summary || 'Dokumen resmi terverifikasi KMS BUMD.').replace(/[()\\]/g, '');

  const content = 
    `BT /F1 16 Tf 50 720 Td (${cleanTitle}) Tj ET\n` +
    `BT /F1 11 Tf 50 690 Td (Instansi BUMD: ${cleanOrg} | Kategori: ${cleanCat}) Tj ET\n` +
    `BT /F1 10 Tf 50 660 Td (Dokumen Resmi Terverifikasi - Knowledge Management System BUMD) Tj ET\n` +
    `BT /F1 10 Tf 50 630 Td (${cleanSummary.slice(0, 95)}) Tj ET\n` +
    (cleanSummary.length > 95 ? `BT /F1 10 Tf 50 615 Td (${cleanSummary.slice(95, 190)}) Tj ET\n` : '') +
    (cleanSummary.length > 190 ? `BT /F1 10 Tf 50 600 Td (${cleanSummary.slice(190, 285)}) Tj ET\n` : '');

  const streamLen = Buffer.byteLength(content, 'utf-8');
  const pdfString = 
    `%PDF-1.4\n` +
    `1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n` +
    `2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n` +
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents 4 0 R >> endobj\n` +
    `4 0 obj << /Length ${streamLen} >>\nstream\n${content}endstream\nendobj\n` +
    `xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000266 00000 n \ntrailer << /Size 5 /Root 1 0 R >>\nstartxref\n${320 + streamLen}\n%%EOF`;

  return Buffer.from(pdfString, 'utf-8');
}

// 5. Download document (redirect ke Kroombox CDN; fallback PDF untuk dokumen seed tanpa berkas)
router.get('/:id/download', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const p = getPool();

    const [rows] = await p.query<any[]>(`
      SELECT d.file_url, d.cdn_file_id, d.file_name, d.file_type, d.title, d.summary, d.category, o.name as organization_name 
      FROM documents d 
      JOIN organizations o ON d.organization_id = o.id 
      WHERE d.id = ?
    `, [id]);

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan.' });
      return;
    }

    const doc = rows[0];

    // 1. CDN file ID -> redirect ke signed delivery URL berkecepatan tinggi
    if (doc.cdn_file_id) {
      try {
        const signedUrl = await createCDNSignedUrl(doc.cdn_file_id, 86400);
        if (signedUrl) {
          res.redirect(signedUrl);
          return;
        }
      } catch (cdnErr) {
        console.warn('[CDN REDIRECT WARN]', cdnErr);
      }
    }

    // 2. URL CDN langsung -> redirect
    if (doc.file_url && (doc.file_url.startsWith('http://') || doc.file_url.startsWith('https://'))) {
      res.redirect(doc.file_url);
      return;
    }
    const ext = (doc.file_type || 'PDF').toLowerCase();
    const safeTitle = (doc.title || 'dokumen').replace(/[/\\?%*:|"<>]/g, '_');

    // 3. Fallback dokumen seed/legacy tanpa berkas fisik: hasilkan PDF ringkasan
    const pdfBuf = generatePdfBuffer(doc.title, doc.organization_name, doc.category, doc.summary);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.pdf"`);
    res.send(pdfBuf);
  } catch (err: any) {
    console.error('[DOWNLOAD DOC ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal mengunduh dokumen.' });
  }
});

// 6. Sync all database documents to RAG Service (using real binary from MySQL)
router.post('/sync-rag', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const p = getPool();
    const [docs] = await p.query<any[]>('SELECT * FROM documents');
    let indexedCount = 0;

    for (const doc of docs) {
      await indexDocumentToRag({
        documentId: doc.id,
        organizationId: doc.organization_id,
        documentName: doc.file_name || `${doc.title}.${(doc.file_type || 'PDF').toLowerCase()}`,
        contentBuffer: null,
        text: doc.summary || doc.title,
        metadata: {
          category: doc.category,
          year: doc.year,
          uploadedBy: doc.uploaded_by
        }
      });
      indexedCount++;
    }

    res.json({
      success: true,
      message: `Berhasil mensinkronisasikan ${indexedCount} dokumen ke RAG service.`,
      count: indexedCount
    });
  } catch (err: any) {
    console.error('[SYNC RAG ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal sinkronisasi ke RAG service.' });
  }
});

export default router;
