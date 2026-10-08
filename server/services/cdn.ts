const CDN_BASE_URL = process.env.KROOMBOX_CDN_URL || 'https://api-cdn.kroombox.com';

/**
 * URL render LANGSUNG ke berkas di Kroombox Edge CDN (inline, langsung membuka/menampilkan
 * berkasnya). Dipakai untuk semua tautan ke pengguna supaya TIDAK dialihkan ke Google Drive.
 */
export function cdnViewUrl(fileId: string): string {
  return `${CDN_BASE_URL}/api/bridge/view/${encodeURIComponent(fileId)}`;
}
const CDN_API_KEY = process.env.KROOMBOX_API_KEY || 'kb_6365852fe432ce3a5b304b5bece7858cc3a558f5e5b84d0e';
const CDN_JWT_TOKEN = process.env.KROOMBOX_JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcm9qZWN0SWQiOiIyMWM0MDQwZS1jYzhkLTQ3ZjctOTZhNC1jZmExM2Q4ZWExZjkiLCJ1c2VySWQiOjgsImlhdCI6MTc5MDg0MzIzNSwiZXhwIjoxNzk4NjE5MjM1fQ.VtMHS1Z5yWrJr65DN7NU6JFZLHBG5_PNtYhlt6EO5_k';
const CDN_PROJECT_ID = process.env.KROOMBOX_PROJECT_ID || '21c4040e-cc8d-47f7-96a4-cfa13d8ea1f9';

export interface CdnUploadResult {
  fileId: string;
  url: string;
  viewUrl: string;
  status: string;
}

export interface CdnStatsResult {
  scope: string;
  projectId: string;
  assets: number;
  folders: number;
  storageBytes: number;
  bandwidthBytes: number;
  quotaBytes: number;
  generatedAt: string;
}

/**
 * Fetch Edge CDN real-time health and point-of-presence latency
 */
export async function getKroomboxCDNHealth(): Promise<any> {
  try {
    const res = await fetch(`${CDN_BASE_URL}/api/bridge/health`);
    if (res.ok) {
      return await res.json();
    }
    return { status: 'degraded', error: `HTTP ${res.status}` };
  } catch (err: any) {
    return { status: 'offline', error: err?.message };
  }
}

/**
 * Fetch Project CDN Live Stats (storage, bandwidth, quota)
 */
export async function getKroomboxCDNStats(): Promise<CdnStatsResult | null> {
  try {
    const res = await fetch(`${CDN_BASE_URL}/api/bridge/stats`, {
      headers: {
        'x-api-key': CDN_API_KEY,
        'Authorization': `Bearer ${CDN_JWT_TOKEN}`
      }
    });
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (err) {
    console.warn('[CDN STATS ERROR]', err);
    return null;
  }
}

/**
 * List files in project from Edge CDN
 */
export async function listKroomboxCDNFiles(params?: { search?: string; type?: string; limit?: number }): Promise<any[]> {
  try {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.type) query.set('type', params.type);
    if (params?.limit) query.set('limit', String(params.limit));

    const url = `${CDN_BASE_URL}/api/bridge/files${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetch(url, {
      headers: {
        'x-api-key': CDN_API_KEY,
        'Authorization': `Bearer ${CDN_JWT_TOKEN}`
      }
    });
    if (res.ok) {
      return await res.json();
    }
    return [];
  } catch (err) {
    console.warn('[CDN LIST FILES ERROR]', err);
    return [];
  }
}

/**
 * Create HMAC-SHA256 Signed delivery URL for private documents
 */
export async function createCDNSignedUrl(fileId: string, expiresIn: number = 3600): Promise<string | null> {
  try {
    const res = await fetch(`${CDN_BASE_URL}/api/bridge/sign/${fileId}`, {
      method: 'POST',
      headers: {
        'x-api-key': CDN_API_KEY,
        'Authorization': `Bearer ${CDN_JWT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ expiresIn })
    });
    if (res.ok) {
      const data: any = await res.json();
      const signedPath = data.signedUrl || data.url || null;
      if (!signedPath) return null;
      return signedPath.startsWith('http') ? signedPath : `${CDN_BASE_URL}${signedPath}`;
    }
    return null;
  } catch (err) {
    console.warn('[CDN SIGN URL ERROR]', err);
    return null;
  }
}

