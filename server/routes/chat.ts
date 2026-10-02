import { Router, Request, Response } from 'express';
import { queryRag } from '../services/rag';
import { getPool } from '../db';
import { listKroomboxCDNFiles, createCDNSignedUrl } from '../services/cdn';

const router = Router();

// Kroombox Edge CDN API Key
const CDN_API_KEY = process.env.KROOMBOX_API_KEY || 'kb_6365852fe432ce3a5b304b5bece7858cc3a558f5e5b84d0e';

function formatOutOfContextResponse(query: string, orgName: string, docCount: number): string {
  const qLower = query.toLowerCase().trim();

  // 1. Case: Greeting / Salutation / Introduction
  const greetings = ['halo', 'hai', 'hi', 'selamat pagi', 'selamat siang', 'selamat sore', 'selamat malam', 'assalamualaikum', 'salam', 'pagi', 'siang', 'sore', 'malam'];
  const isGreeting = greetings.some(g => qLower === g || qLower.startsWith(g + ' ') || qLower.startsWith(g + '!'));
  const isIntro = qLower.includes('siapa kamu') || qLower.includes('kamu siapa') || qLower.includes('bisa apa') || qLower.includes('fitur apa') || qLower.includes('bisa bantu apa');

  if (isGreeting || isIntro) {
    return `Halo! 👋 Selamat datang di asisten AI resmi **${orgName}**.\n\n` +
      `Saya adalah asisten cerdas berbasis Retrieval-Augmented Generation (RAG) yang siap membantu Anda menelusuri, menganalisis, dan merangkum seluruh **dokumen resmi, SOP, regulasi, dan laporan** di lingkungan **${orgName}**.\n\n` +
      `💡 **Contoh hal yang dapat Anda tanyakan:**\n` +
      `• *"Bagaimana alur prosedur pelaksanaan SOP ...?"*\n` +
      `• *"Apa saja syarat dan kriteria dalam regulasi ...?"*\n` +
      `• *"Rangkum poin utama capaian kinerja dan strategi tahun ini"*\n\n` +
      `Ada dokumen atau topik operasional yang ingin Anda pelajari saat ini?`;
  }

  // 2. Case: The organization currently has 0 documents published
  if (docCount === 0) {
    return `Halo! Terima kasih atas pertanyaannya. 😊\n\n` +
      `Saat ini repositori resmi untuk **${orgName}** belum memiliki arsip dokumen atau SOP yang dipublikasikan oleh Administrator organisasi.\n\n` +
      `📌 **Informasi:**\n` +
      `Silakan hubungi Administrator atau PIC organisasi Anda untuk mempublikasikan dokumen SOP atau regulasi terkait. Begitu dokumen tersedia di sistem, saya siap membantu menjawab dan merangkum seluruh informasinya untuk Anda! ✨`;
  }

  // 3. Case: Question is outside the company document scope or not found in archives
  return `Terima kasih atas pertanyaannya! 😊\n\n` +
    `Sebagai asisten AI resmi **${orgName}**, ruang lingkup pengetahuan saya difokuskan secara akurat pada **arsip dokumen resmi, SOP, pedoman teknis, dan regulasi internal** yang telah dipublikasikan di lingkungan organisasi ini.\n\n` +
    `📌 **Informasi Terkait Pertanyaan Anda:**\n` +
    `Topik *" ${query} "* saat ini **belum tercantum dalam arsip dokumen resmi** **${orgName}**.\n\n` +
    `💡 **Saran:**\n` +
    `1. Anda dapat menghubungi Administrator atau tim manajemen jika memerlukan penerbitan dokumen/SOP resmi mengenai topik ini.\n` +
    `2. Coba gunakan kata kunci atau istilah operasional lain yang berkaitan dengan dokumen resmi yang telah tersedia di lingkungan **${orgName}**.\n\n` +
    `Apakah ada dokumen atau SOP resmi lain yang ingin Anda cari tahu?`;
}

