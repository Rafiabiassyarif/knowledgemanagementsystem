import { Router, Request, Response } from 'express';
import { getPool } from '../db';
import fetch from 'node-fetch';

const router = Router();

const CDN_BASE_URL = process.env.KROOMBOX_CDN_URL || 'https://api-cdn.kroombox.com';
const CDN_API_KEY = process.env.KROOMBOX_API_KEY || 'kb_6365852fe432ce3a5b304b5bece7858cc3a558f5e5b84d0e';
const CDN_JWT_TOKEN = process.env.KROOMBOX_JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcm9qZWN0SWQiOiIyMWM0MDQwZS1jYzhkLTQ3ZjctOTZhNC1jZmExM2Q4ZWExZjkiLCJ1c2VySWQiOjgsImlhdCI6MTc5MDg0MzIzNSwiZXhwIjoxNzk4NjE5MjM1fQ.VtMHS1Z5yWrJr65DN7NU6JFZLHBG5_PNtYhlt6EO5_k';

// 1. Get Admin Overview & Live CDN Stats
router.get('/overview', async (_req: Request, res: Response): Promise<void> => {
  try {
    const p = getPool();

    // Query local DB counts
    const [userCount] = await p.query<any[]>('SELECT COUNT(*) as count FROM users');
    const [orgCount] = await p.query<any[]>('SELECT COUNT(*) as count FROM organizations');
    const [docCount] = await p.query<any[]>('SELECT COUNT(*) as count FROM documents');
    const [repoCounts] = await p.query<any[]>(`
      SELECT 
        SUM(CASE WHEN repository_type = 'knowledge' THEN 1 ELSE 0 END) as knowledge_count,
        SUM(CASE WHEN repository_type != 'knowledge' OR repository_type IS NULL THEN 1 ELSE 0 END) as document_count
      FROM documents
    `);

    // Fetch live Kroombox CDN stats
    let cdnStats = {
      assets: 0,
      storageBytes: 0,
      quotaBytes: 10737418240, // 10 GB default
      bandwidthBytes: 0,
      status: 'connected',
      edgePoP: 'Singapore (sin-01)',
      health: 'HEALTHY'
    };

    try {
      const cdnRes = await fetch(`${CDN_BASE_URL}/api/bridge/stats`, {
        headers: {
          'x-api-key': CDN_API_KEY,
          'Authorization': `Bearer ${CDN_JWT_TOKEN}`
        }
      });
      if (cdnRes.ok) {
        const data: any = await cdnRes.json();
        cdnStats = {
          assets: data.assets || 0,
          storageBytes: data.storageBytes || 0,
          quotaBytes: data.quotaBytes || 10737418240,
          bandwidthBytes: data.bandwidthBytes || 0,
          status: 'connected',
          edgePoP: 'Singapore (sin-01)',
          health: 'HEALTHY'
        };
      }
    } catch (cdnErr) {
      console.warn('[CDN STATS FETCH WARN]', cdnErr);
      cdnStats.status = 'offline';
      cdnStats.health = 'DEGRADED';
    }

    res.json({
      success: true,
      stats: {
        totalUsers: userCount[0].count,
        totalOrganizations: orgCount[0].count,
        totalDocuments: docCount[0].count,
        documentRepoCount: repoCounts[0]?.document_count || 0,
        knowledgeRepoCount: repoCounts[0]?.knowledge_count || 0,
        cdn: cdnStats,
        ragEngine: {
          status: 'ready',
          baseUrl: process.env.RAG_BASE_URL || 'https://rag.aiones.app',
          model: 'Jev RAG Embedding & Retrieval'
        }
      }
    });
  } catch (err: any) {
    console.error('[ADMIN OVERVIEW ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data ringkasan admin.' });
  }
});

// 2. Get Users with Quota and Upload count
router.get('/users', async (_req: Request, res: Response): Promise<void> => {
  try {
    const p = getPool();
    const [rows] = await p.query<any[]>(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.department, 
        u.status, 
        u.doc_quota, 
        u.plan, 
        u.created_at,
        o.id as org_id,
        o.name as organization_name,
        (SELECT COUNT(*) FROM documents d WHERE d.uploaded_by_id = u.id) as doc_count
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      ORDER BY u.created_at DESC
    `);

    const users = rows.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      department: r.department || '-',
      status: r.status,
      docQuota: r.doc_quota || 5,
      plan: r.plan || 'free',
      organizationId: r.org_id,
      organizationName: r.organization_name || 'Belum Tergabung',
      docCount: r.doc_count || 0,
      createdAt: r.created_at
    }));

    res.json({ success: true, users });
  } catch (err: any) {
    console.error('[ADMIN GET USERS ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data pengguna.' });
  }
});

// 3. Update User Plan & Quota
router.post('/users/:id/quota', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { plan, docQuota } = req.body;
    const p = getPool();

    await p.query(
      'UPDATE users SET plan = ?, doc_quota = ? WHERE id = ?',
      [plan || 'free', Number(docQuota) || 5, id]
    );

    res.json({
      success: true,
      message: `Paket & kuota pengguna berhasil diperbarui ke "${plan}" (${docQuota} dokumen).`
    });
  } catch (err: any) {
    console.error('[ADMIN UPDATE QUOTA ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui kuota pengguna.' });
  }
});

// 4. Update Organization Status
router.post('/organizations/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const p = getPool();

    await p.query('UPDATE organizations SET status = ? WHERE id = ?', [status, id]);

    res.json({
      success: true,
      message: `Status organisasi berhasil diubah menjadi "${status}".`
    });
  } catch (err: any) {
    console.error('[ADMIN ORG STATUS ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal mengubah status organisasi.' });
  }
});

export default router;
