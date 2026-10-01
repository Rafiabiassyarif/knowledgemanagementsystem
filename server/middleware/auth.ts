import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { getPool } from '../db';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'kms-bumd-dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthUserPayload {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'user';
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

const DEV_API_KEY = process.env.KMS_DEV_API_KEY || 'kms_dev_live_7x89q2k4m1n5p0';

/**
 * RequireAuth middleware: verifies Bearer JWT token OR Developer X-API-Key and attaches authUser.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const apiKeyHeader = ((req.headers['x-api-key'] || req.headers['x-apikey'] || req.query.apiKey || req.query['api-key']) as string | undefined);
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (((req.query.token || req.query.auth_token) as string | undefined) || null);

  // 1. Direct Developer API Key authentication (via X-API-Key header or Bearer key)
  if (apiKeyHeader === DEV_API_KEY || (token && token === DEV_API_KEY)) {
    req.authUser = {
      id: 'usr-developer',
      name: 'Developer API Client',
      email: 'developer@kms.local',
      role: 'superadmin',
      organizationId: null
    };
    next();
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