// 1. Check RAG Service Status
router.get('/status', async (_req: Request, res: Response): Promise<void> => {
  try {
    const RAG_BASE_URL = process.env.RAG_BASE_URL || 'https://rag.aiones.app';
    const checkRes = await fetch(`${RAG_BASE_URL}/api/v1/ready`);
    const data = await checkRes.json();
    res.json({
      success: true,
      service: 'Multi-Tenant RAG & Jev AI',
      status: data?.data?.status || 'unknown',
      details: data?.data?.dependencies || {}
    });
  } catch (err: any) {
    res.status(502).json({
      success: false,
      message: 'Tidak dapat menjangkau layanan RAG server.',
      error: err.message
    });
  }
});

/**
 * Bangun daftar attachment multi-dokumen (foto/file/dokumen) dengan signed CDN URL
 * untuk dirender langsung di bubble chat. Foto -> type 'image' (dirender <img>),
 * dokumen/file -> type 'document'/'file' (kartu unduhan).
 */
async function buildAttachments(docs: any[]): Promise<any[]> {
  const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
  const IMAGE_MIMES = ['image/'];

  return Promise.all(docs.map(async (d: any) => {
    let url: string | null = null;
    if (d.cdn_file_id) {
      try {
        url = await createCDNSignedUrl(d.cdn_file_id, 86400);
      } catch (signErr) {
        console.warn(`[CHAT ATTACH SIGN WARN ${d.cdn_file_id}]`, signErr);
      }
    }
    if (!url) {
      if (d.file_url && (d.file_url.startsWith('http://') || d.file_url.startsWith('https://'))) {
        url = d.file_url;
      } else {
        url = `/api/documents/${d.id}/download`;
      }
    }

    const ext = String(d.file_type || d.file_name || '').toLowerCase().split('.').pop() || '';
    const isImage = d.repository_type === 'photo'
      || IMAGE_EXTS.includes(ext)
      || IMAGE_MIMES.some(m => String(d.mime_type || '').startsWith(m));

    return {
      id: String(d.id || d.cdn_file_id || `att-${Math.random().toString(36).slice(2, 8)}`),
      title: d.title || d.file_name || 'Berkas',
      type: (isImage ? 'image' : (['pdf', 'doc', 'docx', 'xlsx', 'xls', 'txt', 'csv', 'md'].includes(ext) ? 'document' : 'file')) as 'image' | 'document' | 'file',
      fileType: String(d.file_type || ext || 'FILE').toUpperCase(),
      sizeKb: d.file_size_kb ? Number(d.file_size_kb) : undefined,
      url,
      downloadUrl: url
    };
  }));
}

interface FileRequestCheck {
  isRequest: boolean;
  type: 'photo' | 'document' | 'all';
  keywords: string[];
}

function analyzeFileRequest(query: string): FileRequestCheck {
  const q = query.toLowerCase().trim();

  // Exclude pure conceptual/definitional questions
  const isDefinitional = (
    q.startsWith('apa pengertian ') ||
    q.startsWith('apa arti ') ||
    q.startsWith('apa makna ') ||
    q.startsWith('apa definisi ') ||
    q.startsWith('jelaskan pengertian ') ||
    q.startsWith('jelaskan definisi ')
  );
  if (isDefinitional) {
    return { isRequest: false, type: 'all', keywords: [] };
  }

  const hasPhoto = /\b(foto|gambar|image|photo|dokumentasi|pic)\b/i.test(q) || q.includes('foto') || q.includes('gambar');
  const hasDoc = /\b(dokumen|document|sop|pedoman|laporan|sk|peraturan|kebijakan)\b/i.test(q) || q.includes('dokumen') || q.includes('pdf');
  const hasFile = /\b(file|berkas|arsip|lampiran|unduh|download|link)\b/i.test(q) || q.includes('file');

  const isFilePrompt = hasPhoto || hasDoc || hasFile;
  if (!isFilePrompt) {
    return { isRequest: false, type: 'all', keywords: [] };
  }

  const type: 'photo' | 'document' | 'all' = hasPhoto ? 'photo' : (hasDoc ? 'document' : 'all');

  const stopWords = new Set([
    'minta', 'tolong', 'bisa', 'dong', 'nya', 'dan', 'di', 'ke', 'yang', 'ini', 'itu',
    'file', 'dokumen', 'foto', 'gambar', 'link', 'unduh', 'download', 'rag', 'berkas',
    'lampiran', 'arsip', 'apa', 'saja', 'ada', 'mana', 'kirim', 'kirimkan', 'berikan',
    'tampilkan', 'buka', 'lihat', 'untuk', 'dari', 'pada', 'dengan', 'saya', 'kami',
    'kasih', 'bagikan', 'ambilkan', 'butuh', 'cari', 'carikan', 'adakah', 'apakah'
  ]);

  const rawWords = q.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 1);
  const keywords = rawWords.filter(w => !stopWords.has(w));

  return {
    isRequest: true,
    type,
    keywords
  };
}

