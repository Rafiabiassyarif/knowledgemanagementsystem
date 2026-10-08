import { Router, Request, Response } from 'express';
import { getPool } from '../db';
import { requireAuth } from '../middleware/auth';
import { ensureProjectRagKey, revokeProjectRagKey } from '../services/ragKeys';
import { deleteDocumentFromRag } from '../services/rag';
import { deleteFromKroomboxCDN } from '../services/cdn';

const router = Router();

// 1. Get all organizations with calculated stats (admin: semua project, user: miliknya)
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const p = getPool();
    const user = req.authUser;

    let query = `
      SELECT 
        o.*,
        COALESCE(
          (SELECT email FROM users u WHERE u.organization_id = o.id AND u.role = 'admin' LIMIT 1),
          o.email
        ) as adminEmail,
        (SELECT COUNT(*) FROM documents d WHERE d.organization_id = o.id) as documentsCount,
        (SELECT COUNT(*) FROM users u WHERE u.organization_id = o.id) as usersCount
      FROM organizations o
    `;
    const params: any[] = [];

    // User isolation:
    // Admin dapat melihat & mengelola SEMUA project.
    // User biasa HANYA melihat project milik mereka sendiri (yang mereka buat atau tempat mereka bergabung).
    // Admin mengelola SEMUA project; user biasa hanya project miliknya sendiri.
    if (user && user.role !== 'admin') {
      query += `
        WHERE (
          o.created_by = ? 
          OR o.id = (SELECT organization_id FROM users WHERE id = ?) 
          OR (o.created_by IS NULL AND o.admin_name = ?)
        )
      `;
      params.push(user.id, user.id, user.name);
    }

    query += ' ORDER BY o.created_at DESC';

    const [rows] = await p.query<any[]>(query, params);

    const orgs = rows.map(r => ({
      id: r.id,
      name: r.name,
      code: r.code,
      knowledgeBase: r.knowledge_base || ('kb_' + (r.code || 'utama').toLowerCase().replace(/[^a-z0-9_]/g, '_')),
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
      adminEmail: r.adminEmail || r.email || null,
      createdBy: r.created_by || null,
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
router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.authUser;
    const p = getPool();

    const [rows] = await p.query<any[]>(`
      SELECT 
        o.*,
        COALESCE(
          (SELECT email FROM users u WHERE u.organization_id = o.id AND u.role = 'admin' LIMIT 1),
          o.email
        ) as adminEmail,
        (SELECT COUNT(*) FROM documents d WHERE d.organization_id = o.id) as documentsCount,
        (SELECT COUNT(*) FROM users u WHERE u.organization_id = o.id) as usersCount
      FROM organizations o
      WHERE o.id = ?
    `, [id]);

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Proyek tidak ditemukan.' });
      return;
    }

    const r = rows[0];

    // Access check: admin boleh akses semua project; user hanya project sendiri
    if (user && user.role !== 'admin') {
      const isOwnerOrMember = (r.created_by === user.id) || (r.admin_name === user.name) || (user.organizationId === r.id);
      if (!isOwnerOrMember) {
        res.status(403).json({ success: false, message: 'Anda tidak memiliki hak akses ke proyek ini.' });
        return;
      }
    }

    const org = {
      id: r.id,
      name: r.name,
      code: r.code,
      knowledgeBase: r.knowledge_base || ('kb_' + (r.code || 'utama').toLowerCase().replace(/[^a-z0-9_]/g, '_')),
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
      adminEmail: r.adminEmail || r.email || null,
      createdBy: r.created_by || null,
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
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      code,
      knowledgeBase,
      knowledge_base,
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
      res.status(400).json({ success: false, message: 'Nama, kode unik, dan tipe proyek wajib diisi.' });
      return;
    }

    const p = getPool();

    // Check code uniqueness
    const [existing] = await p.query<any[]>('SELECT id FROM organizations WHERE LOWER(code) = LOWER(?)', [code.trim()]);
    if (existing.length > 0) {
      res.status(400).json({ success: false, message: `Kode proyek "${code}" sudah digunakan. Gunakan kode lain.` });
      return;
    }

    // Generate or clean knowledge base code (selalu unik per project agar tidak tabrakan di RAG)
    const baseSlug = (code.trim() || name.trim() || 'prj')
      .toLowerCase()
      .replace(/^prj_/, '')
      .replace(/[^a-z0-9_]/g, '_')
      .slice(0, 18);
    const shortRandom = Math.random().toString(36).substring(2, 6);

    let finalKb = (knowledgeBase || knowledge_base || '').trim();
    if (!finalKb) {
      finalKb = `kb_${baseSlug}_${shortRandom}`;
    } else {
      finalKb = finalKb.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      if (!finalKb.startsWith('kb_')) {
        finalKb = `kb_${finalKb}`;
      }
    }

    const orgId = (req.body.id && typeof req.body.id === 'string' && req.body.id.startsWith('org-'))
      ? req.body.id
      : `org-${Date.now()}`;
    
    const effectiveCreatorId = req.authUser?.id || creatorId || null;
    const effectiveAdminName = adminName || req.authUser?.name || 'Owner Project';
    const effectiveEmail = email || req.authUser?.email || null;

    await p.query(`
      INSERT INTO organizations (id, name, code, knowledge_base, type, sector, province, city, address, phone, email, website, description, admin_name, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `, [
      orgId,
      name.trim(),
      code.trim().toUpperCase(),
      finalKb,
      type,
      sector || null,
      province || null,
      city || null,
      address || null,
      phone || null,
      effectiveEmail,
      website || null,
      description || null,
      effectiveAdminName,
      effectiveCreatorId
    ]);

    // Link creator to this organization
    if (effectiveCreatorId) {
      await p.query('UPDATE users SET organization_id = ? WHERE id = ?', [orgId, effectiveCreatorId]);
    }

    // Provision API key RAG khusus project ini (best-effort, non-blocking).
    // Key disimpan di DB & dipakai otomatis setiap upload dokumen project.
    ensureProjectRagKey(orgId, name.trim())
      .then(r => console.log(`[PROJECT RAG] Key project "${name.trim()}" (${orgId}) siap (sumber: ${r.source}).`))
      .catch(e => console.warn('[PROJECT RAG WARN] Provision key gagal:', e?.message || e));

    // Log activity
    await p.query(`
      INSERT INTO activity_logs (id, organization_id, organization_name, actor_name, actor_role, action, target, type)
      VALUES (?, ?, ?, ?, ?, 'Menambahkan Organisasi Baru', ?, 'organization')
    `, [
      `act-${Date.now()}`,
      orgId,
      name,
      effectiveAdminName,
      creatorRole || req.authUser?.role || 'user',
      name
    ]);

    const newOrg = {
      id: orgId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      knowledgeBase: finalKb,
      type,
      sector,
      province,
      city,
      address,
      phone,
      email: effectiveEmail,
      website,
      description,
      adminName: effectiveAdminName,
      createdBy: effectiveCreatorId,
      status: 'active',
      documentsCount: 0,
      usersCount: 1,
      chunksCount: 0,
      aiQueriesCount: 0,
      storageUsedMb: 0,
      createdAt: new Date().toISOString()
    };

    res.status(201).json({ success: true, message: 'Proyek berhasil dibuat!', organization: newOrg });
  } catch (err: any) {
    console.error('[CREATE ORG ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal membuat proyek baru.' });
  }
});