/**
 * Upload physical document file to Kroombox Edge CDN
 * Keeps MySQL lightweight without storing binary LONGBLOBs.
 */
export async function uploadToKroomboxCDN(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string = 'application/octet-stream'
): Promise<CdnUploadResult> {
  const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
  const form = new FormData();
  form.append('file', blob, fileName);
  form.append('fileName', fileName);
  form.append('mimeType', mimeType);
  form.append('projectId', CDN_PROJECT_ID);

  const uploadRes = await fetch(`${CDN_BASE_URL}/api/bridge/upload`, {
    method: 'POST',
    headers: {
      'x-api-key': CDN_API_KEY,
      'Authorization': `Bearer ${CDN_JWT_TOKEN}`
    },
    body: form
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`CDN Upload failed (${uploadRes.status}): ${errorText}`);
  }

  const uploadData: any = await uploadRes.json();
  const fileId = uploadData.fileId;
  if (!fileId) {
    throw new Error('CDN response did not return a fileId.');
  }

  // Selalu pakai URL render langsung dari CDN: respons upload bisa memuat tautan
  // Google Drive (drive.google.com/uc?...) yang tidak me-render berkas di browser.
  const deliveryUrl = cdnViewUrl(fileId);

  return {
    fileId,
    url: deliveryUrl,
    viewUrl: `${CDN_BASE_URL}/api/bridge/view/${fileId}`,
    status: 'ready'
  };
}

/**
 * Remove physical asset from Kroombox CDN when document is deleted
 */
export async function deleteFromKroomboxCDN(fileId: string): Promise<boolean> {
  if (!fileId) return true;
  try {
    const res = await fetch(`${CDN_BASE_URL}/api/bridge/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': CDN_API_KEY,
        'Authorization': `Bearer ${CDN_JWT_TOKEN}`
      }
    });
    return res.ok;
  } catch (err) {
    console.warn('[CDN DELETE WARN]', err);
    return false;
  }
}

/**
 * Unduh ISI ASLI berkas dari Kroombox Edge CDN (byte mentah).
 *
 * Dipakai untuk re-index ke RAG: tanpa ini, sinkronisasi hanya mengirim ringkasan
 * teks sehingga RAG menyimpan 1 chunk dangkal dan isi dokumen sebenarnya HILANG.
 * CDN sempat membalas "pending" (302 ke Google Drive) beberapa detik setelah unggah,
 * jadi percobaan diulang beberapa kali sebelum menyerah.
 */
export async function downloadFromKroomboxCDN(fileId: string, maxAttempts = 4): Promise<Buffer | null> {
  if (!fileId) return null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(cdnViewUrl(fileId), {
        headers: { 'x-api-key': CDN_API_KEY, 'Authorization': `Bearer ${CDN_JWT_TOKEN}` },
        redirect: 'follow'
      });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > 0) return buf;
        console.warn(`[CDN DOWNLOAD WARN] Berkas ${fileId} kosong (0 byte).`);
        return null;
      }
      // 404/202 = berkas belum siap di CDN, tunggu lalu coba lagi.
      console.warn(`[CDN DOWNLOAD WARN] HTTP ${res.status} untuk ${fileId} (percobaan ${attempt}/${maxAttempts}).`);
    } catch (err: any) {
      console.warn(`[CDN DOWNLOAD WARN] ${err?.message || err} (percobaan ${attempt}/${maxAttempts}).`);
    }
    if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 3000));
  }
  return null;
}
