import { Router, Request, Response } from 'express';

export const swaggerRouter = Router();

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'KMS BUMD Multi-Tenant RAG API',
    version: '1.0.0',
    description: `
API Terbuka Knowledge Management System (KMS) BUMD bertenaga Multi-Tenant AI RAG.
Gunakan API ini untuk mengintegrasikan repositori dokumen, penelusuran semantik, dan chatbot AI RAG ke dalam aplikasi eksternal, bot Telegram/WhatsApp, sistem ERP, atau web portal lainnya.

### Cara Autentikasi (Pilih salah satu):
1. **Developer API Key (Direkomendasikan untuk integrasi cepat)**:
   - Header: \`X-API-Key: kms_dev_live_7x89q2k4m1n5p0\`
2. **JWT Session Token**:
   - Dapatkan token via endpoint \`POST /api/auth/login\`
   - Header: \`Authorization: Bearer <token_anda>\`
    `,
    contact: {
      name: 'Tim Developer KMS BUMD',
      email: 'developer@kms.local'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Backend Server Langsung (Port 5000)'
    },
    {
      url: 'http://localhost:3000',
      description: 'Vite Proxy Gateway (Port 3000)'
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'Developer API Key (Default: `kms_dev_live_7x89q2k4m1n5p0`)'
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JSON Web Token didapat setelah login via `/api/auth/login`'
      }
    },
    schemas: {
      ChatQueryRequest: {
        type: 'object',
        required: ['query'],
        properties: {
          query: {
            type: 'string',
            example: 'Apa saja poin penting dalam laporan tahunan 2025?',
            description: 'Pertanyaan pengguna yang akan dijawab oleh AI RAG berdasarkan dokumen organisasi.'
          },
          organizationId: {
            type: 'string',
            example: 'org-pam-jaya',
            description: 'ID Organisasi/BUMD tujuan (memastikan isolasi multi-tenant antar perusahaan).'
          },
          documentIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Opsional: batasi penelusuran hanya pada dokumen spesifik tertentu.'
          }
        }
      },
      ChatQueryResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          answer: { type: 'string', example: 'Poin utama meliputi transformasi digital dan efisiensi operasional...' },
          grounded: { type: 'boolean', example: true },
          sources: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                document_id: { type: 'string', example: 'doc-1790820818390' },
                document_name: { type: 'string', example: 'Laporan_Tahunan.pdf' },
                page: { type: 'integer', example: 12 },
                score: { type: 'number', example: 0.95 }
              }
            }
          },
          model: { type: 'string', example: 'space-bunny-free' }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'admin@bumd.go.id' },
          password: { type: 'string', example: 'password123' }
        }
      },
      DocumentItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'doc-1790820818390' },
          organizationId: { type: 'string', example: 'org-pam-jaya' },
          organizationName: { type: 'string', example: 'Perumda Air Minum Jaya (PAM JAYA)' },
          title: { type: 'string', example: 'Laporan Tahunan 2025' },
          category: { type: 'string', example: 'Laporan & Kinerja' },
          fileType: { type: 'string', example: 'PDF' },
          fileSizeKb: { type: 'integer', example: 1250 },
          fileUrl: { type: 'string', example: '/api/documents/doc-1790820818390/download' },
          year: { type: 'integer', example: 2025 }
        }
      }
    }
  },
  security: [
    { ApiKeyAuth: [] },
    { BearerAuth: [] }
  ],
  paths: {
    '/api/chat/query': {
      post: {
        summary: 'Tanya AI RAG Multi-Tenant',
        description: 'Mengajukan pertanyaan semantik yang akan dijawab langsung oleh AI berdasarkan dokumen resmi organisasi terkait.',
        tags: ['AI RAG Chat'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChatQueryRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Jawaban AI RAG berhasil didapatkan',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ChatQueryResponse' }
              }
            }
          },
          400: { description: 'Parameter pertanyaan (query) kosong' },
          401: { description: 'Akses ditolak (Header X-API-Key atau Bearer Token salah)' }
        }
      }
    },
    '/api/chat/status': {
      get: {
        summary: 'Cek Status Layanan RAG',
        description: 'Mengecek ketersediaan server RAG eksternal dan model AI yang aktif.',
        tags: ['AI RAG Chat'],
        responses: {
          200: { description: 'Layanan RAG siap dan terhubung' }
        }
      }
    },
    '/api/documents': {
      get: {
        summary: 'Ambil Daftar Repositori Dokumen',
        description: 'Mengambil daftar seluruh dokumen resmi, SOP, regulasi, dan laporan yang tersimpan dalam sistem KMS.',
        tags: ['Documents'],
        parameters: [
          {
            name: 'organizationId',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filter dokumen berdasarkan ID organisasi spesifik (misal: `org-pam-jaya`)'
          },
          {
            name: 'category',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filter berdasarkan kategori dokumen'
          },
          {
            name: 'search',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Kata kunci pencarian judul atau ringkasan dokumen'
          }
        ],
        responses: {
          200: {
            description: 'Daftar dokumen berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    documents: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/DocumentItem' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/documents/upload': {
      post: {
        summary: 'Unggah Dokumen Baru & Otomatis Terindeks ke RAG',
        description: 'Mengunggah berkas PDF, DOCX, XLSX, atau TXT ke repositori organisasi. Dokumen otomatis diindeks secara penuh ke RAG vector store.',
        tags: ['Documents'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['title', 'category', 'file'],
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Berkas fisik dokumen (PDF, Word, Excel, TXT max 50MB)'
                  },
                  title: { type: 'string', example: 'SOP Pelayanan Pelanggan 2026' },
                  category: { type: 'string', example: 'SOP & Prosedur Teknis' },
                  organizationId: { type: 'string', example: 'org-pam-jaya' },
                  year: { type: 'integer', example: 2026 },
                  notes: { type: 'string', example: 'Dokumen operasional standar divisi humas' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Dokumen berhasil diunggah dan dijadwalkan indeksasi RAG' },
          400: { description: 'Berkas atau field wajib belum diisi' }
        }
      }
    },
    '/api/documents/{id}/download': {
      get: {
        summary: 'Unduh Berkas Dokumen Fisik',
        description: 'Mengunduh berkas asli (binary stream) dokumen berdasarkan ID-nya.',
        tags: ['Documents'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: 'doc-1790820818390',
            description: 'ID unik dokumen'
          }
        ],
        responses: {
          200: {
            description: 'Streaming berkas binary dokumen (PDF/Word/Excel)',
            content: {
              'application/pdf': { schema: { type: 'string', format: 'binary' } },
              'application/octet-stream': { schema: { type: 'string', format: 'binary' } }
            }
          },
          404: { description: 'Dokumen tidak ditemukan' }
        }
      }
    },
    '/api/organizations': {
      get: {
        summary: 'Ambil Daftar Organisasi / BUMD',
        description: 'Mendapatkan daftar seluruh entitas organisasi/BUMD terdaftar beserta kode dan jumlah anggotanya.',
        tags: ['Organizations'],
        responses: {
          200: { description: 'Daftar organisasi berhasil diambil' }
        }
      }
    },
    '/api/auth/login': {
      post: {
        summary: 'Login User / Admin',
        description: 'Melakukan autentikasi menggunakan email dan password untuk mendapatkan JWT token sesi.',
        tags: ['Authentication'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: {
          200: { description: 'Login berhasil, token JWT dikembalikan' },
          401: { description: 'Email atau password salah' }
        }
      }
    },
    '/api/stats': {
      get: {
        summary: 'Statistik Sistem & RAG Metrics',
        description: 'Mendapatkan ringkasan jumlah dokumen, pengguna, dan performa query sistem.',
        tags: ['Analytics & Stats'],
        responses: {
          200: { description: 'Statistik berhasil didapatkan' }
        }
      }
    }
  }
};

// Route 1: Serve OpenAPI Spec JSON
swaggerRouter.get('/openapi.json', (_req: Request, res: Response) => {
  res.json(openApiSpec);
});

// Route 2: Serve Standalone Swagger UI HTML
swaggerRouter.get('/docs', (_req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Dokumentasi API KMS BUMD - Swagger UI</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%232563eb'><path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/></svg>" />
  <style>
    body {
      margin: 0;
      background: #0f172a;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .topbar {
      background: #1e293b !important;
      border-bottom: 1px solid #334155;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .topbar a {
      color: #38bdf8;
      text-decoration: none;
      font-weight: 700;
      font-size: 18px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .swagger-ui .topbar { display: none; }
    .custom-banner {
      background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
      color: #e2e8f0;
      padding: 24px 32px;
      border-bottom: 1px solid #1e293b;
    }
    .custom-banner h1 {
      margin: 0 0 8px 0;
      color: #60a5fa;
      font-size: 26px;
    }
    .custom-banner p {
      margin: 4px 0;
      color: #94a3b8;
      font-size: 14px;
    }
    .key-badge {
      display: inline-block;
      background: #0f172a;
      border: 1px solid #3b82f6;
      color: #93c5fd;
      padding: 6px 14px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 13px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="topbar">
    <a href="/api/docs">⚡ KMS BUMD Multi-Tenant AI API</a>
    <span style="font-size: 12px; color: #94a3b8;">OpenAPI 3.0 Standard</span>
  </div>
  <div class="custom-banner">
    <h1>Portal Developer & Dokumentasi API KMS</h1>
    <p>Gunakan API ini untuk menghubungkan bot, aplikasi web, mobile, atau script automasi Anda langsung dengan AI RAG KMS BUMD.</p>
    <div>
      <span class="key-badge">Default X-API-Key: <strong>kms_dev_live_7x89q2k4m1n5p0</strong></span>
    </div>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: "/api/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        docExpansion: "list",
        showRequestHeaders: true
      });
      window.ui = ui;
    };
  </script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});
