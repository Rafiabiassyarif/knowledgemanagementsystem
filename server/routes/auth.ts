import { Router, Request, Response } from 'express';
import { getPool } from '../db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { isMailConfigured, sendMail, resetPasswordEmail, resetPasswordOtpEmail, mailSender } from '../services/mailer';
import { generateToken, requireAuth, hashApiKey, generateApiKey } from '../middleware/auth';

const router = Router();

// 1. Regular User / Admin Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email dan kata sandi wajib diisi.' });
      return;
    }

    const p = getPool();
    const [rows] = await p.query<any[]>(
      `SELECT u.*, o.name as organization_name, o.code as organization_code 
       FROM users u 
       LEFT JOIN organizations o ON u.organization_id = o.id 
       WHERE LOWER(u.email) = LOWER(?)`,
      [email.trim()]
    );

    if (rows.length === 0) {
      res.status(401).json({ success: false, message: 'Email tidak ditemukan.' });
      return;
    }

    const user = rows[0];

    if (user.status !== 'active') {
      res.status(403).json({ success: false, message: 'Akun Anda tidak aktif. Hubungi admin organisasi.' });
      return;
    }

    // Password is now REQUIRED for every account (incl. seeded demo users)
    if (!user.password_hash) {
      res.status(401).json({ success: false, message: 'Akun ini belum memiliki kata sandi. Hubungi admin.' });
      return;
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      res.status(401).json({ success: false, message: 'Kata sandi tidak sesuai.' });
      return;
    }

    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id
    });

    const userRes = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id,
      organizationName: user.organization_name,
      organizationCode: user.organization_code,
      department: user.department,
      status: user.status,
      avatarInitials: user.avatar_initials || user.name.slice(0, 2).toUpperCase(),
      avatarUrl: user.avatar_url,
      phone: user.phone,
      employeeId: user.employee_id,
      orgJoinStatus: user.org_join_status,
      joinedAt: user.created_at
    };

    res.json({ success: true, token, user: userRes });
  } catch (err: any) {
    console.error('[AUTH ERROR]', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat login.' });
  }
});

// 2. Register New User
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, employeeId, orgCode } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Nama, email, dan kata sandi wajib diisi.' });
      return;
    }

    if (String(password).length < 6) {
      res.status(400).json({ success: false, message: 'Kata sandi minimal 6 karakter.' });
      return;
    }

    const p = getPool();

    const [existing] = await p.query<any[]>('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (existing.length > 0) {
      res.status(400).json({ success: false, message: 'Email sudah terdaftar. Silakan masuk menggunakan akun tersebut.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'US';
    const userId = `usr-${Date.now()}`;

    let orgId: string | null = null;
    let orgName: string | null = null;
    let orgStatus: 'joined' | 'pending' | 'none' = 'none';

    if (orgCode && orgCode.trim()) {
      const cleanCode = orgCode.trim().toLowerCase();
      const [orgs] = await p.query<any[]>(
        'SELECT id, name FROM organizations WHERE LOWER(code) = ? OR LOWER(id) = ?',
        [cleanCode, cleanCode]
      );
      if (orgs.length > 0) {
        orgId = orgs[0].id;
        orgName = orgs[0].name;
        orgStatus = 'joined';
      }
    }

    await p.query(
      `INSERT INTO users (id, name, email, password_hash, role, organization_id, status, avatar_initials, phone, employee_id, org_join_status)
       VALUES (?, ?, ?, ?, 'user', ?, 'active', ?, ?, ?, ?)`,
      [userId, name.trim(), email.trim().toLowerCase(), passwordHash, orgId, initials, phone || null, employeeId || null, orgStatus]
    );

    const token = generateToken({
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: 'user',
      organizationId: orgId
    });

    const newUser = {
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: 'user',
      organizationId: orgId,
      organizationName: orgName,
      status: 'active',
      avatarInitials: initials,
      phone,
      employeeId,
      orgJoinStatus: orgStatus,
      joinedAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil!',
      token,
      user: newUser,
      requiresOrgJoin: !orgId
    });
  } catch (err: any) {
    console.error('[REGISTER ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal melakukan pendaftaran akun.' });
  }
});

