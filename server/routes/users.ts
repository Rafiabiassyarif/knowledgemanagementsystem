import { Router, Request, Response } from 'express';
import { getPool } from '../db';

const router = Router();

// 1. Get users (with optional organization filter)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.query;
    const p = getPool();

    let query = `
      SELECT u.*, o.name as organization_name 
      FROM users u 
      LEFT JOIN organizations o ON u.organization_id = o.id
    `;
    const params: any[] = [];

    if (organizationId && organizationId !== 'all') {
      query += ' WHERE u.organization_id = ?';
      params.push(organizationId);
    }

    query += ' ORDER BY u.created_at DESC';

    const [rows] = await p.query<any[]>(query, params);

    const users = rows.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      organizationId: u.organization_id,
      organizationName: u.organization_name,
      status: u.status,
      avatarInitials: u.avatar_initials || u.name.slice(0, 2).toUpperCase(),
      avatarUrl: u.avatar_url,
      phone: u.phone,
      employeeId: u.employee_id,
      department: u.department,
      orgJoinStatus: u.org_join_status,
      joinedAt: u.created_at
    }));

    res.json({ success: true, users });
  } catch (err: any) {
    console.error('[GET USERS ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data anggota.' });
  }
});

// 2. Add user to organization
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, organizationId, role = 'user' } = req.body;
    if (!name || !email) {
      res.status(400).json({ success: false, message: 'Nama dan email wajib diisi.' });
      return;
    }

    const p = getPool();

    // Check email uniqueness
    const [existing] = await p.query<any[]>('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (existing.length > 0) {
      res.status(400).json({ success: false, message: 'Email sudah terdaftar dalam sistem.' });
      return;
    }

    const userId = `usr-${Date.now()}`;
    const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'US';

    await p.query(`
      INSERT INTO users (id, name, email, role, organization_id, status, avatar_initials, org_join_status)
      VALUES (?, ?, ?, ?, ?, 'active', ?, 'joined')
    `, [userId, name.trim(), email.trim().toLowerCase(), role, organizationId || null, initials]);

    // Fetch created user with org name
    const [rows] = await p.query<any[]>(`
      SELECT u.*, o.name as organization_name 
      FROM users u 
      LEFT JOIN organizations o ON u.organization_id = o.id 
      WHERE u.id = ?
    `, [userId]);

    const created = rows[0];

    // Log activity
    await p.query(`
      INSERT INTO activity_logs (id, organization_id, organization_name, actor_name, actor_role, action, target, type)
      VALUES (?, ?, ?, 'Admin', 'admin', 'Menambahkan Anggota Baru', ?, 'user')
    `, [`act-${Date.now()}`, organizationId || null, created.organization_name || null, name]);

    res.status(201).json({
      success: true,
      message: `Anggota ${name} berhasil ditambahkan!`,
      user: {
        id: created.id,
        name: created.name,
        email: created.email,
        role: created.role,
        organizationId: created.organization_id,
        organizationName: created.organization_name,
        status: created.status,
        avatarInitials: created.avatar_initials,
        joinedAt: created.created_at
      }
    });
  } catch (err: any) {
    console.error('[ADD USER ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan anggota baru.' });
  }
});

// 3. Update user
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, role, organizationId, status } = req.body;

    const p = getPool();
    const initials = name ? name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : undefined;

    await p.query(`
      UPDATE users 
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          role = COALESCE(?, role),
          organization_id = COALESCE(?, organization_id),
          status = COALESCE(?, status),
          avatar_initials = COALESCE(?, avatar_initials)
      WHERE id = ?
    `, [name, email, role, organizationId, status, initials, id]);

    res.json({ success: true, message: 'Data anggota berhasil diperbarui.' });
  } catch (err: any) {
    console.error('[UPDATE USER ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui data anggota.' });
  }
});

// 4. Update user role (promote to admin or demote to user)
router.patch('/:id/role', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      res.status(400).json({ success: false, message: 'Peran tidak valid.' });
      return;
    }

    const p = getPool();
    await p.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);

    res.json({ success: true, message: `Peran berhasil diubah menjadi ${role}.` });
  } catch (err: any) {
    console.error('[UPDATE ROLE ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal mengubah peran anggota.' });
  }
});

// 5. Eject member from organization
router.post('/:id/eject', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const p = getPool();

    const [rows] = await p.query<any[]>(`
      SELECT u.name, o.id as org_id, o.name as org_name 
      FROM users u 
      LEFT JOIN organizations o ON u.organization_id = o.id 
      WHERE u.id = ?
    `, [id]);

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      return;
    }

    const user = rows[0];

    await p.query('UPDATE users SET organization_id = NULL, org_join_status = "none" WHERE id = ?', [id]);

    // Log activity
    await p.query(`
      INSERT INTO activity_logs (id, organization_id, organization_name, actor_name, actor_role, action, target, type)
      VALUES (?, ?, ?, 'Admin', 'admin', 'Mengeluarkan Anggota', ?, 'user')
    `, [`act-${Date.now()}`, user.org_id, user.org_name, user.name]);

    res.json({ success: true, message: `${user.name} berhasil dikeluarkan dari organisasi.` });
  } catch (err: any) {
    console.error('[EJECT USER ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal mengeluarkan anggota dari organisasi.' });
  }
});

export default router;
