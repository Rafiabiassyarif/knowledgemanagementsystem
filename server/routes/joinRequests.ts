import { Router, Request, Response } from 'express';
import { getPool } from '../db';

const router = Router();

// 1. Get join requests for organization
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.query;
    const p = getPool();

    let query = 'SELECT * FROM join_requests';
    const params: any[] = [];

    if (organizationId && organizationId !== 'all') {
      query += ' WHERE organization_id = ?';
      params.push(organizationId);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await p.query<any[]>(query, params);
    const requests = rows.map(r => ({
      id: r.id,
      organizationId: r.organization_id,
      userId: r.user_id,
      applicantName: r.applicant_name,
      applicantEmail: r.applicant_email,
      reason: r.reason,
      status: r.status,
      createdAt: r.created_at
    }));

    res.json({ success: true, requests });
  } catch (err: any) {
    console.error('[GET REQUESTS ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil permohonan gabung.' });
  }
});

// 2. Submit new join request / Direct join
router.post('/join', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, organizationId } = req.body;
    if (!userId || !organizationId) {
      res.status(400).json({ success: false, message: 'User ID dan Organization ID wajib disertakan.' });
      return;
    }

    const p = getPool();

    // Verify organization
    const [orgRows] = await p.query<any[]>('SELECT id, name FROM organizations WHERE id = ?', [organizationId]);
    if (orgRows.length === 0) {
      res.status(404).json({ success: false, message: 'Organisasi tidak ditemukan.' });
      return;
    }
    const org = orgRows[0];

    // Assign user to organization
    await p.query(
      'UPDATE users SET organization_id = ?, org_join_status = "joined" WHERE id = ?',
      [organizationId, userId]
    );

    // Fetch updated user
    const [userRows] = await p.query<any[]>('SELECT name, role FROM users WHERE id = ?', [userId]);
    const userName = userRows[0]?.name || 'User';

    // Log activity
    await p.query(`
      INSERT INTO activity_logs (id, organization_id, organization_name, actor_name, actor_role, action, target, type)
      VALUES (?, ?, ?, ?, 'user', 'Bergabung ke Organisasi', ?, 'user')
    `, [`act-${Date.now()}`, organizationId, org.name, userName, org.name]);

    res.json({
      success: true,
      message: `Selamat! Anda berhasil bergabung ke organisasi ${org.name}.`,
      organization: org
    });
  } catch (err: any) {
    console.error('[JOIN ORG ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal bergabung ke organisasi.' });
  }
});

// 3. Leave organization
router.post('/leave', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID wajib disertakan.' });
      return;
    }

    const p = getPool();

    const [userRows] = await p.query<any[]>(`
      SELECT u.name, o.id as org_id, o.name as org_name 
      FROM users u 
      LEFT JOIN organizations o ON u.organization_id = o.id 
      WHERE u.id = ?
    `, [userId]);

    if (userRows.length === 0) {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      return;
    }

    const u = userRows[0];

    await p.query('UPDATE users SET organization_id = NULL, org_join_status = "none" WHERE id = ?', [userId]);

    if (u.org_id) {
      await p.query(`
        INSERT INTO activity_logs (id, organization_id, organization_name, actor_name, actor_role, action, target, type)
        VALUES (?, ?, ?, ?, 'user', 'Keluar dari Organisasi', ?, 'user')
      `, [`act-${Date.now()}`, u.org_id, u.org_name, u.name, u.org_name]);
    }

    res.json({ success: true, message: `Berhasil keluar dari organisasi ${u.org_name || ''}.` });
  } catch (err: any) {
    console.error('[LEAVE ORG ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal memproses permohonan keluar.' });
  }
});

export default router;
