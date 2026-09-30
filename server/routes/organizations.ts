import { Router, Request, Response } from 'express';
import { getPool } from '../db';

const router = Router();

// 1. Get all organizations with calculated stats
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const p = getPool();
    const [rows] = await p.query<any[]>(`
      SELECT 
        o.*,
        (SELECT COUNT(*) FROM documents d WHERE d.organization_id = o.id) as documentsCount,
        (SELECT COUNT(*) FROM users u WHERE u.organization_id = o.id) as usersCount
      FROM organizations o
      ORDER BY o.created_at DESC
    `);

    const orgs = rows.map(r => ({
      id: r.id,
      name: r.name,
      code: r.code,
      type: r.type,
      sector: r.sector,
      province: r.province,
      city: r.city,
      address: r.address,
      phone: r.phone,
      email: r.email,
      website: r.website,
      description: r.description,
      adminName: r.admin_name,
      status: r.status,
      documentsCount: Number(r.documentsCount) || 0,
      usersCount: Number(r.usersCount) || 0,
      chunksCount: (Number(r.documentsCount) || 0) * 12,
      aiQueriesCount: 0,
      storageUsedMb: Math.round((Number(r.documentsCount) || 0) * 4.5),
      createdAt: r.created_at
    }));

    res.json({ success: true, organizations: orgs });
  } catch (err: any) {
    console.error('[GET ORGS ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data organisasi.' });
  }
});

// 2. Get single organization detail
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const p = getPool();

    const [rows] = await p.query<any[]>(`
      SELECT 
        o.*,
        (SELECT COUNT(*) FROM documents d WHERE d.organization_id = o.id) as documentsCount,
        (SELECT COUNT(*) FROM users u WHERE u.organization_id = o.id) as usersCount
      FROM organizations o
      WHERE o.id = ?
    `, [id]);

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Organisasi tidak ditemukan.' });
      return;
    }

    const r = rows[0];
    const org = {
      id: r.id,
      name: r.name,
      code: r.code,
      type: r.type,
      sector: r.sector,
      province: r.province,
      city: r.city,
      address: r.address,
      phone: r.phone,
      email: r.email,
      website: r.website,
      description: r.description,
      adminName: r.admin_name,
      status: r.status,
      documentsCount: Number(r.documentsCount) || 0,
      usersCount: Number(r.usersCount) || 0,
      chunksCount: (Number(r.documentsCount) || 0) * 12,
      aiQueriesCount: 0,
      storageUsedMb: Math.round((Number(r.documentsCount) || 0) * 4.5),
      createdAt: r.created_at
    };

    res.json({ success: true, organization: org });
  } catch (err: any) {
    console.error('[GET ORG ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal memuat detail organisasi.' });
  }
});