async function handleFileRequest(
  p: any,
  query: string,
  reqInfo: FileRequestCheck,
  orgId: string | null,
  orgName: string
) {
  // 1. Fetch DB documents
  let sql = `
    SELECT d.id, d.organization_id, d.title, d.category, d.repository_type,
           d.file_type, d.file_size_kb, d.file_url, d.file_name, d.cdn_file_id,
           d.summary, d.tags, d.year, d.department, o.name as organization_name
    FROM documents d
    JOIN organizations o ON d.organization_id = o.id
  `;
  const params: any[] = [];
  if (orgId && orgId !== 'all') {
    sql += ` WHERE d.organization_id = ?`;
    params.push(orgId);
  }
  sql += ` ORDER BY d.created_at DESC`;

  let rows: any[] = [];
  try {
    const [resRows] = await p.query(sql, params);
    rows = resRows;
  } catch (err) {
    console.warn('[DB DOCS FOR CHAT ERROR]', err);
  }

  // 2. Fetch direct files from Kroombox Edge CDN using API Key
  try {
    const cdnFiles = await listKroomboxCDNFiles();
    if (Array.isArray(cdnFiles) && cdnFiles.length > 0) {
      for (const cf of cdnFiles) {
        const alreadyInDb = rows.some(
          r => r.cdn_file_id === cf.id || (r.file_name && r.file_name.toLowerCase() === cf.name.toLowerCase())
        );
        if (!alreadyInDb) {
          const isImg = (cf.mime_type || '').startsWith('image/') ||
            ['png', 'jpg', 'jpeg', 'webp'].some(ext => cf.name.toLowerCase().endsWith(ext));
          rows.push({
            id: `cdn-${cf.id}`,
            organization_id: orgId || 'all',
            organization_name: orgName,
            title: cf.name.replace(/\.[^/.]+$/, ""),
            category: isImg ? 'Galeri Dokumentasi' : 'Arsip Digital',
            repository_type: isImg ? 'photo' : 'document',
            file_type: cf.name.split('.').pop()?.toUpperCase() || (isImg ? 'JPG' : 'FILE'),
            file_size_kb: Math.round((cf.size || 1024) / 1024) || 1,
            file_url: cf.url,
            file_name: cf.name,
            cdn_file_id: cf.id,
            summary: `Berkas resmi tersimpan aman (${cf.name})`,
            department: 'Media & Aset Digital'
          });
        }
      }
    }
  } catch (cdnErr) {
    console.warn('[CHAT CDN LIST FETCH WARN]', cdnErr);
  }

  if (rows.length === 0) {
    return {
      success: true,
      answer: `Mohon maaf, saat ini repositori **${orgName}** belum memiliki berkas atau dokumen yang diunggah. Silakan hubungi Administrator untuk mempublikasikan berkas resmi yang Anda perlukan.`,
      grounded: false,
      model: 'Kroombox-Edge-CDN',
      sources: []
    };
  }

  // 3. Score documents according to request type and keywords
  const scored = rows.map((doc: any) => {
    let score = 0;
    const titleLower = (doc.title || '').toLowerCase();
    const sumLower = (doc.summary || '').toLowerCase();
    const catLower = (doc.category || '').toLowerCase();
    const fnLower = (doc.file_name || '').toLowerCase();
    const repoType = (doc.repository_type || 'document').toLowerCase();
    const fileType = (doc.file_type || '').toLowerCase();

    // Type filter bonus
    if (reqInfo.type === 'photo') {
      if (repoType === 'photo' || ['png', 'jpg', 'jpeg', 'webp', 'image'].includes(fileType)) {
        score += 15;
      }
    } else if (reqInfo.type === 'document') {
      if (repoType === 'document' || fileType === 'pdf' || fileType === 'docx' || fileType === 'txt') {
        score += 10;
      }
    } else {
      score += 5;
    }

    // Keyword matching
    if (reqInfo.keywords.length > 0) {
      for (const kw of reqInfo.keywords) {
        if (titleLower.includes(kw)) score += 20;
        if (fnLower.includes(kw)) score += 15;
        if (catLower.includes(kw)) score += 10;
        if (sumLower.includes(kw)) score += 5;
      }
    } else {
      score += 5;
    }

    return {
      ...doc,
      score
    };
  });

  // Filter matched items
  let matched = scored;
  if (reqInfo.keywords.length > 0) {
    matched = scored.filter((d: any) => d.score > 5).sort((a: any, b: any) => b.score - a.score);
  } else if (reqInfo.type === 'photo') {
    matched = scored.filter((d: any) => d.score >= 15).sort((a: any, b: any) => b.score - a.score);
  } else if (reqInfo.type === 'document') {
    matched = scored.filter((d: any) => d.score >= 10).sort((a: any, b: any) => b.score - a.score);
  } else {
    matched = scored.sort((a: any, b: any) => b.score - a.score);
  }

  const isFallback = matched.length === 0;
  const docsToShow = isFallback ? scored.slice(0, 3) : matched.slice(0, 4);

  // 4. Resolve direct signed CDN URLs using the Kroombox CDN API Key
  for (const doc of docsToShow) {
    if (doc.cdn_file_id) {
      try {
        const signed = await createCDNSignedUrl(doc.cdn_file_id, 86400);
        if (signed) {
          doc.cdnUrl = signed;
        }
      } catch (signErr) {
        console.warn(`[CDN SIGN WARN for ${doc.cdn_file_id}]`, signErr);
      }
    }

    if (!doc.cdnUrl) {
      if (doc.file_url && !doc.file_url.startsWith('db://')) {
        doc.cdnUrl = doc.file_url;
      } else {
        doc.cdnUrl = `/api/documents/${doc.id}/download`;
      }
    }
  }

  let answer = '';
  if (isFallback) {
    answer = `Berkas atau dokumen dengan kata kunci *" ${query} "* tidak ditemukan secara spesifik di repositori **${orgName}**.\n\n` +
      `📁 **Berikut berkas resmi yang tersedia:**\n\n`;
  } else {
    const typeLabel = reqInfo.type === 'photo' ? 'Foto / Media' : (reqInfo.type === 'document' ? 'Dokumen' : 'Berkas / File');
    answer = `Berikut adalah tautan berkas ${typeLabel.toLowerCase()} yang Anda minta dari **${orgName}**:\n\n`;
  }

  for (const d of docsToShow) {
    const isImg = d.repository_type === 'photo' || ['png', 'jpg', 'jpeg', 'webp'].includes((d.file_type || '').toLowerCase());
    const icon = isImg ? '🖼️' : '📄';
    const label = isImg ? 'Foto / Media' : 'Dokumen';

    answer += `${icon} **${d.title}**\n` +
      `• **Jenis**: ${label} (${(d.file_type || 'PDF').toUpperCase()} · ${d.file_size_kb || 0} KB)\n` +
      `• **Kategori**: ${d.category} · ${d.department || 'Umum'}\n` +
      `• **Penyimpanan**: Repositori Digital Resmi (Kroombox Edge CDN)\n` +
      (isImg && d.cdnUrl ? `![${d.title}](${d.cdnUrl})\n` : '') +
      `🔗 **Akses Berkas:**\n` +
      `[📥 Unduh / Buka ${label}](${d.cdnUrl})\n\n`;
  }

  answer += `💡 *Tautan di atas terhubung langsung ke berkas resmi organisasi.*`;

  // Lampiran terstruktur: foto dirender sebagai gambar, dokumen sebagai kartu unduhan
  const attachments = await buildAttachments(docsToShow);

  return {
    success: true,
    answer,
    grounded: true,
    model: 'KMS-RAG-AI',
    attachments,
    sources: docsToShow.map((d: any) => ({
      chunk_id: `cdn-${d.id}`,
      document_name: d.title,
      document_id: d.id,
      score: 1.0,
      page: 1,
      section: `${d.category} — Repositori Digital`
    }))
  };
}

