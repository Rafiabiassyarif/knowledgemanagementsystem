import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const RAG_BASE_URL = process.env.RAG_BASE_URL || 'https://rag.aiones.app';
// API key is loaded from .env only — never hardcode credentials in source code.
const RAG_API_KEY = process.env.RAG_API_KEY || '';

if (!RAG_API_KEY) {
  console.warn('[RAG SERVICE] RAG_API_KEY tidak ditemukan di .env — request ke RAG server akan ditolak.');
}

/** Format berkas yang didukung parser RAG (dikonfirmasi via API, 415 selain ini) */
const RAG_SUPPORTED_EXTS = new Set([
  '.cfg', '.conf', '.csv', '.doc', '.docm', '.docx', '.eml', '.env', '.epub',
  '.htm', '.html', '.ini', '.json', '.jsonl', '.log', '.markdown', '.md',
  '.ndjson', '.odp', '.ods', '.odt', '.pdf', '.ppt', '.pptm', '.pptx', '.rst',
  '.rtf', '.sql', '.tex', '.tsv', '.txt', '.xhtml', '.xls', '.xlsm', '.xlsx',
  '.xml', '.yaml', '.yml'
]);

export interface IndexDocumentParams {
  documentId: string;
  organizationId: string;
  documentName: string;
  filePath?: string | null;
  contentBuffer?: Buffer | null;
  contentBase64?: string | null;
  text?: string | null;
  metadata?: Record<string, any>;
  /** API key khusus project (opsional) — dipakai bila tersedia, fallback ke master key. */
  apiKey?: string | null;
  /** Kode unik Knowledge Base (KB ID / namespace RAG) */
  knowledgeBaseId?: string | null;
}

export interface QueryRagParams {
  query: string;
  organizationId?: string | null;
  knowledgeBaseId?: string | null;
  documentIds?: string[];
  topK?: number;
  strictGrounding?: boolean;
}

export interface RagSource {
  document_id: string;
  document_name: string;
  chunk_id?: string;
  page?: number;
  section?: string;
  score?: number;
}

export interface RagQueryResult {
  success: boolean;
  answer: string;
  grounded: boolean;
  sources: RagSource[];
  usage?: any;
  model?: string;
  error?: string;
  attachments?: any[];
}

/**
 * Returns isolated knowledge base ID per organization to enforce multi-tenant boundaries.
 */
export function getKnowledgeBaseId(organizationId?: string | null): string {
  if (process.env.RAG_DEFAULT_KB && process.env.RAG_DEFAULT_KB.trim()) {
    return process.env.RAG_DEFAULT_KB.trim();
  }
  if (!organizationId || organizationId === 'all') {
    return 'bumd_global_kb';
  }
  const cleanId = String(organizationId).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `bumd_${cleanId}`;
}

/**
 * Ingest / Index document to RAG Jev service
 */
