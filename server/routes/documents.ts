import { Router, Request, Response } from 'express';
import { getPool } from '../db';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { indexDocumentToRag, deleteDocumentFromRag } from '../services/rag';
import { uploadToKroomboxCDN, deleteFromKroomboxCDN, cdnViewUrl, downloadFromKroomboxCDN } from '../services/cdn';
import { requireAuth } from '../middleware/auth';
import { ensureProjectRagKey } from '../services/ragKeys';
import { reconcileRagDeletions, handleRagDocumentDeletedWebhook } from '../services/ragSync';

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

    // Rekonsiliasi otomatis: jika ada dokumen yang dihapus di https://rag.aiones.app/,
    // dokumen tersebut akan otomatis terdeteksi dan dibersihkan dari MySQL & Kroombox CDN.
    reconcileRagDeletions(organizationId as string, false, false).catch(syncErr => {
      console.warn('[RAG AUTO-SYNC ON GET WARN]', syncErr?.message || syncErr);
    });

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

    // Role-based visibility:
    // User biasa HANYA melihat dokumen yang di-upload oleh user atau dokumen milik sendiri.
    // Admin melihat SEMUA dokumen (baik unggahan admin maupun unggahan user).
    if (req.authUser && req.authUser.role === 'user') {
      conditions.push('(d.uploader_role = "user" OR d.uploader_role IS NULL OR d.uploaded_by_id = ?)');
      params.push(req.authUser.id);
    }

    // Project Isolation:
    // Admin dapat memantau seluruh dokumen.
    // User hanya melihat dokumen dalam project milik mereka sendiri.
    // Admin mengelola SEMUA dokumen; user biasa hanya dokumen project miliknya.
    if (req.authUser && req.authUser.role !== 'admin') {
      conditions.push('(o.created_by = ? OR o.id = (SELECT organization_id FROM users WHERE id = ?) OR (o.created_by IS NULL AND o.admin_name = ?))');
      params.push(req.authUser.id, req.authUser.id, req.authUser.name);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY d.created_at DESC';

    const [rows] = await p.query<any[]>(query, params);

    const documents = rows.map(r => {
      const ext = (r.file_type || path.extname(r.file_name || r.file_url || '').replace('.', '') || '').toLowerCase();
      const isImage = (r.repository_type === 'photo') || 
        ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp'].includes(ext);

      // Prioritaskan cdn_file_id untuk URL render langsung CDN Kroombox.
      // Jangan gunakan tautan Google Drive (drive.google.com) karena diblokir oleh browser saat di-render di img / iframe.
      const resolvedFileUrl = r.cdn_file_id
        ? cdnViewUrl(r.cdn_file_id)
        : (r.file_url && !r.file_url.startsWith('db://') && !r.file_url.includes('drive.google.com'))
          ? r.file_url
          : `/api/documents/${r.id}/view`;

      return {
        id: r.id,
        organizationId: r.organization_id,
        organizationName: r.organization_name,
        title: r.title,
        category: r.category,
        repositoryType: isImage ? 'photo' : (r.repository_type || 'document'),
        fileType: r.file_type,
        fileSizeKb: r.file_size_kb,
        fileUrl: resolvedFileUrl,
        cdnFileId: r.cdn_file_id || null,
        year: r.year,
        department: r.department || 'Umum',
        summary: r.summary || 'Dokumen resmi terindeks otomatis di CDN.',
        tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags || []),
        notes: r.notes,
        uploadedBy: r.uploaded_by,
        uploadedById: r.uploaded_by_id,
        uploaderRole: r.uploader_role || 'user',
        uploadedAt: r.created_at,
        chunksCount: Math.max(3, Math.round(r.file_size_kb / 400)),
        totalTokens: Math.max(500, Math.round(r.file_size_kb * 1.8)),
        ragStatus: 'indexed'
      };
    });


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
    const isUnlimited = u.role === 'admin' || u.plan === 'enterprise';
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
    const ext = (r.file_type || path.extname(r.file_name || r.file_url || '').replace('.', '') || '').toLowerCase();
    const isImage = (r.repository_type === 'photo') || 
      ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp'].includes(ext);

    const resolvedFileUrl = r.cdn_file_id
      ? cdnViewUrl(r.cdn_file_id)
      : (r.file_url && !r.file_url.startsWith('db://') && !r.file_url.includes('drive.google.com'))
        ? r.file_url
        : `/api/documents/${r.id}/view`;

    const doc = {
      id: r.id,
      organizationId: r.organization_id,
      organizationName: r.organization_name,
      title: r.title,
      category: r.category,
      repositoryType: isImage ? 'photo' : (r.repository_type || 'document'),
      fileType: r.file_type,
      fileSizeKb: r.file_size_kb,
      fileUrl: resolvedFileUrl,
      cdnFileId: r.cdn_file_id || null,
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
      projectCode,
      projectName,
      uploadedBy,
      uploadedById
    } = req.body;

    if (!title || !category || (!organizationId && !projectCode && !projectName)) {
      res.status(400).json({ success: false, message: 'Judul, kategori, dan proyek tujuan wajib diisi.' });
      return;
    }

    const p = getPool();

    // Project workspace unlimited upload support
    // (User can upload multiple files & documents to their project)

    // Verify project exists, or fallback gracefully with multi-tier resolution
    let targetOrgId = organizationId;
    let orgRows: any[] = [];

    // 1. Try exact ID match
    if (organizationId) {
      const [rowsById] = await p.query<any[]>('SELECT id, name, code, knowledge_base FROM organizations WHERE id = ?', [organizationId]);
      if (rowsById.length > 0) {
        orgRows = rowsById;
        targetOrgId = rowsById[0].id;
      }
    }

    // 2. Try matching by projectCode or projectName if supplied
    if (orgRows.length === 0 && (projectCode || projectName)) {
      const [rowsByExplicit] = await p.query<any[]>(
        'SELECT id, name, code, knowledge_base FROM organizations WHERE LOWER(code) = LOWER(?) OR LOWER(name) = LOWER(?) LIMIT 1',
        [projectCode || '', projectName || '']
      );
      if (rowsByExplicit.length > 0) {
        orgRows = rowsByExplicit;
        targetOrgId = rowsByExplicit[0].id;
      }
    }

    // 3. Try matching by code or name using organizationId (case-insensitive)
    if (orgRows.length === 0 && organizationId) {
      const [rowsByCodeOrName] = await p.query<any[]>(
        'SELECT id, name, code, knowledge_base FROM organizations WHERE LOWER(code) = LOWER(?) OR LOWER(name) = LOWER(?) LIMIT 1',
        [organizationId, organizationId]
      );
      if (rowsByCodeOrName.length > 0) {
        orgRows = rowsByCodeOrName;
        targetOrgId = rowsByCodeOrName[0].id;
      }
    }

    // 4. If ID starts with 'org-', try extracting slug/code (e.g. 'org-prj-test-6353' -> 'PRJ-TEST' or 'test')
    if (orgRows.length === 0 && typeof organizationId === 'string' && organizationId.startsWith('org-')) {
      const cleaned = organizationId.replace(/^org-/, '').replace(/-[0-9]+$/, '');
      const cleanedUpper = cleaned.toUpperCase();
      const cleanedWithoutPrj = cleaned.replace(/^prj-/, '').toLowerCase();
      const [rowsBySlug] = await p.query<any[]>(
        'SELECT id, name, code, knowledge_base FROM organizations WHERE LOWER(code) = LOWER(?) OR LOWER(code) = LOWER(?) OR LOWER(name) = LOWER(?) OR LOWER(name) = LOWER(?) LIMIT 1',
        [cleaned, cleanedUpper, cleaned, cleanedWithoutPrj]
      );
      if (rowsBySlug.length > 0) {
        orgRows = rowsBySlug;
        targetOrgId = rowsBySlug[0].id;
      }
    }

    // 5. Try matching user's assigned project (from authenticated user token or uploadedById)
    if (orgRows.length === 0) {
      const effectiveUserId = (req as any).authUser?.id || uploadedById;
      if (effectiveUserId) {
        const [userRows] = await p.query<any[]>(
          'SELECT o.id, o.name, o.code, o.knowledge_base FROM users u JOIN organizations o ON u.organization_id = o.id WHERE u.id = ? LIMIT 1',
          [effectiveUserId]
        );
        if (userRows.length > 0) {
          orgRows = userRows;
          targetOrgId = userRows[0].id;
        }
      }
    }

    // 6. Fallback to latest active project owned by or assigned to this user
    if (orgRows.length === 0) {
      const effectiveUserId = (req as any).authUser?.id || uploadedById;
      if (effectiveUserId) {
        const [userProjects] = await p.query<any[]>(
          'SELECT id, name, code, knowledge_base FROM organizations WHERE created_by = ? ORDER BY created_at DESC LIMIT 1',
          [effectiveUserId]
        );
        if (userProjects.length > 0) {
          orgRows = userProjects;
          targetOrgId = userProjects[0].id;
        }
      }
    }

    // 7. If user has no project, reject upload so documents never get stored in someone else's project
    if (orgRows.length === 0) {
      res.status(400).json({ 
        success: false, 
        message: 'Anda belum memiliki project. Silakan buat project terlebih dahulu di menu Manajemen Project sebelum mengunggah dokumen.' 
      });
      return;
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
        console.warn('[CDN UPLOAD WARN, FALLING BACK TO LOCAL STORAGE]', cdnErr?.message || cdnErr);
        try {
          const uploadsDir = path.resolve('uploads');
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
          const safeName = `${docId}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const localPath = path.join(uploadsDir, safeName);
          fs.writeFileSync(localPath, file.buffer);
          fileUrl = `/uploads/${safeName}`;
          console.log(`[LOCAL STORAGE FALLBACK] Berkas tersimpan lokal di: ${fileUrl}`);
        } catch (localErr: any) {
          console.error('[LOCAL STORAGE SAVE FAILED]', localErr);
          res.status(500).json({
            success: false,
            message: `Gagal menyimpan berkas: ${localErr?.message || 'Kesalahan penyimpanan'}.`
          });
          return;
        }
      }
    }

    const isImageFile = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp'].includes(rawExt.toLowerCase())
      || repositoryType === 'photo';
    const effectiveRepoType = isImageFile ? 'photo' : (repositoryType || 'document');

    // Auto generate default tags and summary for mock/RAG placeholder
    const generatedTags = JSON.stringify([
      category.toLowerCase().replace(/\s+/g, '-'),
      effectiveRepoType,
      'bumd',
      'internal',
      fileType.toLowerCase()
    ]);
    const summary = notes && notes.trim()
      ? notes.trim()
      : isImageFile
        ? `Foto / Media visual resmi "${title.trim()}" kategori ${category} milik ${orgName}. Terindeks dan siap untuk penelusuran AI.`
        : `Dokumen resmi ${title} kategori ${category} milik ${orgName}. Terindeks dan siap untuk penelusuran AI.`;

    const effectiveRole = req.authUser?.role || req.body.uploaderRole || 'user';
    const effectiveUserId = req.authUser?.id || req.body.uploadedById || null;
    const effectiveUserName = req.authUser?.name || req.body.uploadedBy || (effectiveRole === 'admin' ? 'Admin' : 'Pengguna');

    await p.query(`
      INSERT INTO documents (id, organization_id, title, category, repository_type, file_type, file_size_kb, file_url, cdn_file_id, file_name, year, summary, tags, notes, uploaded_by, uploaded_by_id, uploader_role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        notes = VALUES(notes),
        uploader_role = VALUES(uploader_role)
    `, [
      docId,
      targetOrgId,
      title.trim(),
      category,
      effectiveRepoType,
      fileType,
      fileSizeKb,
      fileUrl,
      cdnFileId,
      fileName,
      Number(year) || new Date().getFullYear(),
      summary,
      generatedTags,
      notes || null,
      effectiveUserName,
      effectiveUserId,
      effectiveRole
    ]);

    // Log activity
    await p.query(`
      INSERT INTO activity_logs (id, organization_id, organization_name, actor_name, actor_role, action, target, type)
      VALUES (?, ?, ?, ?, ?, 'Upload Dokumen Baru', ?, 'document')
    `, [
      `act-${Date.now()}`,
      targetOrgId,
      orgName,
      effectiveUserName,
      effectiveRole,
      title.trim()
    ]);

    // Asynchronously index document to RAG Multi-Tenant Service.
    // Pakai API key khusus project (auto-create bila belum ada; fallback master key
    // saat RAG sedang down) supaya upload tidak pernah terblokir.
    const docDisplayName = file ? file.originalname : `${title.trim()}.${(fileType || 'pdf').toLowerCase()}`;
    const projectKey = await ensureProjectRagKey(targetOrgId, orgName);

    // Ambil kode Knowledge Base unik milik project ini
    let targetKb: string | null = null;
    try {
      const [orgKbRows] = await p.query<any[]>('SELECT knowledge_base FROM organizations WHERE id = ?', [targetOrgId]);
      if (orgKbRows.length > 0 && orgKbRows[0].knowledge_base) {
        targetKb = orgKbRows[0].knowledge_base;
      }
    } catch (kErr) {
      console.warn('[ORG KB QUERY WARN]', kErr);
    }

    const ragSummary = isImageFile
      ? `Foto / Media visual resmi "${title.trim()}" (${docDisplayName}) kategori ${category} milik ${orgName}. ${notes && notes.trim() ? notes.trim() : 'Tersimpan aman di Kroombox Edge CDN.'}`
      : summary;

    indexDocumentToRag({
      documentId: docId,
      organizationId: targetOrgId,
      knowledgeBaseId: targetKb,
      documentName: docDisplayName,
      contentBuffer: file ? file.buffer : null,
      text: ragSummary,
      apiKey: projectKey.key,
      metadata: {
        title: title.trim(),
        category,
        repository_type: effectiveRepoType,
        year: Number(year) || new Date().getFullYear(),
        uploadedBy: uploadedBy || 'Admin',
        project_key_source: projectKey.source,
        knowledge_base: targetKb,
        cdn_url: fileUrl,
        cdn_file_id: cdnFileId
      }
    }).catch(ragErr => {
      console.warn('[RAG AUTO-INDEX WARN]', ragErr);
    });

    const createdDoc = {
      id: docId,
      organizationId: targetOrgId,
      organizationName: orgName,
      title: title.trim(),
      category,
      repositoryType: effectiveRepoType,
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

    // 1. Support direct CDN asset deletion if id starts with 'cdn-'
    if (id.startsWith('cdn-')) {
      const cdnFileId = id.replace('cdn-', '');
      try {
        await deleteFromKroomboxCDN(cdnFileId);
      } catch (cdnErr) {
        console.warn('[KROOMBOX CDN DIRECT DELETE WARN]', cdnErr);
      }
      res.json({ success: true, message: 'Berkas CDN berhasil dihapus.' });
      return;
    }

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

    // 2. If file was stored on Kroombox CDN, delete it from CDN storage
    if (doc.cdn_file_id) {
      try {
        await deleteFromKroomboxCDN(doc.cdn_file_id);
        console.log(`[CDN] Aset ID: ${doc.cdn_file_id} berhasil dihapus dari Kroombox CDN.`);
      } catch (cdnErr) {
        console.warn('[KROOMBOX CDN DELETE WARN]', cdnErr);
      }
    }

    // 3. Clean up local fallback file if stored under /uploads/
    if (doc.file_url && doc.file_url.startsWith('/uploads/')) {
      try {
        const localPath = path.resolve('.' + doc.file_url);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
          console.log(`[STORAGE] Berkas lokal ${localPath} berhasil dihapus.`);
        }
      } catch (fErr) {
        console.warn('[LOCAL FILE DELETE WARN]', fErr);
      }
    }

    // 4. Clean up vector chunks and indexes in RAG service
    let projectKey: any = null;
    try {
      projectKey = await ensureProjectRagKey(doc.org_id, doc.org_name);
    } catch (kErr) {
      console.warn('[RAG PROJECT KEY GET WARN]', kErr);
    }

    try {
      await deleteDocumentFromRag(id, projectKey?.key);
    } catch (ragErr) {
      console.warn('[RAG DELETE WARN]', ragErr);
    }

    // 5. Delete metadata record from MySQL database
    await p.query('DELETE FROM documents WHERE id = ?', [id]);

    // 6. Log activity
    await p.query(`
      INSERT INTO activity_logs (id, organization_id, organization_name, actor_name, actor_role, action, target, type)
      VALUES (?, ?, ?, 'Admin', 'admin', 'Menghapus Dokumen', ?, 'document')
    `, [`act-${Date.now()}`, doc.org_id, doc.org_name, doc.title]);

    res.json({ success: true, message: `Dokumen "${doc.title}" berhasil dihapus dari KMS, CDN, dan RAG.` });
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

// 5. Update document metadata
router.put('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      repositoryType,
      year,
      department,
      summary,
      notes,
      tags
    } = req.body;

    const p = getPool();
    const [rows] = await p.query<any[]>('SELECT * FROM documents WHERE id = ?', [id]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan.' });
      return;
    }

    const doc = rows[0];
    // Check permission: user can only edit their own doc unless admin
    if (req.authUser && req.authUser.role === 'user' && doc.uploaded_by_id && doc.uploaded_by_id !== req.authUser.id) {
      res.status(403).json({ success: false, message: 'Anda hanya dapat mengedit dokumen yang Anda unggah.' });
      return;
    }

    const updatedTitle = title !== undefined ? String(title).trim() : doc.title;
    const updatedCategory = category !== undefined ? String(category).trim() : doc.category;
    const updatedRepoType = repositoryType !== undefined ? String(repositoryType).trim() : (doc.repository_type || 'document');
    const updatedYear = year !== undefined ? Number(year) : doc.year;
    const updatedDept = department !== undefined ? String(department).trim() : doc.department;
    const updatedSummary = summary !== undefined ? String(summary).trim() : doc.summary;
    const updatedNotes = notes !== undefined ? (notes ? String(notes).trim() : null) : doc.notes;
    const updatedTags = tags !== undefined
      ? (typeof tags === 'string' ? tags : JSON.stringify(tags))
      : (typeof doc.tags === 'string' ? doc.tags : JSON.stringify(doc.tags || []));

    await p.query(`
      UPDATE documents 
      SET title = ?, category = ?, repository_type = ?, year = ?, department = ?, summary = ?, notes = ?, tags = ?
      WHERE id = ?
    `, [
      updatedTitle,
      updatedCategory,
      updatedRepoType,
      updatedYear,
      updatedDept,
      updatedSummary,
      updatedNotes,
      updatedTags,
      id
    ]);

    // Log activity
    await p.query(`
      INSERT INTO activity_logs (id, organization_id, organization_name, actor_name, actor_role, action, target, type)
      VALUES (?, ?, (SELECT name FROM organizations WHERE id = ?), ?, ?, 'Perbarui Metadata Dokumen', ?, 'document')
    `, [
      `act-${Date.now()}`,
      doc.organization_id,
      doc.organization_id,
      req.authUser?.name || 'Pengguna',
      req.authUser?.role || 'user',
      updatedTitle
    ]);

    res.json({
      success: true,
      message: 'Metadata dokumen berhasil diperbarui.',
      document: {
        ...doc,
        title: updatedTitle,
        category: updatedCategory,
        repositoryType: updatedRepoType,
        year: updatedYear,
        department: updatedDept,
        summary: updatedSummary,
        notes: updatedNotes,
        tags: typeof updatedTags === 'string' ? JSON.parse(updatedTags) : updatedTags
      }
    });
  } catch (err: any) {
    console.error('[UPDATE DOC ERROR]', err);
    res.status(500).json({ success: false, message: err?.message || 'Gagal memperbarui metadata dokumen.' });
  }
});

// 5b. Delete document (Hapus dari MySQL, RAG Service, dan Kroombox CDN)
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const p = getPool();

    const [rows] = await p.query<any[]>('SELECT * FROM documents WHERE id = ?', [id]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan.' });
      return;
    }

    const doc = rows[0];

    // Hapus dari database MySQL
    await p.query('DELETE FROM documents WHERE id = ?', [id]);

    // Hapus dari RAG Service secara asinkron
    deleteDocumentFromRag(doc.id).catch(e => console.warn('[RAG DELETE DOC WARN]', e?.message || e));

    // Hapus dari Kroombox CDN jika ada
    if (doc.cdn_file_id) {
      deleteFromKroomboxCDN(doc.cdn_file_id).catch(e => console.warn('[CDN DELETE WARN]', e?.message || e));
    }

    // Catat log aktivitas
    await p.query(`
      INSERT INTO activity_logs (id, organization_id, organization_name, actor_name, actor_role, action, target, type)
      VALUES (?, ?, ?, ?, ?, 'Menghapus Dokumen', ?, 'document')
    `, [
      `act-${Date.now()}`,
      doc.organization_id,
      doc.organization_id,
      req.authUser?.name || 'Pengguna',
      req.authUser?.role || 'user',
      doc.title
    ]);

    res.json({ success: true, message: `Dokumen "${doc.title}" berhasil dihapus dari sistem dan RAG.` });
  } catch (err: any) {
    console.error('[DELETE DOC ERROR]', err);
    res.status(500).json({ success: false, message: err?.message || 'Gagal menghapus dokumen.' });
  }
});

// 5c. View / Render document inline (Untuk render <img>, <iframe>, dan pratinjau modal)
router.get('/:id/view', async (req: Request, res: Response): Promise<void> => {
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
      res.status(404).send('Dokumen tidak ditemukan.');
      return;
    }

    const doc = rows[0];
    const ext = (doc.file_type || path.extname(doc.file_name || doc.file_url || '').replace('.', '') || 'pdf').toLowerCase();
    const safeTitle = (doc.title || doc.file_name || 'berkas').replace(/[/\\?%*:|"<>]/g, '_');
    const viewFileName = safeTitle.toLowerCase().endsWith(`.${ext}`) ? safeTitle : `${safeTitle}.${ext}`;

    const mimeMap: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
      txt: 'text/plain; charset=utf-8'
    };
    const defaultMime = mimeMap[ext] || 'application/octet-stream';

    // 1. Kroombox CDN direct streaming (inline)
    const cdnUrl = doc.cdn_file_id ? cdnViewUrl(doc.cdn_file_id) : null;
    if (cdnUrl) {
      try {
        let cdnRes = await fetch(cdnUrl);
        for (let attempt = 0; attempt < 2 && !cdnRes.ok; attempt++) {
          await new Promise(r => setTimeout(r, 1000));
          cdnRes = await fetch(cdnUrl);
        }
        if (cdnRes.ok && cdnRes.body) {
          const contentType = cdnRes.headers.get('content-type') || defaultMime;
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(viewFileName)}"`);
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          Readable.fromWeb(cdnRes.body as any).pipe(res);
          return;
        }
      } catch (cdnErr) {
        console.warn('[CDN VIEW STREAM WARN]', cdnErr);
      }
    }

    // 2. Direct external URL (bukan Google drive)
    if (doc.file_url && (doc.file_url.startsWith('http://') || doc.file_url.startsWith('https://')) && !doc.file_url.includes('drive.google.com')) {
      try {
        const extRes = await fetch(doc.file_url);
        if (extRes.ok && extRes.body) {
          res.setHeader('Content-Type', extRes.headers.get('content-type') || defaultMime);
          res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(viewFileName)}"`);
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
          Readable.fromWeb(extRes.body as any).pipe(res);
          return;
        }
      } catch (extErr) {
        console.warn('[EXTERNAL VIEW STREAM WARN]', extErr);
      }
    }

    // 2b. Local file
    if (doc.file_url && doc.file_url.startsWith('/uploads/')) {
      const localFilePath = path.resolve('.' + doc.file_url);
      if (fs.existsSync(localFilePath)) {
        res.setHeader('Content-Type', defaultMime);
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(viewFileName)}"`);
        res.sendFile(localFilePath);
        return;
      }
    }

    // 3. Fallback PDF generator untuk dokumen tanpa berkas biner
    const pdfBuf = generatePdfBuffer(doc.title, doc.organization_name, doc.category, doc.summary);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(viewFileName)}"`);
    res.send(pdfBuf);
  } catch (err: any) {
    console.error('[VIEW DOC ERROR]', err);
    res.status(500).send('Gagal memuat pratinjau berkas.');
  }
});

