import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Default password for seeded demo accounts (hash generated at startup)
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'password123';

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
      knowledge_base VARCHAR(100) NULL,
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

  // 3. Documents (file binary stored as LONGBLOB — no filesystem storage)
  await p.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id VARCHAR(64) PRIMARY KEY,
      organization_id VARCHAR(64) NOT NULL,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      file_type VARCHAR(20) NOT NULL,
      file_size_kb INT DEFAULT 0,
      file_url TEXT NULL,
      file_name VARCHAR(255) NULL,
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

  // Lightweight column migration for existing installations
  const [docCols] = await p.query<any[]>(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'documents'`,
    [DB_NAME]
  );
  const existingDocCols = new Set((docCols as any[]).map(c => c.COLUMN_NAME));
  // Cleanup: buang kolom biner warisan file_data — semua berkas fisik WAJIB di Kroombox CDN,
  // MySQL hanya menyimpan metadata. Kolom ini dijamin kosong sebelum dihapus.
  if (existingDocCols.has('file_data')) {
    const [binRows] = await p.query<any[]>('SELECT COUNT(*) AS cnt FROM documents WHERE file_data IS NOT NULL');
    if (binRows[0].cnt > 0) {
      console.warn(`[DB] Ditemukan ${binRows[0].cnt} dokumen dengan binary di DB — kolom file_data TIDAK dihapus. Migrasikan manual dulu.`);
    } else {
      await p.query('ALTER TABLE documents DROP COLUMN file_data');
      console.log('[DB] Kolom file_data (LONGBLOB) dihapus — berkas fisik khusus di CDN.');
    }
  }
  if (!existingDocCols.has('file_name')) {
    await p.query('ALTER TABLE documents ADD COLUMN file_name VARCHAR(255) NULL AFTER file_url');
    console.log('[DB] Kolom file_name ditambahkan ke tabel documents.');
  }
  if (!existingDocCols.has('repository_type')) {
    await p.query("ALTER TABLE documents ADD COLUMN repository_type VARCHAR(50) DEFAULT 'document' AFTER category");
    console.log('[DB] Kolom repository_type ditambahkan ke tabel documents.');
  }
  if (!existingDocCols.has('cdn_file_id')) {
    await p.query('ALTER TABLE documents ADD COLUMN cdn_file_id VARCHAR(100) NULL AFTER file_url');
    console.log('[DB] Kolom cdn_file_id ditambahkan ke tabel documents.');
  }
  if (!existingDocCols.has('uploader_role')) {
    await p.query("ALTER TABLE documents ADD COLUMN uploader_role VARCHAR(20) DEFAULT 'user' AFTER uploaded_by_id");
    console.log('[DB] Kolom uploader_role ditambahkan ke tabel documents.');
    try {
      await p.query("UPDATE documents SET uploader_role = 'admin' WHERE uploaded_by LIKE '%Admin%' OR uploaded_by_id IN (SELECT id FROM users WHERE role IN ('admin', 'superadmin'))");
      console.log('[DB] Dokumen admin yang sudah ada disesuaikan uploader_role = admin.');
    } catch (e) {
      console.warn('[DB] Gagal update role dokumen lama:', e);
    }
  }

  // Users quota & subscription plan migration
  const [userCols] = await p.query<any[]>(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
    [DB_NAME]
  );
  const existingUserCols = new Set((userCols as any[]).map(c => c.COLUMN_NAME));
  if (!existingUserCols.has('doc_quota')) {
    await p.query('ALTER TABLE users ADD COLUMN doc_quota INT DEFAULT 5 AFTER status');
    console.log('[DB] Kolom doc_quota ditambahkan ke tabel users.');
  }
  if (!existingUserCols.has('plan')) {
    await p.query("ALTER TABLE users ADD COLUMN plan VARCHAR(50) DEFAULT 'free' AFTER doc_quota");
    console.log('[DB] Kolom plan ditambahkan ke tabel users.');
  }

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
      organization_code VARCHAR(64) NULL,
      organization_name VARCHAR(255) NULL,
      user_id VARCHAR(64) NOT NULL,
      applicant_name VARCHAR(255) NOT NULL,
      applicant_email VARCHAR(255) NOT NULL,
      department VARCHAR(255) NULL,
      reason TEXT NULL,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_req_org FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Lightweight column migration for existing installations
  const [jrCols] = await p.query<any[]>(
    `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'join_requests' AND COLUMN_NAME = 'organization_code'`,
    [DB_NAME]
  );
  if (jrCols[0].cnt === 0) {
    await p.query(`ALTER TABLE join_requests 
      ADD COLUMN organization_code VARCHAR(64) NULL AFTER organization_id,
      ADD COLUMN organization_name VARCHAR(255) NULL AFTER organization_code,
      ADD COLUMN department VARCHAR(255) NULL AFTER applicant_email`);
  }
}

async function seedInitialData() {
  const p = getPool();

  // Find first active organization if available to bind users
  const [orgRows] = await p.query<any[]>('SELECT id FROM organizations LIMIT 1');
  const defaultOrgId = orgRows.length > 0 ? orgRows[0].id : null;

  // 1. Ensure Superadmin account always exists
  const [superadminRows] = await p.query<any[]>('SELECT id FROM users WHERE role = ? OR email = ?', ['superadmin', 'superadmin@kms.id']);
  const demoHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  if (superadminRows.length === 0) {
    console.log('[DB] Creating master Superadmin account (superadmin@kms.id)...');
    await p.query(
      `INSERT INTO users (id, name, email, password_hash, role, organization_id, status, avatar_initials, phone, org_join_status, plan, doc_quota)
       VALUES ('usr-superadmin', 'Dr. Hendra Gunawan', 'superadmin@kms.id', ?, 'superadmin', NULL, 'active', 'HG', '0811-9988-7766', 'joined', 'enterprise', 9999)`,
      [demoHash]
    );
  } else {
    await p.query('UPDATE users SET password_hash = ?, organization_id = NULL, status = "active" WHERE email = "superadmin@kms.id"', [demoHash]);
  }

  // 2. Ensure Admin Dummy account exists (admin@kms.id / password123)
  const [adminRows] = await p.query<any[]>('SELECT id FROM users WHERE email = ?', ['admin@kms.id']);
  if (adminRows.length === 0) {
    console.log('[DB] Creating dummy Admin account (admin@kms.id)...');
    await p.query(
      `INSERT INTO users (id, name, email, password_hash, role, organization_id, status, avatar_initials, phone, org_join_status, plan, doc_quota)
       VALUES ('usr-admin-demo', 'Administrator BUMD', 'admin@kms.id', ?, 'admin', ?, 'active', 'AD', '0812-3456-7890', 'joined', 'enterprise', 999)`,
      [demoHash, defaultOrgId]
    );
  } else {
    await p.query('UPDATE users SET password_hash = ?, role = "admin", status = "active", plan = "enterprise", doc_quota = 999 WHERE email = "admin@kms.id"', [demoHash]);
  }

  // 3. Ensure User Dummy account exists (user@kms.id / password123)
  const [userRows] = await p.query<any[]>('SELECT id FROM users WHERE email = ?', ['user@kms.id']);
  if (userRows.length === 0) {
    console.log('[DB] Creating dummy User account (user@kms.id)...');
    await p.query(
      `INSERT INTO users (id, name, email, password_hash, role, organization_id, status, avatar_initials, phone, org_join_status, plan, doc_quota)
       VALUES ('usr-user-demo', 'User Portal Demo', 'user@kms.id', ?, 'user', ?, 'active', 'UD', '0813-8877-6655', 'joined', 'free', 5)`,
      [demoHash, defaultOrgId]
    );
  } else {
    await p.query('UPDATE users SET password_hash = ?, role = "user", status = "active" WHERE email = "user@kms.id"', [demoHash]);
  }
}