// 2. Query Knowledge Base via RAG (Or Direct CDN Link for Document/File/Photo Requests)
router.post('/query', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, organizationId, documentIds } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      res.status(400).json({
        success: false,
        message: 'Parameter pertanyaan (query) wajib diisi.'
      });
      return;
    }

    const p = getPool();
    let orgName = 'Organisasi Anda';
    let docCount = 0;

    let targetKb: string | null = null;
    if (organizationId && organizationId !== 'all') {
      try {
        const [orgRows] = await p.query<any[]>('SELECT name, knowledge_base FROM organizations WHERE id = ?', [organizationId]);
        if (orgRows.length > 0) {
          orgName = orgRows[0].name;
          targetKb = orgRows[0].knowledge_base;
        }
        const [docRows] = await p.query<any[]>('SELECT COUNT(*) as cnt FROM documents WHERE organization_id = ?', [organizationId]);
        docCount = docRows[0]?.cnt || 0;
      } catch (dbErr) {
        console.warn('[CHAT ORG DB LOOKUP]', dbErr);
      }
    }

    // DIRECT CDN INTERCEPTION:
    // If user is requesting a Document, File, or Photo, give the direct CDN delivery link instead of RAG generating text!
    const fileReq = analyzeFileRequest(query.trim());
    if (fileReq.isRequest) {
      const fileResult = await handleFileRequest(p, query.trim(), fileReq, organizationId || null, orgName);
      res.json(fileResult);
      return;
    }

    // Call RAG service with isolated organizationId and Knowledge Base ID
    const result = await queryRag({
      query: query.trim(),
      organizationId: organizationId || null,
      knowledgeBaseId: targetKb || undefined,
      documentIds: Array.isArray(documentIds) ? documentIds : undefined,
      strictGrounding: true
    });

    // Check if the query is out-of-context or no candidate chunks found
    const isOutOfContext = !result.grounded || result.sources.length === 0 || 
      result.answer.includes('Informasi tersebut tidak ditemukan') ||
      result.answer.includes('tidak ditemukan dalam dokumen');

    if (isOutOfContext) {
      result.answer = formatOutOfContextResponse(query.trim(), orgName, docCount);
    }

    // Otomatis menyertakan lampiran CDN dan kartu dokumen dari sumber jawaban RAG
    if (result.success && result.sources && result.sources.length > 0) {
      const srcDocIds = result.sources.map(s => String(s.document_id || '')).filter(Boolean);
      if (srcDocIds.length > 0) {
        try {
          const [attRows] = await p.query<any[]>(
            `SELECT id, title, repository_type, file_type, file_size_kb, file_url, file_name, cdn_file_id
             FROM documents WHERE id IN (?)`,
            [srcDocIds]
          );
          if (attRows.length > 0) {
            result.attachments = await buildAttachments(attRows);
          }
        } catch (attErr) {
          console.warn('[CHAT ATTACHMENT FETCH WARN]', attErr);
        }
      }
    }

    res.json(result);
  } catch (err: any) {
    console.error('[CHAT ROUTE ERROR]', err);
    res.status(500).json({
      success: false,
      message: 'Gagal memproses pertanyaan chat AI.',
      error: err.message
    });
  }
});

export default router;