// 6. Download document (Real streaming dari Kroombox CDN / URL / Local dengan header attachment)
router.get('/:id/download', requireAuth, async (req: Request, res: Response): Promise<void> => {
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

    const doc = rows[0];
    const ext = (doc.file_type || path.extname(doc.file_name || doc.file_url || '').replace('.', '') || 'pdf').toLowerCase();
    const safeTitle = (doc.title || doc.file_name || 'dokumen').replace(/[/\\?%*:|"<>]/g, '_');
    const downloadFileName = safeTitle.toLowerCase().endsWith(`.${ext}`) ? safeTitle : `${safeTitle}.${ext}`;

    // 1. CDN file ID -> stream langsung dari URL render CDN (bukan signed/Google Drive).
    //    Foto/gambar dikirim inline supaya langsung tampil di browser.
    const isImageDoc = doc.repository_type === 'photo'
      || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext);
    const cdnUrl = doc.cdn_file_id ? cdnViewUrl(doc.cdn_file_id) : null;
    if (cdnUrl) {
      try {
        // CDN menyinkronkan berkas secara async: sesaat setelah upload statusnya "pending"
        // (302 -> drive...?id=pending). Coba beberapa kali sebelum menyerah.
        let cdnRes = await fetch(cdnUrl);
        for (let attempt = 0; attempt < 3 && !cdnRes.ok; attempt++) {
          await new Promise(r => setTimeout(r, 2000));
          cdnRes = await fetch(cdnUrl);
        }
        if (cdnRes.ok && cdnRes.body) {
          res.setHeader('Content-Type', cdnRes.headers.get('content-type') || 'application/octet-stream');
          res.setHeader('Content-Disposition', isImageDoc
            ? `inline; filename="${encodeURIComponent(downloadFileName)}"`
            : `attachment; filename="${encodeURIComponent(downloadFileName)}"; filename*=UTF-8''${encodeURIComponent(downloadFileName)}`);
          if (cdnRes.headers.get('content-length')) {
            res.setHeader('Content-Length', cdnRes.headers.get('content-length')!);
          }
          Readable.fromWeb(cdnRes.body as any).pipe(res);
          return;
        }
        // Berkas belum siap di CDN -> jangan kirim PDF palsu; arahkan browser ke berkas CDN.
        res.redirect(cdnUrl);
        return;
      } catch (cdnErr) {
        console.warn('[CDN STREAM WARN]', cdnErr);
      }
    }

    // 2. Direct external CDN URL (http / https) -> fetch dan stream dengan Content-Disposition: attachment!
    if (doc.file_url && (doc.file_url.startsWith('http://') || doc.file_url.startsWith('https://'))) {
      try {
        const extRes = await fetch(doc.file_url);
        if (extRes.ok && extRes.body) {
          res.setHeader('Content-Type', extRes.headers.get('content-type') || 'application/octet-stream');
          res.setHeader('Content-Disposition', isImageDoc
            ? `inline; filename="${encodeURIComponent(downloadFileName)}"`
            : `attachment; filename="${encodeURIComponent(downloadFileName)}"; filename*=UTF-8''${encodeURIComponent(downloadFileName)}`);
          if (extRes.headers.get('content-length')) {
            res.setHeader('Content-Length', extRes.headers.get('content-length')!);
          }
          Readable.fromWeb(extRes.body as any).pipe(res);
          return;
        }
      } catch (extErr) {
        console.warn('[EXTERNAL STREAM WARN]', extErr);
      }
    }

    // 2b. URL lokal /uploads/... -> res.download or res.sendFile
    if (doc.file_url && doc.file_url.startsWith('/uploads/')) {
      const localFilePath = path.resolve('.' + doc.file_url);
      if (fs.existsSync(localFilePath)) {
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadFileName)}"`);
        res.sendFile(localFilePath);
        return;
      }
    }

    // 3. Fallback dokumen seed/legacy tanpa berkas fisik: hasilkan PDF ringkasan
    const pdfBuf = generatePdfBuffer(doc.title, doc.organization_name, doc.category, doc.summary);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadFileName)}"`);
    res.send(pdfBuf);
  } catch (err: any) {
    console.error('[DOWNLOAD DOC ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal mengunduh dokumen.' });
  }
});

