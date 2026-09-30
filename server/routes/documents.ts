import { Router, Request, Response } from 'express';
import { getPool } from '../db';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer storage for uploaded documents
const uploadDir = path.resolve('uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size
});

// 1. Get documents (with optional organizationId filter)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId, category, search } = req.query;
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
      fileType: r.file_type,
      fileSizeKb: r.file_size_kb,
      fileUrl: r.file_url,
      year: r.year,
      department: r.department || 'Umum',
      summary: r.summary || 'Dokumen resmi terindeks otomatis.',
      tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags || []),
      notes: r.notes,
      uploadedBy: r.uploaded_by,
      uploadedAt: r.created_at,
      chunksCount: Math.max(3, Math.round(r.file_size_kb / 400)),
      totalTokens: Math.max(500, Math.round(r.file_size_kb * 1.8)),
      ragStatus: 'indexed'
    }));

    res.json({ success: true, documents });
  } catch (err: any) {
    console.error('[GET DOCS ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil repositori dokumen.' });
  }
});

// 2. Get single document
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
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
      fileUrl: r.file_url,
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
router.post('/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      category,
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

    // Verify organization exists
    const [orgRows] = await p.query<any[]>('SELECT name FROM organizations WHERE id = ?', [organizationId]);
    if (orgRows.length === 0) {
      res.status(404).json({ success: false, message: 'Organisasi tujuan tidak ditemukan.' });
      return;
    }
    const orgName = orgRows[0].name;

    const file = req.file;
    const fileType = file ? path.extname(file.originalname).replace('.', '').toUpperCase() : 'PDF';
    const fileSizeKb = file ? Math.round(file.size / 1024) : 2500;
    const fileUrl = file ? `/uploads/documents/${file.filename}` : null;
    const docId = `doc-${Date.now()}`;

    // Auto generate default tags and summary for mock/RAG placeholder
    const generatedTags = JSON.stringify([
      category.toLowerCase().replace(/\s+/g, '-'),
      'bumd',
      'internal',
      fileType.toLowerCase()
    ]);
    const summary = notes && notes.trim()
      ? notes.trim()
      : `Dokumen resmi ${title} kategori ${category} milik ${orgName}. Terindeks dan siap untuk penelusuran AI.`;

    await p.query(`
      INSERT INTO documents (id, organization_id, title, category, file_type, file_size_kb, file_url, year, summary, tags, notes, uploaded_by, uploaded_by_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      docId,
      organizationId,
      title.trim(),
      category,
      fileType,
      fileSizeKb,
      fileUrl,
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

    const createdDoc = {
      id: docId,
      organizationId,
      organizationName: orgName,
      title: title.trim(),
      category,
      fileType,
      fileSizeKb,
      fileUrl,
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
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const p = getPool();

    const [rows] = await p.query<any[]>(`
      SELECT d.title, d.file_url, o.id as org_id, o.name as org_name 
      FROM documents d 
      JOIN organizations o ON d.organization_id = o.id 
      WHERE d.id = ?
    `, [id]);

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan.' });
      return;
    }

    const doc = rows[0];

    // Attempt to remove physical file if exists
    if (doc.file_url) {
      const fullPath = path.resolve('.' + doc.file_url);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (e) {
          console.warn('[DELETE FILE WARN]', e);
        }
      }
    }

    await p.query('DELETE FROM documents WHERE id = ?', [id]);

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

export default router;
