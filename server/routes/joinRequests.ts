import { Router, Request, Response } from 'express';
import { getPool } from '../db';

const router = Router();

// 1. Get join requests (superadmin: all, admin: their org, user: their own)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.query;
    const authUser = (req as any).authUser;
    const p = getPool();

    let query = 'SELECT * FROM join_requests';
    const params: any[] = [];
    const conditions: string[] = [];

    if (authUser?.role === 'admin' && authUser.organizationId) {
      conditions.push('organization_id = ?');
      params.push(authUser.organizationId);
    } else if (authUser?.role === 'user') {
      conditions.push('user_id = ?');
      params.push(authUser.id);
    } else if (organizationId && organizationId !== 'all') {
      conditions.push('organization_id = ?');
      params.push(organizationId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await p.query<any[]>(query, params);
    const requests = rows.map(r => ({
      id: r.id,
      organizationId: r.organization_id,
      organizationCode: r.organization_code || null,
      organizationName: r.organization_name || null,
      userId: r.user_id,
      applicantName: r.applicant_name,
      applicantEmail: r.applicant_email,
      department: r.department || null,
      reason: r.reason,
      status: r.status,
      requestedAt: r.created_at,
      createdAt: r.created_at
    }));

    res.json({ success: true, requests });
  } catch (err: any) {
    console.error('[GET REQUESTS ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil permohonan gabung.' });
  }
});

