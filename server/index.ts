import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { initDatabase } from './db';
import { requireAuth } from './middleware/auth';

import authRoutes from './routes/auth';
import organizationRoutes from './routes/organizations';
import userRoutes from './routes/users';
import documentRoutes from './routes/documents';
import activityRoutes from './routes/activities';
import joinRequestRoutes from './routes/joinRequests';
import statsRoutes from './routes/stats';
import adminRoutes from './routes/admin';
import cdnRoutes from './routes/cdn';
import chatRoutes from './routes/chat';

import { swaggerRouter } from './docs/swagger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
// Whitelist origin via CORS_ORIGINS (dipisah koma). Bila kosong, seluruh origin
// diterima seperti perilaku sebelumnya (memudahkan pengembangan lokal).
const corsOrigins = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({
  origin: corsOrigins.length > 0 ? corsOrigins : true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(uploadsDir));

// API Documentation & OpenAPI Spec (Public)
app.use('/api', swaggerRouter);
app.get('/docs', (_req: Request, res: Response) => res.redirect('/api/docs'));

// API Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'KMS BUMD Backend API',
    database: 'MySQL (Laragon)',
    timestamp: new Date().toISOString()
  });
});

// API Routes
// Pembatas percobaan masuk (in-memory, tanpa dependensi tambahan).
const LOGIN_MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS || 10);
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
function loginRateLimit(req: Request, res: Response, next: NextFunction): void {
  const key = `${req.ip}|${String((req.body as any)?.email || '').toLowerCase()}`;
  const now = Date.now();
  const rec = loginAttempts.get(key);
  if (!rec || rec.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    next();
    return;
  }
  if (rec.count >= LOGIN_MAX_ATTEMPTS) {
    res.status(429).json({ success: false, message: 'Terlalu banyak percobaan masuk. Silakan coba lagi beberapa menit kemudian.' });
    return;
  }
  rec.count += 1;
  next();
}
app.use('/api/auth/login', loginRateLimit);

  // Public: auth endpoints (login, register)
app.use('/api/auth', authRoutes);

// Projects / Organizations: GET endpoints are public, mutations are protected inside router
app.use('/api/organizations', organizationRoutes);
app.use('/api/projects', organizationRoutes);
app.use('/api/users', requireAuth, userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/activities', requireAuth, activityRoutes);
app.use('/api/join-requests', requireAuth, joinRequestRoutes);
app.use('/api/stats', requireAuth, statsRoutes);
app.use('/api/admin', requireAuth, adminRoutes);
app.use('/api/cdn', requireAuth, cdnRoutes);
// Chat RAG AI (query knowledge + render lampiran multi-dokumen CDN)
app.use('/api/chat', requireAuth, chatRoutes);

import { reconcileRagDeletions, handleRagDocumentDeletedWebhook } from './services/ragSync';

// Webhook publik untuk notifikasi saat dokumen dihapus di server RAG (https://rag.aiones.app/)
app.post('/api/webhooks/rag', async (req: Request, res: Response) => {
  try {
    const result = await handleRagDocumentDeletedWebhook(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memproses webhook RAG.', error: err.message });
  }
});
app.post('/api/rag/webhook', async (req: Request, res: Response) => {
  try {
    const result = await handleRagDocumentDeletedWebhook(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal memproses webhook RAG.', error: err.message });
  }
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[UNHANDLED SERVER ERROR]', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server backend.'
  });
});

// Initialize Database & Start Server
async function startServer() {
  try {
    console.log('[SERVER] Menghubungkan ke MySQL Laragon...');
    await initDatabase();
    console.log('[SERVER] Database MySQL siap & migrasi tabel selesai.');

    // Background auto-sync (interval 45 detik): HANYA MEMERIKSA (dry-run).
    // Penghapusan otomatis dimatikan karena pernah menghilangkan data produksi
    // (nama berkas di DB NULL -> dokumen dianggap terhapus di RAG).
    // Penghapusan kini hanya berjalan saat admin menekan tombol sinkronisasi manual.
    const RAG_SYNC_INTERVAL_MS = 45 * 1000;
    setInterval(async () => {
      try {
        await reconcileRagDeletions(undefined, true, false);
      } catch (syncErr) {
        console.warn('[RAG AUTO-SYNC BACKGROUND WARN]', syncErr);
      }
    }, RAG_SYNC_INTERVAL_MS);

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` KMS BUMD Backend Server berjalan di http://localhost:${PORT}`);
      console.log(` Terhubung ke MySQL Database (Laragon 3306)`);
      console.log(` Sinkronisasi otomatis dua arah dengan RAG & Kroombox CDN aktif.`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('[FATAL ERROR] Gagal menyalakan backend server:', error);
    process.exit(1);
  }
}

startServer();
