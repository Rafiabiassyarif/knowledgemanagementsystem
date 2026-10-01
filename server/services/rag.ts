import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const RAG_BASE_URL = process.env.RAG_BASE_URL || 'https://ragjev.kii.lat';
// API key is loaded from .env only — never hardcode credentials in source code.
const RAG_API_KEY = process.env.RAG_API_KEY || '';

if (!RAG_API_KEY) {
  console.warn('[RAG SERVICE] RAG_API_KEY tidak ditemukan di .env — request ke RAG server akan ditolak.');
}

export interface IndexDocumentParams {
  documentId: string;
  organizationId: string;
  documentName: string;
  filePath?: string | null;
  contentBuffer?: Buffer | null;
  contentBase64?: string | null;
  text?: string | null;
  metadata?: Record<string, any>;
}

export interface QueryRagParams {
  query: string;
  organizationId?: string | null;
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
}

/**
 * Returns isolated knowledge base ID per organization to enforce multi-tenant boundaries.
 */
export function getKnowledgeBaseId(organizationId?: string | null): string {
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
    const kbId = getKnowledgeBaseId(params.organizationId);

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

    console.log(`[RAG SERVICE] Mengindeks dokumen "${docName}" (ID: ${params.documentId}) ke KB: ${kbId}`);

    const res = await fetch(`${RAG_BASE_URL}/api/v1/knowledge/index`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RAG_API_KEY}`,
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
export async function deleteDocumentFromRag(documentId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log(`[RAG SERVICE] Menghapus dokumen ID: ${documentId} dari RAG`);
    const res = await fetch(`${RAG_BASE_URL}/api/v1/knowledge/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${RAG_API_KEY}`
      }
    });

    const result = await res.json();
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

  // 4. Clean up repetitive awkward phrasing
  cleaned = cleaned.replace(/Halaman\s*lainnya\s*tidak ada (?:di\s*)?dalam dokumen/gi, 'Halaman lainnya tidak memuat rincian tersebut.');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');

  return cleaned.trim();
}

/**
 * Query RAG knowledge base strictly scoped to the tenant / organization
 */
export async function queryRag(params: QueryRagParams): Promise<RagQueryResult> {
  try {
    const kbId = getKnowledgeBaseId(params.organizationId);
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
