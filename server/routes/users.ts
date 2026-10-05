import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getPool } from '../db';
import { requireRole } from '../middleware/auth';

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

// 2. Add user to organization (admin & superadmin only)
router.post('/', requireRole('admin', 'superadmin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, organizationId, role = 'user', password, department, position } = req.body;
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

    // Akun baru wajib punya sandi agar bisa login: pakai `password` bila dikirim,
    // jika tidak gunakan DEFAULT_USER_PASSWORD / DEMO_PASSWORD.
    const plainPassword = String(password || process.env.DEFAULT_USER_PASSWORD || process.env.DEMO_PASSWORD || 'password123');
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    await p.query(`
      INSERT INTO users (id, name, email, password_hash, role, organization_id, status, avatar_initials, org_join_status, department, position)
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?, 'joined', ?, ?)
    `, [userId, name.trim(), email.trim().toLowerCase(), passwordHash, role, organizationId || null, initials, department || null, position || null]);

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

// 3. Update user (self, admin of the same organization, or superadmin)
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const actor = req.authUser!;
    const { name, email, role, organizationId, status } = req.body;

    const p = getPool();

    const [targetRows] = await p.query<any[]>('SELECT id, role, organization_id FROM users WHERE id = ?', [id]);
    if (targetRows.length === 0) {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      return;
    }
    const target = targetRows[0];

    const isSelf = actor.id === id;
    const isSuperadmin = actor.role === 'superadmin';
    const isSameOrgAdmin = actor.role === 'admin' && !!actor.organizationId && target.organization_id === actor.organizationId;

    if (!isSelf && !isSuperadmin && !isSameOrgAdmin) {
      res.status(403).json({ success: false, message: 'Anda tidak memiliki wewenang untuk memperbarui data pengguna ini.' });
      return;
    }

    // Only superadmin may change role / status / organization assignment via this endpoint
    const safeRole = isSuperadmin ? role : undefined;
    const safeStatus = isSuperadmin ? status : undefined;
    const safeOrganizationId = isSuperadmin ? organizationId : undefined;

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
    `, [name, email, safeRole, safeOrganizationId, safeStatus, initials, id]);

    res.json({ success: true, message: 'Data anggota berhasil diperbarui.' });
  } catch (err: any) {
    console.error('[UPDATE USER ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui data anggota.' });
  }
});

// 4. Update user role (promote to admin or demote to user) - superadmin only
router.patch('/:id/role', requireRole('superadmin'), async (req: Request, res: Response): Promise<void> => {
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

// 6. Update user account status (suspend / re-activate) - admin & superadmin only
router.patch('/:id/status', requireRole('admin', 'superadmin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const actor = req.authUser!;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      res.status(400).json({ success: false, message: 'Status akun tidak valid.' });
      return;
    }

    if (actor.id === id) {
      res.status(400).json({ success: false, message: 'Anda tidak dapat mengubah status akun sendiri.' });
      return;
    }

    const p = getPool();
    const [rows] = await p.query<any[]>(`
      SELECT u.id, u.name, u.role, u.organization_id, o.name as organization_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = ?
    `, [id]);

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      return;
    }

    const target = rows[0];

    if (target.role === 'superadmin') {
      res.status(403).json({ success: false, message: 'Akun Superadmin tidak dapat dinonaktifkan.' });
      return;
    }

    if (actor.role === 'admin' && (!actor.organizationId || target.organization_id !== actor.organizationId)) {
      res.status(403).json({ success: false, message: 'Anda hanya dapat mengelola akun anggota di organisasi Anda.' });
      return;
    }

    await p.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);

    const isSuspend = status === 'inactive';

    // Log activity
    await p.query(`
      INSERT INTO activity_logs (id, organization_id, organization_name, actor_name, actor_role, action, target, type)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'user')
    `, [
      `act-${Date.now()}`,
      target.organization_id || null,
      target.organization_name || null,
      actor.name,
      actor.role,
      isSuspend ? 'Menonaktifkan Akun Anggota' : 'Mengaktifkan Kembali Akun Anggota',
      target.name
    ]);

    res.json({
      success: true,
      status,
      message: isSuspend
        ? `Akun ${target.name} berhasil dinonaktifkan. Pengguna tidak dapat login hingga diaktifkan kembali.`
        : `Akun ${target.name} berhasil diaktifkan kembali.`
    });
  } catch (err: any) {
    console.error('[UPDATE USER STATUS ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal mengubah status akun pengguna.' });
  }
});

// 7. Reset a member's password (admin & superadmin only, old password not required)
router.patch('/:id/reset-password', requireRole('admin', 'superadmin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const actor = req.authUser!;
    const { newPassword } = req.body;

    if (!newPassword || String(newPassword).length < 6) {
      res.status(400).json({ success: false, message: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }

    if (actor.id === id) {
      res.status(400).json({ success: false, message: 'Gunakan menu profil untuk mengubah kata sandi akun sendiri.' });
      return;
    }

    const p = getPool();
    const [rows] = await p.query<any[]>(`
      SELECT u.id, u.name, u.role, u.organization_id, o.name as organization_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = ?
    `, [id]);

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      return;
    }

    const target = rows[0];

    if (target.role === 'superadmin') {
      res.status(403).json({ success: false, message: 'Kata sandi akun Superadmin tidak dapat direset dari sini.' });
      return;
    }

    if (actor.role === 'admin' && (!actor.organizationId || target.organization_id !== actor.organizationId)) {
      res.status(403).json({ success: false, message: 'Anda hanya dapat mengelola akun anggota di organisasi Anda.' });
      return;
    }

    const newHash = await bcrypt.hash(String(newPassword), 10);
    await p.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, id]);

    // Log activity
    await p.query(`
      INSERT INTO activity_logs (id, organization_id, organization_name, actor_name, actor_role, action, target, type)
      VALUES (?, ?, ?, ?, ?, 'Reset Kata Sandi Anggota', ?, 'user')
    `, [
      `act-${Date.now()}`,
      target.organization_id || null,
      target.organization_name || null,
      actor.name,
      actor.role,
      target.name
    ]);

    res.json({ success: true, message: `Kata sandi ${target.name} berhasil direset. Sampaikan kata sandi baru kepada yang bersangkutan.` });
  } catch (err: any) {
    console.error('[RESET PASSWORD ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal mereset kata sandi pengguna.' });
  }
});

// 8. Delete a user account permanently - admin & superadmin only
router.delete('/:id', requireRole('admin', 'superadmin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const actor = req.authUser!;

    if (actor.id === id) {
      res.status(400).json({ success: false, message: 'Anda tidak dapat menghapus akun sendiri.' });
      return;
    }

    const p = getPool();
    const [rows] = await p.query<any[]>(`
      SELECT u.id, u.name, u.role, u.organization_id, o.name as organization_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = ?
    `, [id]);

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      return;
    }

    const target = rows[0];

    if (target.role === 'superadmin') {
      res.status(403).json({ success: false, message: 'Akun Superadmin tidak dapat dihapus.' });
      return;
    }

    if (actor.role === 'admin' && (!actor.organizationId || target.organization_id !== actor.organizationId)) {
      res.status(403).json({ success: false, message: 'Anda hanya dapat mengelola akun anggota di organisasi Anda.' });
      return;
    }

    // Clean up related rows first (no FK constraints to users, keep data consistent)
    await p.query('DELETE FROM join_requests WHERE user_id = ?', [id]);
    await p.query('DELETE FROM users WHERE id = ?', [id]);

    // Log activity
    await p.query(`
      INSERT INTO activity_logs (id, organization_id, organization_name, actor_name, actor_role, action, target, type)
      VALUES (?, ?, ?, ?, ?, 'Menghapus Akun Anggota', ?, 'user')
    `, [
      `act-${Date.now()}`,
      target.organization_id || null,
      target.organization_name || null,
      actor.name,
      actor.role,
      target.name
    ]);

    res.json({ success: true, message: `Akun ${target.name} beserta data terkaitnya berhasil dihapus permanen.` });
  } catch (err: any) {
    console.error('[DELETE USER ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus akun pengguna.' });
  }
});

export default router;
