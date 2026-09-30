import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'kms_bumd';

let pool: mysql.Pool;

export async function initDatabase() {
  // Step 1: Ensure database exists
  const tempConnection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
  });

  await tempConnection.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await tempConnection.end();

  // Step 2: Create connection pool with database
  pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    charset: 'utf8mb4'
  });

  // Step 3: Run table migrations
  await createTables();

  // Step 4: Seed initial data if tables are empty
  await seedInitialData();

  console.log(`[DB] MySQL database "${DB_NAME}" initialized successfully.`);
}

export function getPool(): mysql.Pool {
  if (!pool) {
    throw new Error('Database pool has not been initialized. Call initDatabase() first.');
  }
  return pool;
}

async function createTables() {
  const p = getPool();

  // 1. Organizations
  await p.query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(64) NOT NULL UNIQUE,
      type VARCHAR(100) NOT NULL,
      sector VARCHAR(255) NULL,
      province VARCHAR(100) NULL,
      city VARCHAR(100) NULL,
      address TEXT NULL,
      phone VARCHAR(50) NULL,
      email VARCHAR(100) NULL,
      website VARCHAR(255) NULL,
      description TEXT NULL,
      admin_name VARCHAR(255) NULL,
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 2. Users
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NULL,
      role ENUM('superadmin', 'admin', 'user') DEFAULT 'user',
      organization_id VARCHAR(64) NULL,
      department VARCHAR(255) NULL,
      status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
      avatar_url TEXT NULL,
      avatar_initials VARCHAR(10) NULL,
      phone VARCHAR(50) NULL,
      employee_id VARCHAR(50) NULL,
      position VARCHAR(100) NULL,
      org_join_status ENUM('joined', 'pending', 'none') DEFAULT 'none',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_user_org FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 3. Documents
  await p.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      file_type VARCHAR(20) NOT NULL,
      file_size_kb INT DEFAULT 0,
      file_url TEXT NULL,
      year INT DEFAULT 2024,
      department VARCHAR(255) NULL,
      summary TEXT NULL,
      tags JSON NULL,
      notes TEXT NULL,
      uploaded_by VARCHAR(255) NOT NULL,
      uploaded_by_id VARCHAR(64) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_doc_org FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 4. Activity Logs
  await p.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NULL,
      organization_name VARCHAR(255) NULL,
      actor_name VARCHAR(255) NOT NULL,
      actor_role VARCHAR(50) NOT NULL,
      action VARCHAR(255) NOT NULL,
      target VARCHAR(255) NULL,
      type ENUM('document', 'user', 'organization', 'ai', 'security') DEFAULT 'document',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // 5. Join Requests
  await p.query(`
    CREATE TABLE IF NOT EXISTS join_requests (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL,
      user_id VARCHAR(64) NOT NULL,
      applicant_name VARCHAR(255) NOT NULL,
      applicant_email VARCHAR(255) NOT NULL,
      reason TEXT NULL,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_req_org FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

async function seedInitialData() {
  const p = getPool();

  // Check if organizations exist
  const [orgRows] = await p.query<any[]>('SELECT COUNT(*) as cnt FROM organizations');
  if (orgRows[0].cnt === 0) {
    console.log('[DB] Seeding default organizations...');
    await p.query(`
      INSERT INTO organizations (id, name, code, type, sector, province, city, address, phone, email, website, description, admin_name, status)
      VALUES 
      ('org-pdam-bogor', 'Perumdam Tirta Kahuripan', 'TRT-KHR-01', 'BUMD Air Minum', 'Pengelolaan Air Minum Daerah', 'Jawa Barat', 'Kabupaten Bogor', 'Jl. Raya Tegar Beriman No. 1 Cibinong', '021-8752233', 'humas@tirtakahuripan.co.id', 'https://tirtakahuripan.co.id', 'BUMD pengelola penyediaan air minum perpipaan untuk masyarakat Kabupaten Bogor dengan cakupan 31 cabang pelayanan.', 'Andi Pratama', 'active'),
      ('org-bank-bjb', 'Bank BJB (BPD Jabar Banten)', 'BJB-CORP-02', 'BUMD Perbankan', 'Jasa Keuangan & Perbankan Daerah', 'Jawa Barat', 'Kota Bandung', 'Menara Bank BJB Jl. Naripan No. 12-14 Bandung', '022-4234868', 'corsec@bankbjb.co.id', 'https://bankbjb.co.id', 'BUMD sektor perbankan terdepan mitra pertumbuhan ekonomi daerah Jawa Barat dan Banten.', 'Rina Suryani', 'active'),
      ('org-pasar-jaya', 'Perumda Pasar Jaya', 'PSR-JYA-03', 'BUMD Pangan & Pasar', 'Pengelolaan Pasar Rakyat & Logistik', 'DKI Jakarta', 'Jakarta Pusat', 'Jl. Cikini Raya No. 90 Menteng Jakarta Pusat', '021-3141234', 'info@pasarjaya.co.id', 'https://pasarjaya.co.id', 'BUMD pangan dan pengelolaan 153 pasar tradisional serta pusat distribusi sembako rakyat di DKI Jakarta.', 'Bambang Irawan', 'active');
    `);
  }

  // Check if users exist
  const [userRows] = await p.query<any[]>('SELECT COUNT(*) as cnt FROM users');
  if (userRows[0].cnt === 0) {
    console.log('[DB] Seeding default users...');
    await p.query(`
      INSERT INTO users (id, name, email, role, organization_id, status, avatar_initials, phone, org_join_status)
      VALUES
      ('usr-superadmin', 'Dr. Hendra Gunawan', 'superadmin@kms.id', 'superadmin', NULL, 'active', 'HG', '0811-9988-7766', 'joined'),
      ('usr-andi-admin', 'Andi Pratama', 'admin@bumd.go.id', 'admin', 'org-pdam-bogor', 'active', 'AP', '0812-3456-7890', 'joined'),
      ('usr-rina-admin', 'Rina Suryani', 'admin.bjb@bumd.go.id', 'admin', 'org-bank-bjb', 'active', 'RS', '0813-2233-4455', 'joined'),
      ('usr-bambang-admin', 'Bambang Irawan', 'admin.pasarjaya@bumd.go.id', 'admin', 'org-pasar-jaya', 'active', 'BI', '0812-7788-9900', 'joined'),
      ('usr-budi-staff', 'Budi Santoso', 'budi@bumd.go.id', 'user', 'org-pdam-bogor', 'active', 'BS', '0857-1122-3344', 'joined'),
      ('usr-ratna-staff', 'Ratna Wulandari', 'ratna@bumd.go.id', 'user', 'org-pdam-bogor', 'active', 'RW', '0819-5566-7788', 'joined');
    `);
  }

  // Check if documents exist
  const [docRows] = await p.query<any[]>('SELECT COUNT(*) as cnt FROM documents');
  if (docRows[0].cnt === 0) {
    console.log('[DB] Seeding default documents...');
    await p.query(`
      INSERT INTO documents (id, organization_id, title, category, file_type, file_size_kb, year, department, summary, tags, notes, uploaded_by, uploaded_by_id)
      VALUES
      ('doc-pdam-01', 'org-pdam-bogor', 'SOP Tanggap Darurat Kebocoran Pipa Transmisi Utama', 'SOP & Prosedur', 'PDF', 3420, 2024, 'Distribusi & Pemeliharaan Jaringan', 'Standar operasional penanganan kebocoran pipa berdiameter >300mm dengan batas respon maksimal 60 menit.', '["kebocoran", "pipa", "tanggap-darurat", "sop"]', 'Dokumen pedoman teknis lapangan.', 'Andi Pratama', 'usr-andi-admin'),
      ('doc-pdam-02', 'org-pdam-bogor', 'Pedoman Pengujian Kualitas Air Bersih Permenkes 2/2023', 'Pedoman Teknis', 'PDF', 5120, 2023, 'Laboratorium & Kontrol Kualitas Air', 'Prosedur baku pengujian 19 parameter wajib kimia, mikrobiologi, dan fisika air minum perpipaan.', '["kualitas-air", "permenkes", "laboratorium", "parameter"]', 'Wajib dipatuhi seluruh cabang instalasi pengolahan air.', 'Andi Pratama', 'usr-andi-admin'),
      ('doc-bjb-01', 'org-bank-bjb', 'Pedoman Standar Penilaian Kelayakan Kredit UMKM BJB Mesra', 'Pedoman Teknis', 'PDF', 4200, 2024, 'Divisi Kredit Komersial & UMKM', 'Mekanisme penilaian scoring kelayakan kredit kelompok bjb Mesra tanpa jaminan bagi usaha ultra mikro binaan rumah ibadah.', '["kredit", "umkm", "bjb-mesra", "scoring"]', 'Pedoman rujukan analis kredit.', 'Rina Suryani', 'usr-rina-admin'),
      ('doc-pasar-01', 'org-pasar-jaya', 'Master Plan Revitalisasi Pasar Tradisional Menuju Pasar Sehat SNI', 'Master Plan & Renstra', 'PDF', 14200, 2024, 'Perencanaan Fasilitas Pasar', 'Peta jalan modernisasi 24 pasar tradisional menjadi pasar rakyat higienis berstandar SNI 8152:2021.', '["revitalisasi", "pasar-rakyat", "sni", "higienis"]', 'Rencana strategis 2024-2029.', 'Bambang Irawan', 'usr-bambang-admin');
    `);
  }

  // Check if activity logs exist
  const [logRows] = await p.query<any[]>('SELECT COUNT(*) as cnt FROM activity_logs');
  if (logRows[0].cnt === 0) {
    console.log('[DB] Seeding initial activity logs...');
    await p.query(`
      INSERT INTO activity_logs (id, organization_id, organization_name, actor_name, actor_role, action, target, type)
      VALUES
      ('act-init-1', 'org-pdam-bogor', 'Perumdam Tirta Kahuripan', 'Andi Pratama', 'admin', 'Upload Dokumen Baru', 'SOP Tanggap Darurat Kebocoran Pipa Transmisi Utama', 'document'),
      ('act-init-2', 'org-bank-bjb', 'Bank BJB', 'Rina Suryani', 'admin', 'Upload Dokumen Baru', 'Pedoman Standar Penilaian Kelayakan Kredit UMKM BJB Mesra', 'document'),
      ('act-init-3', NULL, 'KMS Global', 'Dr. Hendra Gunawan', 'superadmin', 'Inisialisasi Sistem KMS BUMD', 'Platform Production Ready', 'security');
    `);
  }
}