// 2. Submit new join request (pending approval) or direct join fallback
router.post('/join', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, organizationId, reason, department } = req.body;
    if (!userId || !organizationId) {
      res.status(400).json({ success: false, message: 'User ID dan Organization ID wajib disertakan.' });
      return;
    }

    const p = getPool();

    const [orgRows] = await p.query<any[]>('SELECT id, name, code FROM organizations WHERE id = ? OR LOWER(code) = LOWER(?)', [organizationId, organizationId]);
    if (orgRows.length === 0) {
      res.status(404).json({ success: false, message: 'Organisasi tidak ditemukan.' });
      return;
    }
    const org = orgRows[0];

    const [userRows] = await p.query<any[]>('SELECT id, name, email, role FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      return;
    }
    const user = userRows[0];

    // Admins and superadmins join directly; regular users go through pending approval
    if (user.role !== 'user') {
      await p.query(
        'UPDATE users SET organization_id = ?, org_join_status = "joined" WHERE id = ?',
        [org.id, userId]
      );
      await logActivity(p, org.id, org.name, user.name, user.role, 'Bergabung ke Organisasi', org.name);
      res.json({
        success: true,
        status: 'joined',
        message: `Selamat! Anda berhasil bergabung ke organisasi ${org.name}.`,
        organization: { id: org.id, name: org.name, code: org.code }
      });
      return;
    }

    // Prevent duplicate pending request / duplicate membership
    const [dupCheck] = await p.query<any[]>(
      'SELECT id, status FROM join_requests WHERE user_id = ? AND organization_id = ? AND status = "pending"',
      [userId, org.id]
    );
    if (dupCheck.length > 0) {
      res.status(409).json({ success: false, message: 'Anda sudah memiliki permohonan pending ke organisasi ini.' });
      return;
    }

    const [memberCheck] = await p.query<any[]>(
      'SELECT id FROM users WHERE id = ? AND organization_id = ?',
      [userId, org.id]
    );
    if (memberCheck.length > 0) {
      res.status(409).json({ success: false, message: 'Anda sudah menjadi anggota organisasi ini.' });
      return;
    }

    const reqId = `req-${Date.now()}`;
    await p.query(
      `INSERT INTO join_requests (id, organization_id, organization_code, organization_name, user_id, applicant_name, applicant_email, department, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [reqId, org.id, org.code, org.name, userId, user.name, user.email, department || null, reason || null]
    );

    await p.query('UPDATE users SET org_join_status = "pending" WHERE id = ?', [userId]);
    await logActivity(p, org.id, org.name, user.name, user.role, 'Mengajukan Permohonan Gabung', org.name);

    res.status(201).json({
      success: true,
      status: 'pending',
      message: `Permohonan bergabung ke ${org.name} berhasil diajukan. Menunggu persetujuan admin.`,
      requestId: reqId
    });
  } catch (err: any) {
    console.error('[JOIN ORG ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal memproses permohonan bergabung.' });
  }
});

// 3. Approve join request (admin of that org or superadmin)
router.post('/:id/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const authUser = (req as any).authUser;
    const p = getPool();

    const [rows] = await p.query<any[]>('SELECT * FROM join_requests WHERE id = ?', [id]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Permohonan tidak ditemukan.' });
      return;
    }
    const request = rows[0];

    if (request.status !== 'pending') {
      res.status(400).json({ success: false, message: `Permohonan ini sudah diproses (status: ${request.status}).` });
      return;
    }

    if (authUser?.role === 'admin' && authUser.organizationId !== request.organization_id) {
      res.status(403).json({ success: false, message: 'Anda hanya dapat menyetujui permohonan untuk organisasi Anda.' });
      return;
    }

    // Approve: set request status, attach user to org
    await p.query('UPDATE join_requests SET status = "approved" WHERE id = ?', [id]);
    await p.query(
      'UPDATE users SET organization_id = ?, org_join_status = "joined" WHERE id = ?',
      [request.organization_id, request.user_id]
    );

    await logActivity(
      p, request.organization_id, request.organization_name,
      authUser?.name || 'Admin', authUser?.role || 'admin',
      'Menyetujui Permintaan Bergabung', `${request.applicant_name} bergabung ke organisasi`
    );

    res.json({ success: true, message: `Permohonan ${request.applicant_name} disetujui.` });
  } catch (err: any) {
    console.error('[APPROVE REQUEST ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal menyetujui permohonan.' });
  }
});

// 4. Reject join request (admin of that org or superadmin)
router.post('/:id/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const authUser = (req as any).authUser;
    const p = getPool();

    const [rows] = await p.query<any[]>('SELECT * FROM join_requests WHERE id = ?', [id]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Permohonan tidak ditemukan.' });
      return;
    }
    const request = rows[0];

    if (request.status !== 'pending') {
      res.status(400).json({ success: false, message: `Permohonan ini sudah diproses (status: ${request.status}).` });
      return;
    }

    if (authUser?.role === 'admin' && authUser.organizationId !== request.organization_id) {
      res.status(403).json({ success: false, message: 'Anda hanya dapat menolak permohonan untuk organisasi Anda.' });
      return;
    }

    await p.query('UPDATE join_requests SET status = "rejected" WHERE id = ?', [id]);
    await p.query('UPDATE users SET org_join_status = "none" WHERE id = ?', [request.user_id]);

    await logActivity(
      p, request.organization_id, request.organization_name,
      authUser?.name || 'Admin', authUser?.role || 'admin',
      'Menolak Permintaan Bergabung', request.applicant_name
    );

    res.json({ success: true, message: `Permohonan ${request.applicant_name} ditolak.` });
  } catch (err: any) {
    console.error('[REJECT REQUEST ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal menolak permohonan.' });
  }
});

// 5. Leave organization
router.post('/leave', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    const authUser = (req as any).authUser;

    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID wajib disertakan.' });
      return;
    }
    if (authUser && authUser.id !== userId && authUser.role !== 'superadmin') {
      res.status(403).json({ success: false, message: 'Anda hanya dapat mengeluarkan diri sendiri.' });
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
      await logActivity(p, u.org_id, u.org_name, u.name, authUser?.role || 'user', 'Keluar dari Organisasi', u.org_name);
    }

    res.json({ success: true, message: `Berhasil keluar dari organisasi ${u.org_name || ''}.` });
  } catch (err: any) {
    console.error('[LEAVE ORG ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal memproses permohonan keluar.' });
  }
});

// Helper: insert activity log
async function logActivity(
  p: any, organizationId: string | null, organizationName: string | null,
  actorName: string, actorRole: string, action: string, target: string | null
) {
  await p.query(
    `INSERT INTO activity_logs (id, organization_id, organization_name, actor_name, actor_role, action, target, type)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'user')`,
    [`act-${Date.now()}-${Math.floor(Math.random() * 1000)}`, organizationId, organizationName, actorName, actorRole, action, target]
  );
}

export default router;