// 4. Update organization
router.put('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.authUser;
    const { name, code, type, sector, province, city, address, phone, email, adminEmail, website, description, adminName } = req.body;
    const targetEmail = adminEmail || email;

    const p = getPool();

    // Verify ownership
    const [existing] = await p.query<any[]>('SELECT id, created_by, admin_name FROM organizations WHERE id = ?', [id]);
    if (existing.length === 0) {
      res.status(404).json({ success: false, message: 'Proyek tidak ditemukan.' });
      return;
    }

    if (user && user.role !== 'admin') {
      const isOwner = (existing[0].created_by === user.id) || (existing[0].admin_name === user.name) || (user.organizationId === id);
      if (!isOwner) {
        res.status(403).json({ success: false, message: 'Anda tidak memiliki hak untuk mengubah proyek ini.' });
        return;
      }
    }

    const { knowledgeBase, knowledge_base } = req.body;
    const finalKb = knowledgeBase || knowledge_base || null;

    await p.query(`
      UPDATE organizations 
      SET name = COALESCE(?, name),
          code = COALESCE(?, code),
          knowledge_base = COALESCE(?, knowledge_base),
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
    `, [name, code, finalKb, type, sector, province, city, address, phone, targetEmail, website, description, adminName, id]);

    if (adminName || targetEmail) {
      await p.query(`
        UPDATE users 
        SET name = COALESCE(?, name),
             email = COALESCE(?, email)
        WHERE organization_id = ? AND role = 'admin'
      `, [adminName, targetEmail, id]);
    }

    res.json({ success: true, message: 'Data organisasi berhasil diperbarui.' });
  } catch (err: any) {
    console.error('[UPDATE ORG ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui organisasi.' });
  }
});

