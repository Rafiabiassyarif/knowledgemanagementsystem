/**
 * Pengiriman email aplikasi (dipakai fitur lupa sandi).
 *
 * Memakai Gmail API lewat OAuth2 refresh token — tanpa paket tambahan.
 * Dianggap BELUM dikonfigurasi bila kredensialnya belum lengkap di .env,
 * sehingga pemanggil bisa memilih jalur alternatif (dicatat ke log/admin).
 */

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN || '';
const SENDER = process.env.GMAIL_SENDER || '';
const FROM_NAME = process.env.MAIL_FROM_NAME || 'KMS BUMD';

export function isMailConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN && SENDER);
}

/** Identity pengirim yang dipakai (untuk ditampilkan di UI/log). */
export function mailSender(): string {
  return SENDER;
}

async function getAccessToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
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

export async function sendMail(opts: { to: string; subject: string; html: string }): Promise<void> {
  const accessToken = await getAccessToken();
  const mime = [
    `From: ${FROM_NAME} <${SENDER}>`,
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