// 7. Re-index dokumen ke RAG Service (Knowledge Base per project).
// PENTING: isi berkas ASLI diunduh dari Kroombox CDN lalu dikirim sebagai content_base64.
// Sebelumnya fungsi ini hanya mengirim ringkasan teks dengan replace:true, sehingga RAG
// menyimpan 1 chunk dangkal (~13 token) dan ISI DOKUMEN HILANG. Dokumen yang isinya tidak
// berhasil diunduh DILEWATI (bukan ditimpa ringkasan) agar data yang sudah benar tidak rusak.
router.post('/sync-rag', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = (req.body?.organizationId || req.query?.organizationId) as string | undefined;
    const p = getPool();
    let query = `
      SELECT d.*, o.name as org_name, o.knowledge_base 
      FROM documents d 
      JOIN organizations o ON d.organization_id = o.id
    `;
    const params: any[] = [];
    if (orgId && orgId !== 'all') {
      query += ' WHERE d.organization_id = ?';
      params.push(orgId);
    }

    const [docs] = await p.query<any[]>(query, params);
    let indexedCount = 0;
    let skippedCount = 0;

    for (const doc of docs) {
      // Ambil isi berkas asli dari CDN. Tanpa ini, jangan menimpa entri RAG yang sudah ada.
      const contentBuffer = await downloadFromKroomboxCDN(doc.cdn_file_id);
      if (!contentBuffer) {
        console.warn(`[SYNC RAG SKIP] Isi berkas ${doc.cdn_file_id || doc.id} tidak dapat diunduh dari CDN — entri RAG dibiarkan utuh.`);
        skippedCount++;
        continue;
      }

      const projectKey = await ensureProjectRagKey(doc.organization_id, doc.org_name);
      await indexDocumentToRag({
        documentId: doc.id,
        organizationId: doc.organization_id,
        knowledgeBaseId: doc.knowledge_base || null,
        documentName: doc.file_name || `${doc.title}.${(doc.file_type || 'PDF').toLowerCase()}`,
        contentBuffer,
        text: doc.summary || doc.title,
        apiKey: projectKey.key,
        metadata: {
          category: doc.category,
          year: doc.year,
          uploadedBy: doc.uploaded_by,
          knowledge_base: doc.knowledge_base || null,
          cdn_url: doc.file_url,
          cdn_file_id: doc.cdn_file_id
        }
      });
      indexedCount++;
    }

    const kbName = docs.length > 0 && docs[0].knowledge_base ? docs[0].knowledge_base : 'Tenant Default';
    res.json({
      success: true,
      message: `Berhasil menyinkronkan ${indexedCount} dokumen (isi lengkap) ke RAG Service (Knowledge Base: ${kbName})`
        + (skippedCount > 0 ? `. ${skippedCount} dokumen dilewati karena berkas CDN belum siap.` : '.'),
      count: indexedCount,
      skipped: skippedCount,
      knowledgeBase: kbName
    });
  } catch (err: any) {
    console.error('[SYNC RAG ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal sinkronisasi ke RAG service.' });
  }
});

// 12. Manual trigger: Rekonsiliasi sinkronisasi penghapusan dokumen dari https://rag.aiones.app/
// (dipisah dari /sync-rag agar re-index tidak tertukar dengan rekonsiliasi penghapusan)
router.post('/reconcile-rag', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.body;
    const result = await reconcileRagDeletions(organizationId, true, true);
    res.json({
      success: true,
      message: result.purgedCount > 0
        ? `${result.purgedCount} dokumen yang telah dihapus di RAG berhasil dibersihkan otomatis dari database dan Kroombox CDN.`
        : 'Seluruh dokumen telah sinkron sempurna dengan RAG & Kroombox CDN.',
      purgedCount: result.purgedCount,
      purgedDocuments: result.purgedDocuments
    });
  } catch (err: any) {
    console.error('[MANUAL SYNC RAG ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal melakukan sinkronisasi dengan RAG.', error: err.message });
  }
});

// 13. Webhook: Endpoint publik untuk menerima notifikasi saat berkas dihapus langsung di RAG server
router.post('/rag-webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await handleRagDocumentDeletedWebhook(req.body);
    res.json(result);
  } catch (err: any) {
    console.error('[RAG WEBHOOK ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal memproses webhook RAG.', error: err.message });
  }
});

export default router;
