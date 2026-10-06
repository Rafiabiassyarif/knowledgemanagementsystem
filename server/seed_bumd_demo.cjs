const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');

async function seed() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'kms_bumd'
  });

  console.log('[SEED] Connected to MySQL kms_bumd.');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. 10 BUMD Projects definition
  const projects = [
    {
      id: 'org-prj-pamjaya',
      name: 'Perumda PAM Jaya',
      code: 'PRJ-PAMJAYA',
      knowledgeBase: 'kb_prj_pamjaya_demo',
      type: 'BUMD Air Minum',
      sector: 'Air Bersih & Sanitasi',
      province: 'DKI Jakarta',
      city: 'Jakarta Pusat',
      staffName: 'Rahmat Hidayat',
      staffEmail: 'bagian.keuangan@pamjaya.co.id'
    },
    {
      id: 'org-prj-bankdki',
      name: 'PT Bank DKI',
      code: 'PRJ-BANKDKI',
      knowledgeBase: 'kb_prj_bankdki_demo',
      type: 'BUMD Perbankan',
      sector: 'Jasa Keuangan & Perbankan',
      province: 'DKI Jakarta',
      city: 'Jakarta Pusat',
      staffName: 'Ayu Wulandari',
      staffEmail: 'bagian.kredit@bankdki.co.id'
    },
    {
      id: 'org-prj-bankjatim',
      name: 'PT Bank Jatim',
      code: 'PRJ-BANKJATIM',
      knowledgeBase: 'kb_prj_bankjatim_demo',
      type: 'BUMD Perbankan',
      sector: 'Jasa Keuangan & Perbankan',
      province: 'Jawa Timur',
      city: 'Surabaya',
      staffName: 'Bambang Wijaya',
      staffEmail: 'bagian.keuangan@bankjatim.co.id'
    },
    {
      id: 'org-prj-bprsleman',
      name: 'PT BPR Bank Sleman',
      code: 'PRJ-BPRSLEMAN',
      knowledgeBase: 'kb_prj_bprsleman_demo',
      type: 'BUMD Perbankan',
      sector: 'Jasa Keuangan & Perbankan',
      province: 'DI Yogyakarta',
      city: 'Sleman',
      staffName: 'Nur Aisyah',
      staffEmail: 'bagian.risiko@bprbanksleman.co.id'
    },
    {
      id: 'org-prj-pasarjaya',
      name: 'Perumda Pasar Jaya',
      code: 'PRJ-PASARJAYA',
      knowledgeBase: 'kb_prj_pasarjaya_demo',
      type: 'BUMD Pangan & Pasar',
      sector: 'Perdagangan & Pasar',
      province: 'DKI Jakarta',
      city: 'Jakarta Timur',
      staffName: 'Siti Rahayu',
      staffEmail: 'bagian.operasional@pasarjaya.co.id'
    },
    {
      id: 'org-prj-pasarsurya',
      name: 'PD Pasar Surya',
      code: 'PRJ-PASARSURYA',
      knowledgeBase: 'kb_prj_pasarsurya_demo',
      type: 'BUMD Pangan & Pasar',
      sector: 'Perdagangan & Pasar',
      province: 'Jawa Timur',
      city: 'Surabaya',
      staffName: 'Tri Hartono',
      staffEmail: 'bagian.umum@pasarsurya.co.id'
    },
    {
      id: 'org-prj-saranajaya',
      name: 'Perumda Pembangunan Sarana Jaya',
      code: 'PRJ-SARANAJAYA',
      knowledgeBase: 'kb_prj_saranajaya_demo',
      type: 'BUMD Energi & Infrastruktur',
      sector: 'Properti & Konstruksi',
      province: 'DKI Jakarta',
      city: 'Jakarta Pusat',
      staffName: 'Dimas Prasetyo',
      staffEmail: 'bagian.proyek@saranajaya.co.id'
    },
    {
      id: 'org-prj-tirtamoedal',
      name: 'Perumda Air Minum Tirta Moedal',
      code: 'PRJ-TIRTAMOEDAL',
      knowledgeBase: 'kb_prj_tirtamoedal_demo',
      type: 'BUMD Air Minum',
      sector: 'Air Bersih & Sanitasi',
      province: 'Jawa Tengah',
      city: 'Semarang',
      staffName: 'Agus Setiawan',
      staffEmail: 'bagian.distribusi@tirtamoedal.co.id'
    },
    {
      id: 'org-prj-tirtapakuan',
      name: 'Perumda Air Minum Tirta Pakuan',
      code: 'PRJ-TIRTAPAKUAN',
      knowledgeBase: 'kb_prj_tirtapakuan_demo',
      type: 'BUMD Air Minum',
      sector: 'Air Bersih & Sanitasi',
      province: 'Jawa Barat',
      city: 'Bogor',
      staffName: 'Hendra Gunawan',
      staffEmail: 'bagian.teknik@tirtapakuan.co.id'
    },
    {
      id: 'org-prj-tirtawening',
      name: 'Perumda Air Minum Tirtawening',
      code: 'PRJ-TIRTAWENING',
      knowledgeBase: 'kb_prj_tirtawening_demo',
      type: 'BUMD Air Minum',
      sector: 'Air Bersih & Sanitasi',
      province: 'Jawa Barat',
      city: 'Bandung',
      staffName: 'Ir. Husmi',
      staffEmail: 'husmi@tirtawening.co.id'
    }
  ];

  for (const prj of projects) {
    await conn.query(
      `INSERT INTO organizations (id, name, code, knowledge_base, type, sector, province, city, email, admin_name, created_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'usr-superadmin', 'active')
       ON DUPLICATE KEY UPDATE 
         name = VALUES(name), 
         knowledge_base = VALUES(knowledge_base),
         type = VALUES(type),
         sector = VALUES(sector),
         province = VALUES(province),
         city = VALUES(city),
         email = VALUES(email),
         admin_name = VALUES(admin_name)`,
      [
        prj.id,
        prj.name,
        prj.code,
        prj.knowledgeBase,
        prj.type,
        prj.sector,
        prj.province,
        prj.city,
        prj.staffEmail,
        prj.staffName
      ]
    );

    // Insert staff user
    const userId = 'usr-' + prj.code.toLowerCase().replace(/[^a-z0-9]/g, '');
    await conn.query(
      `INSERT INTO users (id, name, email, password_hash, role, organization_id, status, plan, doc_quota, org_join_status)
       VALUES (?, ?, ?, ?, 'user', ?, 'active', 'enterprise', 100, 'joined')
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         password_hash = VALUES(password_hash),
         organization_id = VALUES(organization_id),
         status = 'active'`,
      [
        userId,
        prj.staffName,
        prj.staffEmail,
        passwordHash,
        prj.id
      ]
    );
  }

  // 2. Point user@kms.id (dummy utama) to PRJ-PAMJAYA as requested
  await conn.query(
    `UPDATE users 
     SET organization_id = 'org-prj-pamjaya',
         status = 'active',
         password_hash = ?
     WHERE email = 'user@kms.id'`,
    [passwordHash]
  );

  // Link user@kms.id as creator / member to PRJ-PAMJAYA
  await conn.query(
    `UPDATE organizations 
     SET created_by = 'usr-user-demo'
     WHERE id = 'org-prj-pamjaya'`
  );

  console.log('[SEED] Seeded 10 BUMD projects and user@kms.id assigned to PRJ-PAMJAYA.');

  // 3. Read and parse daftar-url-cdn.txt
  const lines = fs.readFileSync('d:/Knowledge Management System/demo-data/daftar-url-cdn.txt', 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  let docCount = 0;
  for (const line of lines) {
    const [rawUrl, filename] = line.split('|').map(s => s.trim());
    const cdnFileId = rawUrl.split('/').pop();

    // Match project
    const prj = projects.find(p => filename.startsWith(p.code));
    if (!prj) continue;

    // Detect file type & repo type
    const isJpg = filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg');
    const fileType = isJpg ? 'JPG' : 'PDF';
    const repoType = isJpg ? 'photo' : 'document';

    // Generate clean human-readable title
    let title = filename
      .replace(new RegExp('^' + prj.code + '_[0-9]+_'), '')
      .replace(/\.(pdf|jpg|jpeg)$/i, '')
      .replace(/_/g, ' ');

    // Detect category
    let category = 'SOP & Prosedur';
    if (isJpg) {
      category = 'Kegiatan & Media';
    } else if (title.toLowerCase().includes('rkap') || title.toLowerCase().includes('rencana kerja')) {
      category = 'Perencanaan Strategis';
    } else if (title.toLowerCase().includes('laporan keuangan') || title.toLowerCase().includes('laporan tahunan')) {
      category = 'Laporan Keuangan';
    } else if (title.toLowerCase().includes('peraturan daerah') || title.toLowerCase().includes('kebijakan')) {
      category = 'Regulasi & Perda';
    }

    // Detect year
    let year = 2026;
    if (title.includes('2024')) year = 2024;
    else if (title.includes('2025')) year = 2025;
    else if (title.includes('2026')) year = 2026;

    const docId = 'doc-seed-' + cdnFileId;

    await conn.query(
      `INSERT INTO documents (
         id, organization_id, title, category, repository_type, file_type, file_size_kb,
         file_url, cdn_file_id, file_name, year, summary, tags, notes,
         uploaded_by, uploaded_by_id, uploader_role
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'user')
       ON DUPLICATE KEY UPDATE
         organization_id = VALUES(organization_id),
         title = VALUES(title),
         category = VALUES(category),
         repository_type = VALUES(repository_type),
         file_type = VALUES(file_type),
         file_url = VALUES(file_url),
         cdn_file_id = VALUES(cdn_file_id),
         year = VALUES(year),
         uploaded_by = VALUES(uploaded_by),
         uploader_role = 'user'`,
      [
        docId,
        prj.id,
        title,
        category,
        repoType,
        fileType,
        isJpg ? 380 : 1250,
        rawUrl,
        cdnFileId,
        filename,
        year,
        `Berkas resmi ${title} yang tersimpan aman di Kroombox Edge CDN untuk ${prj.name}.`,
        JSON.stringify(['resmi', category.toLowerCase(), repoType, fileType.toLowerCase(), 'kroombox-cdn']),
        `Diunggah resmi oleh staf ${prj.staffName}`,
        prj.staffName,
        'usr-' + prj.code.toLowerCase().replace(/[^a-z0-9]/g, '')
      ]
    );

    docCount++;
  }

  console.log(`[SEED] Successfully seeded ${docCount} documents into MySQL.`);
  await conn.end();
}

seed().catch(console.error);