// 3. Update Profile (protected: hanya pemilik akun)
router.put('/profile/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (req.authUser!.id !== id) {
      res.status(403).json({ success: false, message: 'Anda hanya dapat mengubah profil sendiri.' });
      return;
    }

    const { name, email, phone, avatarUrl, department, employeeId } = req.body;

    const p = getPool();
    const initials = name ? name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : undefined;

    await p.query(
      `UPDATE users 
       SET name = COALESCE(?, name),
           email = COALESCE(?, email),
           phone = COALESCE(?, phone),
           avatar_url = COALESCE(?, avatar_url),
           avatar_initials = COALESCE(?, avatar_initials),
           department = COALESCE(?, department),
           employee_id = COALESCE(?, employee_id)
       WHERE id = ?`,
      [name, email, phone, avatarUrl, initials, department, employeeId, id]
    );

    const [rows] = await p.query<any[]>(
      `SELECT u.*, o.name as organization_name 
       FROM users u 
       LEFT JOIN organizations o ON u.organization_id = o.id 
       WHERE u.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
      return;
    }

    const u = rows[0];
    res.json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        organizationId: u.organization_id,
        organizationName: u.organization_name,
        avatarInitials: u.avatar_initials,
        avatarUrl: u.avatar_url,
        phone: u.phone,
        department: u.department,
        employeeId: u.employee_id,
        status: u.status
      }
    });
  } catch (err: any) {
    console.error('[PROFILE UPDATE ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui profil.' });
  }
});

// 4. Change Password (protected: hanya pemilik akun)
router.put('/change-password/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (req.authUser!.id !== id) {
      res.status(403).json({ success: false, message: 'Anda hanya dapat mengubah kata sandi sendiri.' });
      return;
    }

    const { oldPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }

    const p = getPool();
    const [rows] = await p.query<any[]>('SELECT password_hash FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      return;
    }

    const currentHash = rows[0].password_hash;
    if (currentHash) {
      if (!oldPassword) {
        res.status(400).json({ success: false, message: 'Kata sandi saat ini wajib diisi.' });
        return;
      }
      const match = await bcrypt.compare(oldPassword, currentHash);
      if (!match) {
        res.status(400).json({ success: false, message: 'Kata sandi saat ini tidak cocok.' });
        return;
      }
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await p.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, id]);

    res.json({ success: true, message: 'Kata sandi berhasil diperbarui.' });
  } catch (err: any) {
    console.error('[CHANGE PASSWORD ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal mengubah kata sandi.' });
  }
});

// ============================================================
// Lupa Sandi (nyata): token sekali pakai + email via Gmail API
// ============================================================
const RESET_TTL_MINUTES = 60;
const appBaseUrl = () => (process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');

function saveEnv(updates: Record<string, string>) {
  const envPath = path.resolve(process.cwd(), '.env');
  const lines = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8').split(/\r?\n/) : [];
  for (const [key, value] of Object.entries(updates)) {
    const idx = lines.findIndex((l) => l.startsWith(`${key}=`));
    if (idx >= 0) lines[idx] = `${key}=${value}`;
    else lines.push(`${key}=${value}`);
    process.env[key] = value;
  }
  fs.writeFileSync(envPath, lines.join('\n'));
}

// 1. Permintaan kode verifikasi pemulihan sandi (6-digit OTP dikirim ke email)
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) {
      res.status(400).json({ success: false, message: 'Alamat email wajib diisi.' });
      return;
    }

    const p = getPool();
    const [rows] = await p.query<any[]>('SELECT id, name, email, status FROM users WHERE LOWER(email) = ?', [email]);

    const user = rows[0];
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Alamat email ini belum terdaftar di sistem. Silakan periksa kembali email Anda atau daftar akun baru.'
      });
      return;
    }

    if (user.status === 'suspended' || user.status === 'inactive') {
      res.status(403).json({
        success: false,
        message: 'Akun Anda sedang dinonaktifkan. Silakan hubungi administrator.'
      });
      return;
    }

    // Generate kode OTP 6 digit angka
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);

    // Hapus kode lama yang belum terpakai untuk user ini
    await p.query('DELETE FROM password_resets WHERE user_id = ? AND used_at IS NULL', [user.id]);
    await p.query(
      'INSERT INTO password_resets (id, user_id, email, token, expires_at) VALUES (?, ?, ?, ?, ?)',
      [`pr-${Date.now()}`, user.id, user.email, otpCode, expiresAt]
    );

    let mailSent = false;
    let mailError = '';

    if (isMailConfigured()) {
      try {
        await sendMail({
          to: user.email,
          subject: `${otpCode} adalah Kode Verifikasi Pemulihan Kata Sandi Anda - KMS BUMD`,
          html: resetPasswordOtpEmail(otpCode, user.name, RESET_TTL_MINUTES)
        });
        mailSent = true;
        console.log(`[MAIL OK] Kode OTP ${otpCode} terkirim ke ${user.email}.`);
      } catch (mailErr: any) {
        mailError = mailErr?.message || String(mailErr);
        console.error('[MAIL ERROR]', mailError);
      }
    } else {
      console.warn(`[MAIL BELUM DIKONFIGURASI] Kode OTP untuk ${user.email}: ${otpCode}`);
      mailError = `Akun pengirim Gmail (${mailSender()}) belum dihubungkan via Google OAuth atau App Password.`;
    }

    res.json({
      success: true,
      message: mailSent
        ? `Kode verifikasi 6 digit telah berhasil dikirim ke email ${user.email}.`
        : `Email belum dapat dikirim: ${mailError || 'Layanan pengiriman email belum siap.'}`,
      mailSent,
      email: user.email,
      // Bila email berhasil dikirim, kode TIDAK dikembalikan ke client agar aman (harus dibaca dari email).
      code: !mailSent ? otpCode : undefined,
      mailError: mailError || undefined
    });
  } catch (err: any) {
    console.error('[FORGOT PASSWORD ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal memproses permintaan kode pemulihan.' });
  }
});

// 2. Verifikasi kode OTP 6 digit
router.post('/verify-reset-code', async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const code = String(req.body?.code || req.body?.token || '').trim();

    if (!code) {
      res.status(400).json({ success: false, message: 'Kode verifikasi wajib diisi.' });
      return;
    }

    const p = getPool();
    let query = 'SELECT id, user_id, email FROM password_resets WHERE token = ? AND used_at IS NULL AND expires_at > NOW()';
    const params: any[] = [code];

    if (email) {
      query += ' AND LOWER(email) = ?';
      params.push(email);
    }

    const [rows] = await p.query<any[]>(query, params);
    if (rows.length === 0) {
      res.status(400).json({ success: false, message: 'Kode verifikasi tidak valid atau telah kedaluwarsa.' });
      return;
    }

    res.json({ success: true, message: 'Kode verifikasi valid.', email: rows[0].email });
  } catch (err: any) {
    console.error('[VERIFY CODE ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal memverifikasi kode.' });
  }
});

// 3. Simpan kata sandi baru menggunakan kode OTP 6 digit
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const code = String(req.body?.code || req.body?.token || '').trim();
    const newPassword = String(req.body?.newPassword || '');

    if (!code) {
      res.status(400).json({ success: false, message: 'Kode verifikasi wajib diisi.' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'Kata sandi minimal 6 karakter.' });
      return;
    }

    const p = getPool();
    let query = 'SELECT id, user_id, email FROM password_resets WHERE token = ? AND used_at IS NULL AND expires_at > NOW()';
    const params: any[] = [code];

    if (email) {
      query += ' AND LOWER(email) = ?';
      params.push(email);
    }

    const [rows] = await p.query<any[]>(query, params);
    if (rows.length === 0) {
      res.status(400).json({ success: false, message: 'Kode verifikasi tidak valid atau telah kedaluwarsa.' });
      return;
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await p.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, rows[0].user_id]);
    await p.query('UPDATE password_resets SET used_at = NOW() WHERE id = ?', [rows[0].id]);
    console.log(`[RESET SANDI OTP OK] Kata sandi ${rows[0].user_id} (${rows[0].email}) berhasil diubah dengan OTP ${code}.`);

    res.json({ success: true, message: 'Kata sandi berhasil diubah! Silakan masuk dengan kata sandi baru Anda.' });
  } catch (err: any) {
    console.error('[RESET PASSWORD ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal mengubah kata sandi.' });
  }
});

// 3. Sambungkan akun Gmail pengirim / Login Google OAuth
// Bangun URL otorisasi Google (dipakai /google/connect & /google/login)
function googleAuthUrl(extra: Record<string, string>): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: `${appBaseUrl()}/api/auth/google/callback`,
    response_type: 'code',
    ...extra
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Hubungkan akun Google PENGIRIM email (butuh scope gmail.send) — untuk fitur lupa sandi.
router.get('/google/connect', (_req: Request, res: Response): void => {
  res.redirect(googleAuthUrl({
    scope: 'openid email profile https://www.googleapis.com/auth/gmail.send',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state: 'connect'
  }));
});

// Login / Daftar dengan Google.
// PENGAMAN: HANYA meminta identitas dasar (openid email profile) — TANPA gmail.send.
// Scope gmail.send tergolong "restricted" sehingga Google memblokir aplikasi yang belum
// diverifikasi (penyebab error "Access blocked"). Scope itu hanya perlu di alur /google/connect.
router.get('/google/login', (_req: Request, res: Response): void => {
  res.redirect(googleAuthUrl({
    scope: 'openid email profile',
    state: 'login'
  }));
});

router.get('/google/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const code = String(req.query.code || '');
    const oauthState = String(req.query.state || 'login');
    if (!code) {
      res.status(400).send('Kode otorisasi Google tidak ditemukan.');
      return;
    }
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${appBaseUrl()}/api/auth/google/callback`,
        grant_type: 'authorization_code'
      })
    });
    const data: any = await tokenRes.json();
    if (!tokenRes.ok || (!data.access_token && !data.refresh_token)) {
      console.error('[GOOGLE OAUTH ERROR]', data);
      res.status(400).send(`Gagal menukar kode: ${data.error_description || data.error || 'token tidak diterima'}`);
      return;
    }

    let userEmail = '';
    let userName = '';
    let userPicture = '';

    try {
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${data.access_token}` }
      });
      if (userinfoRes.ok) {
        const info: any = await userinfoRes.json();
        userEmail = info.email || '';
        userName = info.name || '';
        userPicture = info.picture || '';
      }
    } catch (e) {
      console.warn('[USERINFO FETCH WARN]', e);
    }

    if (!userEmail) {
      try {
        const profRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
          headers: { Authorization: `Bearer ${data.access_token}` }
        });
        const prof: any = await profRes.json();
        userEmail = prof?.emailAddress || '';
      } catch (e) {
        console.warn('[GMAIL PROFILE FETCH WARN]', e);
      }
    }

    // LOGIN wajib memakai email akun Google yang benar-benar dipakai login.
    // JANGAN fallback ke GMAIL_SENDER — itu bisa membuat orang masuk sebagai akun tersebut.
    if (!userEmail) {
      res.status(400).send('Tidak dapat membaca email dari akun Google Anda. Silakan coba lagi.');
      return;
    }
    const sender = userEmail;

    // Refresh token hanya disimpan pada alur HUBUNGKAN pengirim email (/google/connect),
    // bukan pada alur login.
    if (data.refresh_token && oauthState !== 'login') {
      saveEnv({
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
        GOOGLE_REFRESH_TOKEN: data.refresh_token,
        GMAIL_SENDER: sender
      });
      console.log(`[GOOGLE OAUTH OK] Refresh token tersimpan untuk pengirim: ${sender}`);
    }

    // Buat atau temukan user di database MySQL.
    // PENGAMAN: akun baru dari Google WAJIB berperan 'user'. Sebelumnya nilai ini
    // di-hardcode 'admin' sehingga siapa pun yang login Google langsung menjadi admin.
    const p = getPool();
    let [userRows] = await p.query<any[]>('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [sender]);
    let targetUser = userRows[0];
    if (!targetUser) {
      const newUserId = `usr-${Date.now()}`;
      const initials = (userName || sender).slice(0, 2).toUpperCase();
      await p.query(
        `INSERT INTO users (id, name, email, password_hash, role, status, avatar_initials, avatar_url, org_join_status)
         VALUES (?, ?, ?, NULL, 'user', 'active', ?, ?, 'none')`,
        [newUserId, userName || sender.split('@')[0], sender, initials, userPicture || null]
      );
      [userRows] = await p.query<any[]>('SELECT * FROM users WHERE id = ?', [newUserId]);
      targetUser = userRows[0];
      console.log(`[GOOGLE LOGIN] Akun baru dibuat (role=user): ${sender}`);
    }

    if (targetUser.status !== 'active') {
      res.status(403).send('Akun Anda tidak aktif. Hubungi admin platform.');
      return;
    }

    const redirectTarget = targetUser.role === 'admin' ? '/admin' : '/app';

    const appToken = generateToken({
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      organizationId: targetUser.organization_id
    });

    const userPayload = JSON.stringify({
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      organizationId: targetUser.organization_id,
      avatarUrl: targetUser.avatar_url || userPicture || null,
      avatarInitials: targetUser.avatar_initials || 'GZ',
      status: targetUser.status
    });

    res.send(`<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Login Google Berhasil</title>
  <script>
    localStorage.setItem('kms_auth_token', ${JSON.stringify(appToken)});
    localStorage.setItem('kms_current_user', ${JSON.stringify(userPayload)});
    setTimeout(function() {
      window.location.href = ${JSON.stringify(redirectTarget)};
    }, 1200);
  </script>
</head>
<body style="font-family:Segoe UI,Roboto,sans-serif;background:#0f172a;color:#f8fafc;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="background:#1e293b;padding:36px;border-radius:24px;box-shadow:0 20px 35px rgba(0,0,0,0.4);text-align:center;max-width:440px;border:1px solid #334155;">
    <div style="width:60px;height:60px;background:#10b98120;border:1px solid #10b98140;color:#10b981;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:28px;">✓</div>
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">Berhasil Masuk dengan Google</h2>
    <p style="color:#94a3b8;font-size:14px;margin:0 0 20px;line-height:1.6;">
      Akun <b>${sender}</b> aktif sebagai <b>${targetUser.role}</b>.
    </p>
    <a href="${redirectTarget}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:14px;">Lanjut →</a>
  </div>
</body>
</html>`);
  } catch (err: any) {
    console.error('[GOOGLE OAUTH ERROR]', err);
    res.status(500).send('Gagal menyambungkan akun Google: ' + (err?.message || err));
  }
});

// ---------------------------------------------------------------------------
// API KEY PER-PENGGUNA (akses API tanpa sandi, bisa dicabut satu per satu)
// ---------------------------------------------------------------------------

// Buat kunci API. Pengguna biasa untuk dirinya sendiri; admin boleh menyebut userId.
router.post('/api-keys', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const actor = req.authUser!;
    const { label, userId } = req.body || {};
    const targetId = (userId && actor.role === 'admin') ? String(userId) : actor.id;

    const p = getPool();
    const [urows] = await p.query<any[]>('SELECT id, name, email, role FROM users WHERE id = ?', [targetId]);
    if (urows.length === 0) {
      res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      return;
    }

    const raw = generateApiKey();
    const id = `key-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    await p.query(
      `INSERT INTO api_keys (id, user_id, label, key_hash, key_prefix) VALUES (?, ?, ?, ?, ?)`,
      [id, targetId, String(label || 'default').slice(0, 120), hashApiKey(raw), raw.slice(0, 14)]
    );

    res.status(201).json({
      success: true,
      message: 'Kunci API dibuat. Simpan sekarang — kunci ini hanya ditampilkan sekali.',
      apiKey: raw,
      key: { id, label: String(label || 'default'), prefix: raw.slice(0, 14), userId: targetId, user: urows[0] }
    });
  } catch (err: any) {
    console.error('[CREATE API KEY ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal membuat kunci API.' });
  }
});

