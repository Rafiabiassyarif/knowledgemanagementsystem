import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { getPool } from '../db';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'kms-bumd-dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthUserPayload {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  organizationId?: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authUser?: AuthUserPayload;
    }
  }
}

/**
 * Generate a signed JWT for an authenticated user.
 */
export function generateToken(user: AuthUserPayload): string {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId ?? null },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );
}

// PENGAMAN: kunci API pengembang TIDAK boleh punya nilai default di kode.
// Kunci default lama bocor di repo publik & dokumentasi /api/docs sehingga siapa pun
// bisa memperoleh akses admin tanpa login. Kini hanya dari .env; bila kosong -> nonaktif.
const DEV_API_KEY = (process.env.KMS_DEV_API_KEY || '').trim();

/** Hash kunci API (sha256 hex). Kunci mentah tidak pernah disimpan. */
export function hashApiKey(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/** Bentuk kunci API yang diterbitkan ke pengguna, mis. kms_ak_9f2c... */
export function generateApiKey(): string {
  return 'kms_ak_' + crypto.randomBytes(24).toString('hex');
}

/**
 * Cari pengguna dari API key per-pengguna, lalu catat pemakaian terakhirnya.
 * Mengembalikan null bila kunci tidak dikenal / sudah dicabut / akunnya non-aktif.
 */
async function userFromApiKey(raw: string): Promise<AuthUserPayload | null> {
  try {
    const p = getPool();
    // Dua langkah (tanpa JOIN): kolom varchar antar-tabel bisa beda collation -> JOIN galat.
    const [krows] = await p.query<any[]>(
      'SELECT id AS key_id, user_id FROM api_keys WHERE key_hash = ? AND revoked_at IS NULL LIMIT 1',
      [hashApiKey(raw)]
    );
    if (krows.length === 0) return null;
    const [urows] = await p.query<any[]>(
      'SELECT id, name, email, role, organization_id, status FROM users WHERE id = ? LIMIT 1',
      [krows[0].user_id]
    );
    if (urows.length === 0 || urows[0].status !== 'active') return null;
    const u = urows[0];
    p.query('UPDATE api_keys SET last_used_at = NOW() WHERE id = ?', [krows[0].key_id])
      .catch((e: any) => console.error('[API KEY TOUCH ERROR]', e?.message));
    return { id: u.id, name: u.name, email: u.email, role: u.role, organizationId: u.organization_id ?? null };
  } catch (e) {
    console.error('[API KEY LOOKUP ERROR]', e);
    return null;
  }
}

/**
 * RequireAuth middleware: verifies Bearer JWT token OR Developer X-API-Key and attaches authUser.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const apiKeyHeader = ((req.headers['x-api-key'] || req.headers['x-apikey'] || req.query.apiKey || req.query['api-key']) as string | undefined);
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (((req.query.token || req.query.auth_token) as string | undefined) || null);

  // 1. Direct Developer API Key authentication (kunci server, opsional)
  if (DEV_API_KEY && (apiKeyHeader === DEV_API_KEY || (token && token === DEV_API_KEY))) {
    req.authUser = {
      id: 'usr-developer',
      name: 'Developer API Client',
      email: 'developer@kms.local',
      role: 'admin',
      organizationId: null
    };
    next();
    return;
  }

  // 1b. API key per-pengguna: dari header X-API-Key, atau Bearer yang berawalan kms_ak_
  const candidateKey = (apiKeyHeader || (token && token.startsWith('kms_ak_') ? token : '') || '').trim();
  if (candidateKey) {
    const keyUser = await userFromApiKey(candidateKey);
    if (keyUser) {
      req.authUser = keyUser;
      next();
      return;
    }
    res.status(401).json({
      success: false,
      message: 'API key tidak valid, sudah dicabut, atau akunnya non-aktif.'
    });
    return;
  }

  // 2. JWT Bearer token authentication
  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Akses ditolak. Sertakan Authorization Bearer token atau header X-API-Key.'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;

    // Suspended / non-active accounts lose access immediately, even with a still-valid token.
    // Fail-open on DB hiccups so a transient database issue never locks everyone out of auth itself.
    try {
      const p = getPool();
      const [rows] = await p.query<any[]>('SELECT status FROM users WHERE id = ?', [decoded.id]);
      if (rows.length === 0 || rows[0].status !== 'active') {
        res.status(401).json({
          success: false,
          message: 'Akun Anda tidak aktif atau telah dinonaktifkan. Hubungi admin organisasi.'
        });
        return;
      }
    } catch (dbErr) {
      console.error('[AUTH STATUS CHECK ERROR]', dbErr);
    }

    req.authUser = decoded;
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: 'Sesi tidak valid atau telah kedaluwarsa. Silakan login ulang atau gunakan X-API-Key yang valid.'
    });
  }
}

/**
 * RequireRole middleware factory: restricts the endpoint to the given roles.
 */
export function requireRole(...roles: AuthUserPayload['role'][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      res.status(401).json({ success: false, message: 'Akses ditolak. Silakan login terlebih dahulu.' });
      return;
    }
    if (!roles.includes(req.authUser.role)) {
      res.status(403).json({ success: false, message: 'Akses ditolak. Hak akses tidak mencukupi.' });
      return;
    }
    next();
  };
}