export async function indexDocumentToRag(params: IndexDocumentParams): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const kbId = params.knowledgeBaseId || getKnowledgeBaseId(params.organizationId);

    let contentBase64: string | null = params.contentBase64 || null;
    let textContent: string | null = params.text || null;

    if (!contentBase64 && params.contentBuffer) {
      contentBase64 = params.contentBuffer.toString('base64');
    } else if (!contentBase64 && params.filePath) {
      const fullPath = path.isAbsolute(params.filePath) ? params.filePath : path.resolve('.' + params.filePath);
      if (fs.existsSync(fullPath)) {
        const fileBuf = fs.readFileSync(fullPath);
        contentBase64 = fileBuf.toString('base64');
      }
    }

    // Ensure document_name has a valid file extension required by RAG parser
    let docName = params.documentName;
    const hasExtension = /\.[a-zA-Z0-9]{2,5}$/.test(docName);
    if (!hasExtension) {
      if (contentBase64) {
        docName = `${docName}.pdf`;
      } else {
        docName = `${docName}.txt`;
      }
    }

    // Format yang TIDAK didukung parser RAG (foto/gambar/biner/media):
    // RAG server menolak ekstensi gambar (.png, .jpg, dll.) dengan 415 Unsupported Media Type.
    // Kirim sebagai knowledge berbasis teks representasi kaya (.txt) berisi judul, kategori,
    // ringkasan, dan tautan langsung CDN Kroombox agar tetap masuk knowledge base,
    // dapat dicari oleh AI RAG, dan tautan CDN-nya dapat diberikan saat diminta.
    const docExt = docName.includes('.') ? docName.slice(docName.lastIndexOf('.')).toLowerCase() : '';
    const isImageOrUnsupported = !RAG_SUPPORTED_EXTS.has(docExt) ||
      ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg', '.tif', '.tiff', '.ico'].includes(docExt);

    if (isImageOrUnsupported) {
      const cdnUrl = params.metadata?.cdn_url || params.metadata?.file_url;
      const baseName = docName.includes('.') ? docName.slice(0, docName.lastIndexOf('.')) : docName;
      const cleanTitle = (params.metadata?.title || baseName).replace(/[-_]/g, ' ');
      const category = params.metadata?.category || 'Dokumentasi & Media';
      const year = params.metadata?.year || new Date().getFullYear();
      const extLabel = (docExt.replace('.', '') || 'GAMBAR').toUpperCase();

      const lines = [
        `# DOKUMEN MEDIA & FOTO RESMI ORGANISASI: ${cleanTitle}`,
        `- Kategori: ${category}`,
        `- Jenis Berkas: Foto / Media Visual (${extLabel})`,
        `- Tahun: ${year}`,
        cdnUrl ? `- Tautan CDN Langsung: ${cdnUrl}` : null,
        '',
        `PANDUAN RESPONS & RENDERING AI (WAJIB DIIKUTI):`,
        `Ketika pengguna meminta melihat foto, gambar, tangkapan layar (screenshot/screencapture), atau berkas ini:`,
        `1. TAMPILKAN FOTONYA SECARA LANGSUNG MENGGUNAKAN MARKDOWN IMAGE:`,
        cdnUrl ? `![${cleanTitle}](${cdnUrl})` : null,
        `2. WAJIB BERIKAN TAUTAN KLIK LANGSUNG (JANGAN gunakan backticks \`...\`, gunakan format link [teks](url) agar bisa diklik langsung oleh pengguna):`,
        cdnUrl ? `👉 [🔗 Klik di Sini untuk Membuka / Mengunduh Foto Langsung di CDN](${cdnUrl})` : null,
        '',
        `Keterangan & Rincian Berkas:`,
        `${textContent || params.metadata?.notes || params.metadata?.summary || 'Dokumentasi foto dan bukti visual resmi organisasi yang tersimpan aman di repositori digital.'}`,
        `Status Repositori: Berkas tersimpan resmi di Kroombox Edge CDN.`
      ].filter(Boolean);

      textContent = lines.join('\n');
      contentBase64 = null;
      docName = `${baseName}.txt`;
      console.log(`[RAG SERVICE] Format "${docExt}" (foto/media) dinormalisasi menjadi entri teks "${docName}" dengan instruksi render gambar markdown.`);
    }

    // If no file binary and no text, provide meaningful fallback metadata text
    if (!contentBase64 && !textContent) {
      textContent = `Dokumen: ${docName}\nOrganisasi: ${params.organizationId}\nKeterangan: ${JSON.stringify(params.metadata || {})}`;
    }

    const payload: any = {
      document_id: params.documentId,
      knowledge_base_id: kbId,
      document_name: docName,
      replace: true,
      metadata: {
        ...params.metadata,
        app_organization_id: params.organizationId,
        indexed_at: new Date().toISOString()
      }
    };

    if (contentBase64) {
      payload.content_base64 = contentBase64;
    } else if (textContent) {
      payload.text = textContent;
    }

    const bearerKey = params.apiKey || RAG_API_KEY;

    console.log(`[RAG SERVICE] Mengindeks dokumen "${docName}" (ID: ${params.documentId}) ke KB: ${kbId}`);

    const res = await fetch(`${RAG_BASE_URL}/api/v1/knowledge/index`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (!res.ok) {
      console.warn(`[RAG SERVICE WARN] Gagal mengindeks dokumen (${res.status}):`, result);
      return { success: false, error: result?.error?.message || 'Indexing gagal di RAG service' };
    }

    console.log(`[RAG SERVICE OK] Dokumen berhasil diterima oleh RAG worker (status: ${result?.data?.status || 'queued'})`);
    return { success: true, data: result?.data };
  } catch (err: any) {
    console.error('[RAG SERVICE ERROR] Terjadi kesalahan saat request ke RAG:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Delete document from RAG Jev service
 */
export async function deleteDocumentFromRag(documentId: string, apiKey?: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const bearerKey = apiKey || RAG_API_KEY;
    console.log(`[RAG SERVICE] Menghapus dokumen ID: ${documentId} dari RAG`);
    const res = await fetch(`${RAG_BASE_URL}/api/v1/knowledge/${encodeURIComponent(documentId)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${bearerKey}`
      }
    });

    const result = await res.json().catch(() => ({}));
    if (res.ok) {
      console.log(`[RAG SERVICE OK] Dokumen ID: ${documentId} berhasil dihapus dari RAG:`, result?.data || result);
      return { success: true, data: result?.data };
    }

    // If failed and an isolated apiKey was provided, fallback to master RAG_API_KEY
    if (apiKey && apiKey !== RAG_API_KEY) {
      console.log(`[RAG SERVICE] Mencoba kembali menghapus ID: ${documentId} dengan master key...`);
      const retryRes = await fetch(`${RAG_BASE_URL}/api/v1/knowledge/${encodeURIComponent(documentId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${RAG_API_KEY}`
        }
      });
      const retryResult = await retryRes.json().catch(() => ({}));
      if (retryRes.ok) {
        console.log(`[RAG SERVICE OK] Dokumen ID: ${documentId} berhasil dihapus dari RAG (via master key):`, retryResult?.data || retryResult);
        return { success: true, data: retryResult?.data };
      }
    }

    console.warn(`[RAG SERVICE WARN] Hapus dokumen ${documentId} dari RAG respon:`, result);
    return { success: res.ok, data: result?.data };
  } catch (err: any) {
    console.warn('[RAG SERVICE DELETE WARN]', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sanitizes technical jargon, internal LLM leakages (chunk identifiers, context references,
 * and foreign tokens like Chinese characters) from open-source RAG models into clean,
 * natural, professional Indonesian.
 */
export function cleanRagOutput(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. Translate known foreign token artifacts from multilingual LLM
  const tokenDict: Record<string, string> = {
    '其余': 'lainnya',
    '提交': 'menyampaikan',
    '多位': 'beragam',
    'وعة': '',
    'Diesel多位kan': 'Dioptimalkan',
    '多位kan': 'kan',
  };

  for (const [key, val] of Object.entries(tokenDict)) {
    cleaned = cleaned.split(key).join(val);
  }

  // Remove any remaining raw CJK/Arabic Unicode characters that leaked from the token dictionary
  cleaned = cleaned.replace(/[\u4e00-\u9fff\u0600-\u06ff]/g, '');

  // 2. Replace technical chunk terms with human readable document page references
  cleaned = cleaned.replace(/chunk\s*\d+\s*\(p?(\d+)\)/gi, 'Halaman $1');
  cleaned = cleaned.replace(/chunk\s*0*(\d+)/gi, 'Bagian $1');
  cleaned = cleaned.replace(/chunkOTHER/gi, 'bagian lainnya');
  cleaned = cleaned.replace(/\bchunk\b/gi, 'bagian dokumen');
  cleaned = cleaned.replace(/\bchunks\b/gi, 'bagian dokumen');

  // 3. Replace internal "di context" with "dalam dokumen"
  cleaned = cleaned.replace(/\b(?:di|pada)\s+context\b/gi, 'dalam dokumen');
  cleaned = cleaned.replace(/\bcontext\b/gi, 'dokumen');

  // 4. Clean up repetitive awkward phrasing and artificial media limitations
  cleaned = cleaned.replace(/Halaman\s*lainnya\s*tidak ada (?:di\s*)?dalam dokumen/gi, 'Halaman lainnya tidak memuat rincian tersebut.');
  cleaned = cleaned.replace(/Keterbatasan:\s*media tidak bisa dilampirkan langsung[^\n]*/gi, '');
  cleaned = cleaned.replace(/Isi gambarnya tidak descrito[^\n]*/gi, '');

  // 5. Transform any CDN URLs trapped in code backticks into direct, clickable markdown links
  cleaned = cleaned.replace(/`\s*(https:\/\/api-cdn\.kroombox\.com\/api\/bridge\/view\/[a-zA-Z0-9_-]+)\s*`/gi, '[$1]($1)');

  // 6. Ensure bare CDN links become clickable if not already formatted in markdown
  cleaned = cleaned.replace(/(?<!\]\(|\[|\"|\')https:\/\/api-cdn\.kroombox\.com\/api\/bridge\/view\/([a-zA-Z0-9_-]+)(?!\))/gi, '[👉 Buka Berkas Langsung di CDN](https://api-cdn.kroombox.com/api/bridge/view/$1)');

  cleaned = cleaned.replace(/\s{2,}/g, ' ');

  return cleaned.trim();
}

/**
 * Query RAG knowledge base strictly scoped to the tenant / organization
 */
export async function queryRag(params: QueryRagParams): Promise<RagQueryResult> {
  try {
    const kbId = params.knowledgeBaseId || getKnowledgeBaseId(params.organizationId);
    console.log(`[RAG QUERY] Query: "${params.query}" (Target KB: ${kbId})`);

    const requestBody: any = {
      query: params.query,
      knowledge_base_id: kbId,
      options: {
        top_k: params.topK || 10,
        strict_grounding: params.strictGrounding !== false,
        include_sources: true,
        use_hybrid: true
      }
    };

    if (params.documentIds && params.documentIds.length > 0) {
      requestBody.options.document_ids = params.documentIds;
    }

    const res = await fetch(`${RAG_BASE_URL}/api/v1/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RAG_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      const errorMsg = data?.error?.message || `Gagal query RAG (${res.status})`;
      console.warn('[RAG QUERY FAILED]', errorMsg);
      return {
        success: false,
        answer: 'Maaf, layanan RAG sedang tidak dapat memproses jawaban saat ini.',
        grounded: false,
        sources: [],
        error: errorMsg
      };
    }

    let answer = data.data?.answer || 'Tidak ada jawaban relevan yang ditemukan dalam dokumen organisasi.';
    if (answer.toLowerCase().includes('knowledge base yang tersedia') || answer.toLowerCase().includes('dalam knowledge base')) {
      answer = 'Informasi tersebut tidak ditemukan dalam dokumen resmi yang terindeks untuk organisasi ini.';
    }
    answer = cleanRagOutput(answer);

    const grounded = Boolean(data.data?.grounded);
    const sources = Array.isArray(data.data?.sources) ? data.data.sources : [];
    const usage = data.data?.usage;
    const model = data.data?.model;

    return {
      success: true,
      answer,
      grounded,
      sources,
      usage,
      model
    };
  } catch (err: any) {
    console.error('[RAG QUERY EXCEPTION]', err);
    return {
      success: false,
      answer: 'Terjadi kendala jaringan saat menghubungkan ke RAG Assistant.',
      grounded: false,
      sources: [],
      error: err.message
    };
  }
}