// Daftar kunci milik sendiri (admin: seluruh kunci). Kunci mentah tidak pernah dikembalikan.
router.get('/api-keys', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const actor = req.authUser!;
    const p = getPool();
    const where = actor.role === 'admin' ? '' : 'WHERE user_id = ?';
    const params = actor.role === 'admin' ? [] : [actor.id];
    const [rows] = await p.query<any[]>(
      `SELECT id, user_id, label, key_prefix, last_used_at, revoked_at, created_at
         FROM api_keys
         ${where}
        ORDER BY created_at DESC`,
      params
    );

    // Ambil identitas pemilik kunci secara terpisah (hindari JOIN beda collation).
    const ids = [...new Set(rows.map(r => r.user_id))];
    const umap: Record<string, any> = {};
    if (ids.length > 0) {
      const [urows] = await p.query<any[]>(
        `SELECT id, name, email FROM users WHERE id IN (${ids.map(() => '?').join(',')})`,
        ids
      );
      for (const u of urows) umap[u.id] = u;
    }

    res.json({
      success: true,
      keys: rows.map(r => ({
        id: r.id, userId: r.user_id,
        userName: umap[r.user_id]?.name ?? null, userEmail: umap[r.user_id]?.email ?? null,
        label: r.label, prefix: r.key_prefix,
        lastUsedAt: r.last_used_at, revokedAt: r.revoked_at, createdAt: r.created_at,
        active: !r.revoked_at
      }))
    });
  } catch (err: any) {
    console.error('[LIST API KEYS ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal memuat daftar kunci API.' });
  }
});

// Cabut kunci API. Pemiliknya sendiri, atau admin.
router.delete('/api-keys/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const actor = req.authUser!;
    const p = getPool();
    const [rows] = await p.query<any[]>('SELECT id, user_id FROM api_keys WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Kunci API tidak ditemukan.' });
      return;
    }
    if (rows[0].user_id !== actor.id && actor.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Tidak berwenang mencabut kunci ini.' });
      return;
    }
    await p.query('UPDATE api_keys SET revoked_at = NOW() WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Kunci API dicabut. Kunci itu langsung tidak bisa dipakai lagi.' });
  } catch (err: any) {
    console.error('[REVOKE API KEY ERROR]', err);
    res.status(500).json({ success: false, message: 'Gagal mencabut kunci API.' });
  }
});

export default router;
