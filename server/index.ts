import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

import { swaggerRouter } from './docs/swagger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
// Public: auth endpoints (login, register, superadmin-login)
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

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` KMS BUMD Backend Server berjalan di http://localhost:${PORT}`);
      console.log(` Terhubung ke MySQL Database (Laragon 3306)`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('[FATAL ERROR] Gagal menyalakan backend server:', error);
    process.exit(1);
  }
}

startServer();