// 5. Delete organization
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.authUser;
    const p = getPool();

    const [rows] = await p.query<any[]>('SELECT name, knowledge_base, created_by, admin_name FROM organizations WHERE id = ?', [id]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Proyek tidak ditemukan.' });
      return;
    }

    // Verify ownership: admin (semua), project creator, atau project member
    if (user && user.role !== 'admin') {
      const isOwner = (rows[0].created_by === user.id) || (rows[0].admin_name === user.name) || (user.organizationId === id);
      if (!isOwner) {
        res.status(403).json({ success: false, message: 'Anda tidak memiliki wewenang untuk menghapus proyek ini.' });
        return;
      }
    }

    const orgName = rows[0].name;
    const targetKb = rows[0].knowledge_base;

    // 1. Ambil semua dokumen project untuk dibersihkan dari RAG dan CDN
    const [docs] = await p.query<any[]>('SELECT id, cdn_file_id FROM documents WHERE organization_id = ?', [id]);
    for (const doc of docs) {
      deleteDocumentFromRag(doc.id).catch(e => console.warn('[RAG DELETE DOC WARN]', e?.message || e));
      if (doc.cdn_file_id) {
        deleteFromKroomboxCDN(doc.cdn_file_id).catch(e => console.warn('[CDN DELETE WARN]', e?.message || e));
      }
    }

    // 2. Bersihkan sisa dokumen di RAG untuk KB ini (bila ada)
    if (targetKb) {
      fetch(`${process.env.RAG_BASE_URL || 'https://rag.aiones.app'}/api/v1/knowledge?knowledge_base_id=${encodeURIComponent(targetKb)}&limit=100`, {
        headers: { 'Authorization': `Bearer ${process.env.RAG_API_KEY || ''}` }
      })
      .then(r => r.json())
      .then(async (d: any) => {
        const ragDocs = d?.data?.documents || [];
        for (const rd of ragDocs) {
          if (rd?.document_id) {
            await deleteDocumentFromRag(rd.document_id);
          }
        }
      })
      .catch(e => console.warn('[RAG CLEANUP KB WARN]', e?.message || e));
    }

    // Reset organization_id in users
    await p.query('UPDATE users SET organization_id = NULL, org_join_status = "none" WHERE organization_id = ?', [id]);
    // Delete organization (documents and join requests will cascade)
    await p.query('DELETE FROM organizations WHERE id = ?', [id]);

    // Cabut API key RAG milik project (best-effort, non-blocking)
    revokeProjectRagKey(id).catch(e => console.warn('[PROJECT RAG WARN] Revoke key gagal:', e?.message || e));

    // Log activity
    await p.query(`
      INSERT INTO activity_logs (id, organization_id, organization_name, actor_name, actor_role, action, target, type)
      VALUES (?, NULL, NULL, 'Admin', 'admin', 'Menghapus Proyek', ?, 'organization')
    `, [`act-${Date.now()}`, orgName]);

    res.json({ success: true, message: `Proyek ${orgName} berhasil dihapus beserta memorinya di RAG.` });
  } catch (err: any) {
    console.error('[DELETE ORG ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus proyek.' });
  }
});

// 6. Toggle status
router.patch('/:id/toggle-status', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const p = getPool();

    const [rows] = await p.query<any[]>('SELECT status, name FROM organizations WHERE id = ?', [id]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Proyek tidak ditemukan.' });
      return;
    }

    const newStatus = rows[0].status === 'active' ? 'inactive' : 'active';
    await p.query('UPDATE organizations SET status = ? WHERE id = ?', [newStatus, id]);

    res.json({ success: true, status: newStatus, message: `Status proyek diubah menjadi ${newStatus}.` });
  } catch (err: any) {
    console.error('[TOGGLE STATUS ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal mengubah status proyek.' });
  }
});

export default router;
