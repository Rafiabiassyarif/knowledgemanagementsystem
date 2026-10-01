import { Router, Request, Response } from 'express';
import { 
  getKroomboxCDNHealth, 
  getKroomboxCDNStats, 
  listKroomboxCDNFiles, 
  createCDNSignedUrl 
} from '../services/cdn';

const router = Router();

/**
 * GET /api/cdn/health
 * Returns Kroombox Edge status, latency, and point-of-presence regions
 */
router.get('/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    const health = await getKroomboxCDNHealth();
    res.json({ success: true, health });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Gagal mengecek CDN health.' });
  }
});

/**
 * GET /api/cdn/stats
 * Returns CDN storage bytes used, quota (100GB), bandwidth, and asset counts
 */
router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getKroomboxCDNStats();
    if (!stats) {
      res.status(502).json({ success: false, message: 'Gagal memuat stats CDN dari Kroombox.' });
      return;
    }
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Gagal mengambil stats CDN.' });
  }
});

/**
 * GET /api/cdn/files
 * List assets stored on the Edge CDN
 */
router.get('/files', async (req: Request, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string | undefined;
    const type = req.query.type as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 50;

    const files = await listKroomboxCDNFiles({ search, type, limit });
    res.json({ success: true, files });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Gagal mengambil daftar berkas CDN.' });
  }
});

/**
 * POST /api/cdn/sign/:id
 * Generate a time-boxed signed URL for private document delivery
 */
router.post('/sign/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const expiresIn = req.body.expiresIn ? Number(req.body.expiresIn) : 3600;
    const signedUrl = await createCDNSignedUrl(id, expiresIn);
    if (!signedUrl) {
      res.status(500).json({ success: false, message: 'Gagal membuat signed URL CDN.' });
      return;
    }
    res.json({ success: true, signedUrl, expiresIn });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Gagal membuat signed URL CDN.' });
  }
});

export default router;
