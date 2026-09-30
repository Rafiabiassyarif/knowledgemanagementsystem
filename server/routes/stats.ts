import { Router, Request, Response } from 'express';
import { getPool } from '../db';

const router = Router();

router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId, role } = req.query;
    const p = getPool();

    if (role === 'superadmin' || !organizationId || organizationId === 'all') {
      // Global Platform Stats for Superadmin
      const [[orgCount]] = await p.query<any[]>('SELECT COUNT(*) as cnt FROM organizations');
      const [[docCount]] = await p.query<any[]>('SELECT COUNT(*) as cnt, COALESCE(SUM(file_size_kb), 0) as totalKb FROM documents');
      const [[userCount]] = await p.query<any[]>('SELECT COUNT(*) as cnt FROM users');
      const [typeBreakdown] = await p.query<any[]>(`
        SELECT type, COUNT(*) as count 
        FROM organizations 
        GROUP BY type
      `);

      const totalDocs = Number(docCount.cnt) || 0;
      const totalStorageMb = Math.round((Number(docCount.totalKb) || 0) / 1024);

      res.json({
        success: true,
        stats: {
          totalOrganizations: Number(orgCount.cnt) || 0,
          totalDocuments: totalDocs,
          totalUsers: Number(userCount.cnt) || 0,
          totalChunks: totalDocs * 12,
          totalStorageMb,
          aiQueriesCount: 0,
          typeBreakdown
        }
      });
    } else {
      // Scoped Single Organization Stats for Admin
      const [orgRows] = await p.query<any[]>('SELECT * FROM organizations WHERE id = ?', [organizationId]);
      if (orgRows.length === 0) {
        res.status(404).json({ success: false, message: 'Organisasi tidak ditemukan.' });
        return;
      }

      const [[docCount]] = await p.query<any[]>(
        'SELECT COUNT(*) as cnt, COALESCE(SUM(file_size_kb), 0) as totalKb FROM documents WHERE organization_id = ?',
        [organizationId]
      );
      const [[userCount]] = await p.query<any[]>(
        'SELECT COUNT(*) as cnt FROM users WHERE organization_id = ?',
        [organizationId]
      );

      const totalDocs = Number(docCount.cnt) || 0;
      const totalStorageMb = Math.round((Number(docCount.totalKb) || 0) / 1024);

      res.json({
        success: true,
        stats: {
          organization: orgRows[0],
          totalDocuments: totalDocs,
          totalUsers: Number(userCount.cnt) || 0,
          totalChunks: totalDocs * 12,
          totalStorageMb,
          aiQueriesCount: 0
        }
      });
    }
  } catch (err: any) {
    console.error('[GET STATS ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal memuat statistik sistem.' });
  }
});

export default router;
