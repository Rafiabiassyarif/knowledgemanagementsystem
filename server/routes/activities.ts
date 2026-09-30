import { Router, Request, Response } from 'express';
import { getPool } from '../db';

const router = Router();

// 1. Get activity logs (capped at 50 to optimize memory & storage)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId, type, search } = req.query;
    const p = getPool();

    let query = 'SELECT * FROM activity_logs';
    const params: any[] = [];
    const conditions: string[] = [];

    if (organizationId && organizationId !== 'all') {
      conditions.push('organization_id = ?');
      params.push(organizationId);
    }

    if (type && type !== 'all') {
      conditions.push('type = ?');
      params.push(type);
    }

    if (search) {
      conditions.push('(actor_name LIKE ? OR target LIKE ? OR action LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const [rows] = await p.query<any[]>(query, params);

    const logs = rows.map(r => ({
      id: r.id,
      organizationId: r.organization_id,
      organizationName: r.organization_name,
      actorName: r.actor_name,
      actorRole: r.actor_role,
      action: r.action,
      target: r.target,
      timestamp: r.created_at,
      type: r.type
    }));

    res.json({ success: true, logs });
  } catch (err: any) {
    console.error('[GET ACTIVITIES ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil log aktivitas.' });
  }
});

// 2. Clear all activity logs
router.delete('/clear', async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.query;
    const p = getPool();

    if (organizationId && organizationId !== 'all') {
      await p.query('DELETE FROM activity_logs WHERE organization_id = ?', [organizationId]);
    } else {
      await p.query('DELETE FROM activity_logs');
    }

    res.json({ success: true, message: 'Riwayat log aktivitas berhasil dibersihkan.' });
  } catch (err: any) {
    console.error('[CLEAR ACTIVITIES ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal membersihkan log aktivitas.' });
  }
});

// 3. Delete single activity log
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const p = getPool();

    await p.query('DELETE FROM activity_logs WHERE id = ?', [id]);
    res.json({ success: true, message: 'Item aktivitas berhasil dihapus.' });
  } catch (err: any) {
    console.error('[DELETE ACTIVITY ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus log aktivitas.' });
  }
});

export default router;