// 3. Create new organization
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      code,
      type,
      sector,
      province,
      city,
      address,
      phone,
      email,
      website,
      description,
      adminName,
      creatorId,
      creatorRole
    } = req.body;

    if (!name || !code || !type) {
      res.status(400).json({ success: false, message: 'Nama, kode unik, dan tipe organisasi wajib diisi.' });
      return;
    }

    const p = getPool();

    // Check code uniqueness
    const [existing] = await p.query<any[]>('SELECT id FROM organizations WHERE LOWER(code) = LOWER(?)', [code.trim()]);
    if (existing.length > 0) {
      res.status(400).json({ success: false, message: `Kode organisasi "${code}" sudah digunakan. Gunakan kode lain.` });
      return;
    }

    // If creator is admin, check 1-org limit
    if (creatorRole === 'admin' && creatorId) {
      const [adminUser] = await p.query<any[]>('SELECT organization_id FROM users WHERE id = ?', [creatorId]);
      if (adminUser.length > 0 && adminUser[0].organization_id) {
        res.status(403).json({ 
          success: false, 
          message: 'Batas kuota tercapai: Akun Admin hanya diizinkan mengelola maksimal 1 organisasi aktif.' 
        });
        return;
      }
    }

    const orgId = `org-${Date.now()}`;
    await p.query(`
      INSERT INTO organizations (id, name, code, type, sector, province, city, address, phone, email, website, description, admin_name, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `, [
      orgId,
      name.trim(),
      code.trim().toUpperCase(),
      type,
      sector || null,
      province || null,
      city || null,
      address || null,
      phone || null,
      email || null,
      website || null,
      description || null,
      adminName || null
    ]);

    // Link creator to this organization if creator is admin
    if (creatorId) {
      await p.query('UPDATE users SET organization_id = ? WHERE id = ?', [orgId, creatorId]);
    }

    // Log activity
    await p.query(`
      INSERT INTO activity_logs (id, organization_id, organization_name, actor_name, actor_role, action, target, type)
      VALUES (?, ?, ?, ?, ?, 'Menambahkan Organisasi Baru', ?, 'organization')
    `, [
      `act-${Date.now()}`,
      orgId,
      name,
      adminName || 'Admin',
      creatorRole || 'admin',
      name
    ]);

    const newOrg = {
      id: orgId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type,
      sector,
      province,
      city,
      address,
      phone,
      email,
      website,
      description,
      adminName,
      status: 'active',
      documentsCount: 0,
      usersCount: 1,
      chunksCount: 0,
      aiQueriesCount: 0,
      storageUsedMb: 0,
      createdAt: new Date().toISOString()
    };

    res.status(201).json({ success: true, message: 'Organisasi berhasil dibuat!', organization: newOrg });
  } catch (err: any) {
    console.error('[CREATE ORG ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal membuat organisasi baru.' });
  }
});

// 4. Update organization
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, code, type, sector, province, city, address, phone, email, website, description, adminName } = req.body;

    const p = getPool();
    await p.query(`
      UPDATE organizations 
      SET name = COALESCE(?, name),
          code = COALESCE(?, code),
          type = COALESCE(?, type),
          sector = COALESCE(?, sector),
          province = COALESCE(?, province),
          city = COALESCE(?, city),
          address = COALESCE(?, address),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          website = COALESCE(?, website),
          description = COALESCE(?, description),
          admin_name = COALESCE(?, admin_name)
      WHERE id = ?
    `, [name, code, type, sector, province, city, address, phone, email, website, description, adminName, id]);

    res.json({ success: true, message: 'Data organisasi berhasil diperbarui.' });
  } catch (err: any) {
    console.error('[UPDATE ORG ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui organisasi.' });
  }
});

// 5. Delete organization
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const p = getPool();

    const [rows] = await p.query<any[]>('SELECT name FROM organizations WHERE id = ?', [id]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Organisasi tidak ditemukan.' });
      return;
    }

    const orgName = rows[0].name;

    // Reset organization_id in users
    await p.query('UPDATE users SET organization_id = NULL, org_join_status = "none" WHERE organization_id = ?', [id]);
    // Delete organization (documents and join requests will cascade)
    await p.query('DELETE FROM organizations WHERE id = ?', [id]);

    // Log activity
    await p.query(`
      INSERT INTO activity_logs (id, organization_id, organization_name, actor_name, actor_role, action, target, type)
      VALUES (?, NULL, NULL, 'Admin', 'admin', 'Menghapus Organisasi', ?, 'organization')
    `, [`act-${Date.now()}`, orgName]);

    res.json({ success: true, message: `Organisasi ${orgName} berhasil dihapus.` });
  } catch (err: any) {
    console.error('[DELETE ORG ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus organisasi.' });
  }
});

// 6. Toggle status
router.patch('/:id/toggle-status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const p = getPool();

    const [rows] = await p.query<any[]>('SELECT status, name FROM organizations WHERE id = ?', [id]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Organisasi tidak ditemukan.' });
      return;
    }

    const newStatus = rows[0].status === 'active' ? 'inactive' : 'active';
    await p.query('UPDATE organizations SET status = ? WHERE id = ?', [newStatus, id]);

    res.json({ success: true, status: newStatus, message: `Status organisasi diubah menjadi ${newStatus}.` });
  } catch (err: any) {
    console.error('[TOGGLE STATUS ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal mengubah status organisasi.' });
  }
});

export default router;
