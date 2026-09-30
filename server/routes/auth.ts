import { Router, Request, Response } from 'express';
import { getPool } from '../db';
import bcrypt from 'bcryptjs';

const router = Router();

// 1. Regular User / Admin Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email dan kata sandi wajib diisi.' });
      return;
    }

    const p = getPool();
    const [rows] = await p.query<any[]>(
      `SELECT u.*, o.name as organization_name, o.code as organization_code 
       FROM users u 
       LEFT JOIN organizations o ON u.organization_id = o.id 
       WHERE LOWER(u.email) = LOWER(?)`,
      [email.trim()]
    );

    if (rows.length === 0) {
      res.status(401).json({ success: false, message: 'Email tidak ditemukan.' });
      return;
    }

    const user = rows[0];

    // If password_hash exists, compare; otherwise demo accepts password for dev convenience
    if (user.password_hash) {
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        res.status(401).json({ success: false, message: 'Kata sandi tidak sesuai.' });
        return;
      }
    }

    // Format user response object
    const userRes = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id,
      organizationName: user.organization_name,
      department: user.department,
      status: user.status,
      avatarInitials: user.avatar_initials || user.name.slice(0, 2).toUpperCase(),
      avatarUrl: user.avatar_url,
      phone: user.phone,
      employeeId: user.employee_id,
      orgJoinStatus: user.org_join_status,
      joinedAt: user.created_at
    };

    res.json({ success: true, user: userRes });
  } catch (err: any) {
    console.error('[AUTH ERROR]', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat login.' });
  }
});

// 2. Superadmin Login
router.post('/superadmin-login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const p = getPool();

    const [rows] = await p.query<any[]>(
      `SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND role = 'superadmin'`,
      [email.trim()]
    );

    if (rows.length === 0) {
      res.status(401).json({ success: false, message: 'Kredensial Superadmin tidak valid.' });
      return;
    }

    const user = rows[0];
    const userRes = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'superadmin',
      organizationId: null,
      organizationName: null,
      department: 'Platform Governance & Cloud Engineering',
      status: 'active',
      avatarInitials: user.avatar_initials || 'SA',
      avatarUrl: user.avatar_url,
      phone: user.phone,
      joinedAt: user.created_at
    };

    res.json({ success: true, user: userRes });
  } catch (err: any) {
    console.error('[SUPERADMIN AUTH ERROR]', err);
    res.status(500).json({ success: false, message: 'Kesalahan internal server.' });
  }
});

// 3. Register New User
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, employeeId, orgCode } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Nama, email, dan kata sandi wajib diisi.' });
      return;
    }

    const p = getPool();

    // Check if email already registered
    const [existing] = await p.query<any[]>('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (existing.length > 0) {
      res.status(400).json({ success: false, message: 'Email sudah terdaftar. Silakan masuk menggunakan akun tersebut.' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'US';
    const userId = `usr-${Date.now()}`;

    // Check organization code if provided
    let orgId: string | null = null;
    let orgName: string | null = null;
    let orgStatus: 'joined' | 'pending' | 'none' = 'none';

    if (orgCode && orgCode.trim()) {
      const cleanCode = orgCode.trim().toLowerCase();
      const [orgs] = await p.query<any[]>(
        'SELECT id, name FROM organizations WHERE LOWER(code) = ? OR LOWER(id) = ?',
        [cleanCode, cleanCode]
      );
      if (orgs.length > 0) {
        orgId = orgs[0].id;
        orgName = orgs[0].name;
        orgStatus = 'joined';
      }
    }

    await p.query(
      `INSERT INTO users (id, name, email, password_hash, role, organization_id, status, avatar_initials, phone, employee_id, org_join_status)
       VALUES (?, ?, ?, ?, 'user', ?, 'active', ?, ?, ?, ?)`,
      [userId, name.trim(), email.trim().toLowerCase(), passwordHash, orgId, initials, phone || null, employeeId || null, orgStatus]
    );

    const newUser = {
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: 'user',
      organizationId: orgId,
      organizationName: orgName,
      status: 'active',
      avatarInitials: initials,
      phone,
      employeeId,
      orgJoinStatus: orgStatus,
      joinedAt: new Date().toISOString()
    };

    res.status(201).json({ 
      success: true, 
      message: 'Registrasi berhasil!', 
      user: newUser,
      requiresOrgJoin: !orgId 
    });
  } catch (err: any) {
    console.error('[REGISTER ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal melakukan pendaftaran akun.' });
  }
});

// 4. Update Profile
router.put('/profile/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, phone, avatarUrl, department, employeeId } = req.body;

    const p = getPool();
    const initials = name ? name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : undefined;

    await p.query(
      `UPDATE users 
       SET name = COALESCE(?, name),
           email = COALESCE(?, email),
           phone = COALESCE(?, phone),
           avatar_url = COALESCE(?, avatar_url),
           avatar_initials = COALESCE(?, avatar_initials),
           department = COALESCE(?, department),
           employee_id = COALESCE(?, employee_id)
       WHERE id = ?`,
      [name, email, phone, avatarUrl, initials, department, employeeId, id]
    );

    // Fetch updated user
    const [rows] = await p.query<any[]>(
      `SELECT u.*, o.name as organization_name 
       FROM users u 
       LEFT JOIN organizations o ON u.organization_id = o.id 
       WHERE u.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
      return;
    }

    const u = rows[0];
    res.json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        organizationId: u.organization_id,
        organizationName: u.organization_name,
        avatarInitials: u.avatar_initials,
        avatarUrl: u.avatar_url,
        phone: u.phone,
        department: u.department,
        employeeId: u.employee_id,
        status: u.status
      }
    });
  } catch (err: any) {
    console.error('[PROFILE UPDATE ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui profil.' });
  }
});

// 5. Change Password
router.put('/change-password/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }

    const p = getPool();
    const [rows] = await p.query<any[]>('SELECT password_hash FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      return;
    }

    const currentHash = rows[0].password_hash;
    if (currentHash && oldPassword) {
      const match = await bcrypt.compare(oldPassword, currentHash);
      if (!match) {
        res.status(400).json({ success: false, message: 'Kata sandi saat ini tidak cocok.' });
        return;
      }
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await p.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, id]);

    res.json({ success: true, message: 'Kata sandi berhasil diperbarui.' });
  } catch (err: any) {
    console.error('[CHANGE PASSWORD ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal mengubah kata sandi.' });
  }
});

export default router;
