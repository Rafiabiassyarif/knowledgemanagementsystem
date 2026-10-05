/**
 * Pengiriman email aplikasi (dipakai fitur lupa sandi).
 *
 * Mendukung dua metode:
 * 1. Gmail App Password (SMTP via nodemailer) — paling stabil & instan tanpa alur consent screen.
 * 2. Gmail API OAuth2 (refresh token) — memakai Google Client ID & Secret via REST API.
 */
import nodemailer from 'nodemailer';

const getClientId = () => process.env.GOOGLE_CLIENT_ID || '';
const getClientSecret = () => process.env.GOOGLE_CLIENT_SECRET || '';
const getRefreshToken = () => process.env.GOOGLE_REFRESH_TOKEN || '';
const getAppPassword = () => (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '').replace(/\s+/g, '');
const getSender = () => process.env.GMAIL_SENDER || 'gzzzefan@gmail.com';
const getFromName = () => process.env.MAIL_FROM_NAME || 'KMS BUMD';

export function isMailConfigured(): boolean {
  if (getAppPassword()) return true;
  return Boolean(getClientId() && getClientSecret() && getRefreshToken() && getSender());
}

/** Identity pengirim yang dipakai (untuk ditampilkan di UI/log). */
export function mailSender(): string {
  return getSender();
}

/** Metode pengiriman aktif: 'smtp' | 'oauth' | 'none' */
export function mailMethod(): 'smtp' | 'oauth' | 'none' {
  if (getAppPassword()) return 'smtp';
  if (getClientId() && getClientSecret() && getRefreshToken()) return 'oauth';
  return 'none';
}

async function getAccessToken(): Promise<string> {
  const clientId = getClientId();
  const clientSecret = getClientSecret();
  const refreshToken = getRefreshToken();

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Kredensial Gmail OAuth belum lengkap (client_id, client_secret, refresh_token).');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });
  const data: any = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Google menolak refresh token (${res.status}): ${data.error_description || data.error || 'tidak diketahui'}`);
  }
  return data.access_token as string;
}

function base64Url(input: string): string {
  return Buffer.from(input, 'utf-8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sendViaSmtp(opts: { to: string; subject: string; html: string }): Promise<void> {
  const user = getSender();
  const pass = getAppPassword();
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass }
  });
  await transporter.sendMail({
    from: `"${getFromName()}" <${user}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html
  });
}

async function sendViaOAuth(opts: { to: string; subject: string; html: string }): Promise<void> {
  const accessToken = await getAccessToken();
  const sender = getSender();
  const fromName = getFromName();
  const mime = [
    `From: ${fromName} <${sender}>`,
    `To: ${opts.to}`,
    `Subject: ${opts.subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    opts.html
  ].join('\r\n');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: base64Url(mime) })
  });
  if (!res.ok) {
    throw new Error(`Gmail API menolak pengiriman (${res.status}): ${(await res.text()).slice(0, 200)}`);
  }
}

export async function sendMail(opts: { to: string; subject: string; html: string }): Promise<void> {
  if (getAppPassword()) {
    return sendViaSmtp(opts);
  }
  if (getRefreshToken()) {
    return sendViaOAuth(opts);
  }
  throw new Error('Akun pengirim Gmail belum diotorisasi. Hubungkan Google OAuth atau set GMAIL_APP_PASSWORD di .env.');
}

export function resetPasswordOtpEmail(code: string, name: string, ttlMinutes: number): string {
  return `
  <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:540px;margin:0 auto;padding:32px 24px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;color:#0f172a">
    <div style="text-align:center;margin-bottom:24px">
      <div style="display:inline-block;padding:8px 18px;background:#eff6ff;border-radius:12px;color:#2563eb;font-weight:700;font-size:15px;letter-spacing:0.5px">
        KMS BUMD
      </div>
    </div>
    <h2 style="margin:0 0 10px;font-size:20px;font-weight:700;text-align:center;color:#0f172a">Kode Verifikasi Atur Ulang Sandi</h2>
    <p style="color:#475569;font-size:14px;line-height:1.6;text-align:center;margin:0 0 24px">
      Halo <b>${name || 'Pengguna'}</b>, masukkan kode verifikasi 6 digit berikut pada aplikasi untuk membuat kata sandi baru Anda:
    </p>
    <div style="background:#f8fafc;border:2px dashed #cbd5e1;border-radius:16px;padding:24px;text-align:center;margin:0 0 24px">
      <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#2563eb;font-family:monospace">
        ${code}
      </div>
      <p style="color:#64748b;font-size:12px;margin:12px 0 0">
        Kode berlaku selama <b>${ttlMinutes} menit</b>. Jangan berikan kode ini kepada siapa pun.
      </p>
    </div>
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0">
      Abaikan email ini bila Anda tidak merasa meminta pengaturan ulang kata sandi akun Anda.
    </p>
  </div>`;
}

export function resetPasswordEmail(link: string, name: string, ttlMinutes: number): string {
  return `
  <div style="font-family:Segoe UI,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a">
    <h2 style="margin:0 0 8px">Atur Ulang Kata Sandi</h2>
    <p style="color:#475569;font-size:14px;line-height:1.6">
      Halo ${name || 'Pengguna'}, kami menerima permintaan pengaturan ulang kata sandi untuk akun Anda.
      Tautan di bawah berlaku ${ttlMinutes} menit dan hanya bisa dipakai satu kali.
    </p>
    <p style="margin:24px 0">
      <a href="${link}" style="background:#2563eb;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:600;display:inline-block">
        Atur Ulang Kata Sandi
      </a>
    </p>
    <p style="color:#64748b;font-size:12px;line-height:1.6">
      Bila tombol tidak bekerja, salin tautan ini ke peramban:<br>
      <span style="word-break:break-all">${link}</span>
    </p>
    <p style="color:#94a3b8;font-size:12px">Abaikan email ini bila Anda tidak meminta pengaturan ulang sandi.</p>
  </div>`;
}
