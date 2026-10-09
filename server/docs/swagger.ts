import { Router, Request, Response } from 'express';

export const swaggerRouter = Router();

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'KMS BUMD Multi-Tenant RAG & Knowledge Repository API',
    version: '2.0.0',
    description: `
API Terbuka Knowledge Management System (KMS) BUMD bertenaga Multi-Tenant AI RAG, Manajemen Berkas Cloud, dan Audit Logging.
Gunakan API ini untuk mengintegrasikan repositori dokumen & media, penelusuran semantik bertenaga AI, chatbot cerdas, pelacakan riwayat akses dokumen, dan tata kelola multi-project BUMD ke dalam aplikasi pihak ketiga (Web Portal, Mobile App, Bot Telegram/WhatsApp, Sistem ERP).

### Fitur Utama API:
1. **Multi-Tenant AI RAG**: Tanya jawab cerdas berbasis dokumen project bertenaga Llama 3 / Space Bunny Free dengan ground citation akurat.
2. **Repositori Berkas & Media**: Penyimpanan aman dokumen (PDF, Word, Excel, Teks) dan foto dokumentasi visual terhubung ke Edge CDN.
3. **Audit & Usage Logging (Baru)**: Pelacakan otomatis berapa kali dokumen dilihat, diunduh, dan digunakan oleh AI RAG.
4. **Multi-Project**: Isolasi data antar project atau divisi operasional.
5. **Autentikasi Ganda**: Mendukung Developer API Key (Header \`X-API-Key\`) dan JWT Session Token.

### Cara Autentikasi:
- **Developer API Key**:
  - Header: \`X-API-Key: kms_dev_live_7x89q2k4m1n5p0\`
- **JWT Session Token**:
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
      // 1. CHAT & RAG
      ChatQueryRequest: {
        type: 'object',
        required: ['query'],
        properties: {
          query: {
            type: 'string',
            example: 'Apa saja langkah operasional dalam SOP pelayanan pelanggan?',
            description: 'Pertanyaan pengguna yang akan dijawab oleh AI RAG berdasarkan dokumen project.'
          },
          organizationId: {
            type: 'string',
            example: 'org-pam-jaya',
            description: 'ID Project tujuan (memastikan isolasi multi-tenant antar project).'
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
          answer: { type: 'string', example: 'Langkah operasional meliputi registrasi tiket, verifikasi identitas pelanggan, dan eskalasi ke tim lapangan...' },
          grounded: { type: 'boolean', example: true },
          sources: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                document_id: { type: 'string', example: 'doc-1790820818390' },
                document_name: { type: 'string', example: 'SOP_Pelayanan_2026.pdf' },
                page: { type: 'integer', example: 4 },
                score: { type: 'number', example: 0.94 }
              }
            }
          },
          model: { type: 'string', example: 'space-bunny-free' }
        }
      },

      // 2. DOCUMENTS
      DocumentItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'doc-1790820818390' },
          organizationId: { type: 'string', example: 'org-pam-jaya' },
          organizationName: { type: 'string', example: 'Perumda Air Minum Jaya (PAM JAYA)' },
          title: { type: 'string', example: 'SOP Pelayanan Pelanggan 2026' },
          category: { type: 'string', example: 'SOP & Prosedur' },
          repositoryType: { type: 'string', enum: ['document', 'photo'], example: 'document' },
          fileType: { type: 'string', example: 'PDF' },
          fileSizeKb: { type: 'integer', example: 1250 },
          fileUrl: { type: 'string', example: '/api/documents/doc-1790820818390/download' },
          cdnFileId: { type: 'string', example: 'cdn-file-abc123xyz' },
          cdnUrl: { type: 'string', example: 'https://api-cdn.kroombox.com/api/bridge/view/cdn-file-abc123xyz' },
          year: { type: 'integer', example: 2026 },
          department: { type: 'string', example: 'Operasional' },
          summary: { type: 'string', example: 'Ringkasan panduan standar operasional pelayanan publik dan penanganan keluhan.' },
          tags: {
            type: 'array',
            items: { type: 'string' },
            example: ['sop', 'pelayanan', 'resmi']
          },
          chunksCount: { type: 'integer', example: 14 },
          viewCount: { type: 'integer', example: 28 },
          usageCount: { type: 'integer', example: 12 },
          lastAccessedAt: { type: 'string', format: 'date-time', example: '2026-10-09T07:30:00.000Z' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-10-01T10:00:00.000Z' }
        }
      },
      UpdateDocumentRequest: {
        type: 'object',
        properties: {
          title: { type: 'string', example: 'SOP Pelayanan Pelanggan Terkini 2026' },
          category: { type: 'string', example: 'SOP & Prosedur' },
          repositoryType: { type: 'string', enum: ['document', 'photo'], example: 'document' },
          year: { type: 'integer', example: 2026 },
          department: { type: 'string', example: 'Divisi Humas' },
          summary: { type: 'string', example: 'Pembaruan standar operasional penanganan keluhan.' },
          notes: { type: 'string', example: 'Dokumen telah disetujui oleh Direksi.' },
          tags: {
            type: 'array',
            items: { type: 'string' },
            example: ['sop', 'humas', 'layanan']
          }
        }
      },

      // 3. DOCUMENT LOGS
      DocumentLogItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'log-1791500000000' },
          documentId: { type: 'string', example: 'doc-1790820818390' },
          userId: { type: 'string', example: 'usr-1' },
          userName: { type: 'string', example: 'Ahmad Fadillah' },
          userEmail: { type: 'string', example: 'ahmad@pamjaya.co.id' },
          actionType: { type: 'string', enum: ['view', 'download', 'query', 'edit'], example: 'view' },
          notes: { type: 'string', example: 'Pratinjau berkas dibuka di penampil dokumen' },
          ipAddress: { type: 'string', example: '::1' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-10-09T07:25:00.000Z' }
        }
      },
      DocumentLogsResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          documentId: { type: 'string', example: 'doc-1790820818390' },
          documentTitle: { type: 'string', example: 'SOP Pelayanan Pelanggan 2026' },
          metrics: {
            type: 'object',
            properties: {
              viewCount: { type: 'integer', example: 28 },
              usageCount: { type: 'integer', example: 12 },
              lastAccessedAt: { type: 'string', format: 'date-time', example: '2026-10-09T07:30:00.000Z' }
            }
          },
          totalLogs: { type: 'integer', example: 40 },
          logs: {
            type: 'array',
            items: { $ref: '#/components/schemas/DocumentLogItem' }
          }
        }
      },
      LogAccessRequest: {
        type: 'object',
        required: ['actionType'],
        properties: {
          actionType: { type: 'string', enum: ['view', 'download', 'query', 'edit'], example: 'view' },
          notes: { type: 'string', example: 'Pengguna membuka pratinjau dokumen dari aplikasi mobile' }
        }
      },

      // 4. ORGANIZATIONS
      OrganizationItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'org-pam-jaya' },
          name: { type: 'string', example: 'Perumda Air Minum Jaya (PAM JAYA)' },
          code: { type: 'string', example: 'PAM-JAYA' },
          industry: { type: 'string', example: 'Utilitas & Air Bersih' },
          description: { type: 'string', example: 'Penyedia layanan utilitas air bersih terintegrasi di DKI Jakarta' },
          totalDocuments: { type: 'integer', example: 24 },
          totalMembers: { type: 'integer', example: 8 },
          storageUsedMb: { type: 'number', example: 45.2 },
          createdAt: { type: 'string', format: 'date-time', example: '2026-01-10T08:00:00.000Z' }
        }
      },
      CreateOrganizationRequest: {
        type: 'object',
        required: ['name', 'code', 'industry'],
        properties: {
          name: { type: 'string', example: 'PT MRT Jakarta (Perseroda)' },
          code: { type: 'string', example: 'MRT-JKT' },
          industry: { type: 'string', example: 'Transportasi Publik' },
          description: { type: 'string', example: 'Operator moda transportasi mass rapid transit perkotaan.' },
          ragApiKey: { type: 'string', example: 'aiones-custom-rag-key-123' }
        }
      },

      // 5. USERS & AUTH
      UserItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'usr-1' },
          name: { type: 'string', example: 'Budi Santoso' },
          email: { type: 'string', example: 'budi@pamjaya.co.id' },
          role: { type: 'string', enum: ['admin', 'user'], example: 'admin' },
          organizationId: { type: 'string', example: 'org-pam-jaya' },
          organizationName: { type: 'string', example: 'Perumda Air Minum Jaya (PAM JAYA)' },
          department: { type: 'string', example: 'Teknologi Informasi' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-01-15T09:00:00.000Z' }
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
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: { $ref: '#/components/schemas/UserItem' }
        }
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'Siti Rahma' },
          email: { type: 'string', example: 'siti@pamjaya.co.id' },
          password: { type: 'string', example: 'Rahasia123!' },
          organizationId: { type: 'string', example: 'org-pam-jaya' },
          department: { type: 'string', example: 'Keuangan' }
        }
      },

      // 6. ACTIVITIES & STATS
      ActivityItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'act-1' },
          userId: { type: 'string', example: 'usr-1' },
          userName: { type: 'string', example: 'Ahmad Fadillah' },
          userRole: { type: 'string', example: 'admin' },
          action: { type: 'string', example: 'UNGGAH_BERKAS' },
          details: { type: 'string', example: 'Mengunggah dokumen SOP Pelayanan Pelanggan 2026' },
          timestamp: { type: 'string', format: 'date-time', example: '2026-10-09T07:35:00.000Z' }
        }
      },
      DashboardStatsResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          stats: {
            type: 'object',
            properties: {
              totalDocuments: { type: 'integer', example: 45 },
              totalOrganizations: { type: 'integer', example: 4 },
              totalUsers: { type: 'integer', example: 18 },
              totalStorageMb: { type: 'number', example: 120.5 },
              totalViews: { type: 'integer', example: 340 },
              totalAiQueries: { type: 'integer', example: 128 },
              ragSyncStatus: { type: 'string', example: 'connected' }
            }
          }
        }
      }
    }
  },
  security: [
    { ApiKeyAuth: [] },
    { BearerAuth: [] }
  ],
  paths: {
    // ----------------------------------------------------
    // AI RAG CHAT
    // ----------------------------------------------------
    '/api/chat/query': {
      post: {
        summary: 'Tanya AI RAG Multi-Tenant (Dengan Ground Citations & Auto-Log)',
        description: 'Mengajukan pertanyaan semantik yang akan dijawab langsung oleh AI berdasarkan dokumen resmi project terkait. Penggunaan dokumen otomatis dicatat ke riwayat log dan metrik usage count.',
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
            description: 'Jawaban AI RAG berhasil didapatkan dengan rujukan sumber dokumen',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ChatQueryResponse' }
              }
            }
          },
          400: { description: 'Parameter pertanyaan (query) kosong' },
          401: { description: 'Akses ditolak (Header X-API-Key atau Bearer Token tidak valid)' }
        }
      }
    },
    '/api/chat/status': {
      get: {
        summary: 'Cek Status Layanan AI RAG',
        description: 'Mengecek ketersediaan server RAG eksternal (Space Bunny / Llama 3) dan status koneksi API key.',
        tags: ['AI RAG Chat'],
        responses: {
          200: { description: 'Layanan RAG siap dan terhubung' }
        }
      }
    },

    // ----------------------------------------------------
    // DOCUMENTS & REPOSITORIES
    // ----------------------------------------------------
    '/api/documents': {
      get: {
        summary: 'Ambil Daftar Repositori Berkas & Media',
        description: 'Mengambil daftar dokumen dan foto yang tersimpan dalam sistem KMS dengan dukungan filter project, kategori, dan tipe repositori.',
        tags: ['Documents & Repositories'],
        parameters: [
          {
            name: 'organizationId',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filter dokumen berdasarkan ID project spesifik (misal: `org-pam-jaya`)'
          },
          {
            name: 'category',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filter berdasarkan kategori dokumen'
          },
          {
            name: 'repositoryType',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['document', 'photo'] },
            description: 'Filter tipe repositori: `document` untuk berkas teks/PDF/Excel atau `photo` untuk dokumentasi visual'
          },
          {
            name: 'search',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Kata kunci pencarian judul, ringkasan, atau tag'
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
        summary: 'Unggah Berkas Baru & Otomatis Terindeks ke RAG & Edge CDN',
        description: 'Mengunggah berkas PDF, DOCX, XLSX, TXT, atau Foto/Gambar (JPG, PNG, WebP) ke repositori project. Berkas otomatis diunggah ke Kroombox Edge CDN dan diindeks penuh ke RAG vector store.',
        tags: ['Documents & Repositories'],
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
                    description: 'Berkas fisik dokumen atau foto (PDF, Word, Excel, Gambar, max 50MB)'
                  },
                  title: { type: 'string', example: 'SOP Pelayanan Pelanggan 2026' },
                  category: { type: 'string', example: 'SOP & Prosedur' },
                  repositoryType: { type: 'string', enum: ['document', 'photo'], default: 'document' },
                  organizationId: { type: 'string', example: 'org-pam-jaya' },
                  year: { type: 'integer', example: 2026 },
                  department: { type: 'string', example: 'Operasional' },
                  notes: { type: 'string', example: 'Dokumen operasional resmi' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Dokumen berhasil diunggah, tersimpan di CDN, dan terindeks RAG' },
          400: { description: 'Berkas atau field wajib belum diisi' }
        }
      }
    },
    '/api/documents/{id}': {
      get: {
        summary: 'Ambil Detail Dokumen Lengkap',
        description: 'Mendapatkan informasi detail dokumen, status CDN, dan metrik akses berdasarkan ID dokumen.',
        tags: ['Documents & Repositories'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID unik berkas dokumen'
          }
        ],
        responses: {
          200: {
            description: 'Detail dokumen ditemukan',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    document: { $ref: '#/components/schemas/DocumentItem' }
                  }
                }
              }
            }
          },
          404: { description: 'Dokumen tidak ditemukan' }
        }
      },
      put: {
        summary: 'Perbarui Metadata Dokumen',
        description: 'Memperbarui judul, kategori, tipe repositori, ringkasan, catatan, dan tag dokumen.',
        tags: ['Documents & Repositories'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID unik berkas dokumen'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateDocumentRequest' }
            }
          }
        },
        responses: {
          200: { description: 'Metadata dokumen berhasil diperbarui' },
          404: { description: 'Dokumen tidak ditemukan' }
        }
      },
      delete: {
        summary: 'Hapus Dokumen dari Repositori, CDN & RAG',
        description: 'Menghapus dokumen secara permanen dari basis data MySQL, membersihkan chunk dari RAG vector store, dan menghapus berkas fisik dari Kroombox CDN.',
        tags: ['Documents & Repositories'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID unik berkas dokumen yang ingin dihapus'
          }
        ],
        responses: {
          200: { description: 'Dokumen dan seluruh keterkaitannya berhasil dihapus' },
          404: { description: 'Dokumen tidak ditemukan' }
        }
      }
    },
    '/api/documents/{id}/view': {
      get: {
        summary: 'Pratinjau Langsung Berkas / Foto (Inline Streaming)',
        description: 'Melakukan streaming berkas secara inline (misal pratinjau gambar JPG/PNG/WebP atau PDF viewer) langsung ke peramban. Otomatis mencatat view log jika diakses oleh pengguna.',
        tags: ['Documents & Repositories'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID unik berkas dokumen'
          }
        ],
        responses: {
          200: {
            description: 'Inline binary stream berkas gambar / PDF',
            content: {
              'image/*': { schema: { type: 'string', format: 'binary' } },
              'application/pdf': { schema: { type: 'string', format: 'binary' } }
            }
          },
          404: { description: 'Berkas tidak ditemukan' }
        }
      }
    },
    '/api/documents/{id}/download': {
      get: {
        summary: 'Unduh Berkas Fisik Dokumen',
        description: 'Mengunduh berkas asli (binary attachment stream). Otomatis menambahkan counter unduhan dan mencatat entri log.',
        tags: ['Documents & Repositories'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID unik berkas dokumen'
          }
        ],
        responses: {
          200: {
            description: 'Streaming berkas binary dokumen dengan header Content-Disposition attachment',
            content: {
              'application/octet-stream': { schema: { type: 'string', format: 'binary' } }
            }
          },
          404: { description: 'Dokumen tidak ditemukan' }
        }
      }
    },
    '/api/documents/sync-rag': {
      post: {
        summary: 'Sinkronisasi Massal Repositori ke RAG Vector Store',
        description: 'Memindai seluruh dokumen aktif dalam project dan melakukan re-indexing ke mesin AI RAG untuk memastikan akurasi pencarian semantik.',
        tags: ['Documents & Repositories'],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  organizationId: { type: 'string', example: 'org-pam-jaya' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Sinkronisasi dokumen ke RAG berhasil dijalankan' }
        }
      }
    },
    '/api/documents/quota/{userId}': {
      get: {
        summary: 'Cek Kuota Penyimpanan Pengguna',
        description: 'Mendapatkan informasi kuota storage (MB), jumlah dokumen tersimpan, dan batas maksimal paket pengguna.',
        tags: ['Documents & Repositories'],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID pengguna'
          }
        ],
        responses: {
          200: { description: 'Informasi kuota penyimpanan berhasil diambil' }
        }
      }
    },

    // ----------------------------------------------------
    // DOCUMENT ACCESS LOGS & AUDIT (BARU)
    // ----------------------------------------------------
    '/api/documents/{id}/logs': {
      get: {
        summary: 'Ambil Riwayat Log Akses & Audit Dokumen (Baru)',
        description: 'Mendapatkan rekap metrik (total dilihat, total digunakan oleh AI RAG, waktu akses terakhir) serta kronologi riwayat interaksi pengguna terhadap dokumen.',
        tags: ['Document Access Logs & Audit'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID unik dokumen'
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 50 },
            description: 'Jumlah log maksimal yang ditampilkan'
          }
        ],
        responses: {
          200: {
            description: 'Riwayat log audit dokumen berhasil diambil',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DocumentLogsResponse' }
              }
            }
          },
          404: { description: 'Dokumen tidak ditemukan' }
        }
      }
    },
    '/api/documents/{id}/log-access': {
      post: {
        summary: 'Catat Akses Pengguna ke Dokumen (Baru)',
        description: 'Mencatat entri log interaksi ketika dokumen dibuka pratinjaunya (view), diunduh (download), diedit (edit), atau ditanyakan ke AI (query).',
        tags: ['Document Access Logs & Audit'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID unik dokumen'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LogAccessRequest' }
            }
          }
        },
        responses: {
          200: { description: 'Akses interaksi berhasil dicatat dan counter bertambah' },
          400: { description: 'Tipe aksi (actionType) tidak valid' },
          404: { description: 'Dokumen tidak ditemukan' }
        }
      }
    },

    // ----------------------------------------------------
    // PROJECTS
    // ----------------------------------------------------
    '/api/organizations': {
      get: {
        summary: 'Ambil Daftar Project BUMD',
        description: 'Mendapatkan daftar seluruh entitas project BUMD terdaftar beserta kode, jumlah anggota, dan penggunaan storage.',
        tags: ['Projects'],
        responses: {
          200: {
            description: 'Daftar project berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    organizations: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/OrganizationItem' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Buat Project Baru',
        description: 'Mendaftarkan project baru dengan konfigurasi RAG API Key otomatis dan isolasi tenant.',
        tags: ['Projects'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateOrganizationRequest' }
            }
          }
        },
        responses: {
          201: { description: 'Project berhasil dibuat' },
          400: { description: 'Data project tidak lengkap atau kode sudah digunakan' }
        }
      }
    },
    '/api/organizations/{id}': {
      get: {
        summary: 'Ambil Detail Project',
        description: 'Mendapatkan informasi detail suatu project beserta ringkasan berkas.',
        tags: ['Projects'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID unik project'
          }
        ],
        responses: {
          200: { description: 'Detail project berhasil diambil' },
          404: { description: 'Project tidak ditemukan' }
        }
      },
      put: {
        summary: 'Perbarui Data Project',
        description: 'Memperbarui nama, deskripsi, atau konfigurasi RAG project.',
        tags: ['Projects'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID unik project'
          }
        ],
        responses: {
          200: { description: 'Project berhasil diperbarui' },
          404: { description: 'Project tidak ditemukan' }
        }
      },
      delete: {
        summary: 'Hapus Project',
        description: 'Menghapus project dari sistem (Admin only).',
        tags: ['Projects'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID unik project'
          }
        ],
        responses: {
          200: { description: 'Project berhasil dihapus' }
        }
      }
    },

    // ----------------------------------------------------
    // USERS & ROLES
    // ----------------------------------------------------
    '/api/users': {
      get: {
        summary: 'Ambil Daftar Seluruh Pengguna',
        description: 'Mengambil daftar pengguna terdaftar beserta informasi peran (role) dan afiliasi project.',
        tags: ['Users & Roles'],
        responses: {
          200: {
            description: 'Daftar pengguna berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    users: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/UserItem' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Tambah Pengguna Baru (Admin Only)',
        description: 'Membuat akun pengguna baru dengan menetapkan project dan peran akses.',
        tags: ['Users & Roles'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Dewi Lestari' },
                  email: { type: 'string', example: 'dewi@bumd.go.id' },
                  password: { type: 'string', example: 'Password123' },
                  role: { type: 'string', enum: ['admin', 'user'], default: 'user' },
                  organizationId: { type: 'string', example: 'org-pam-jaya' },
                  department: { type: 'string', example: 'Audit Internal' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Pengguna baru berhasil dibuat' },
          400: { description: 'Email sudah terdaftar atau input tidak valid' }
        }
      }
    },
    '/api/users/{id}': {
      put: {
        summary: 'Perbarui Data Pengguna',
        description: 'Mengubah nama, peran, divisi, atau status akun pengguna.',
        tags: ['Users & Roles'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID pengguna'
          }
        ],
        responses: {
          200: { description: 'Data pengguna berhasil diperbarui' }
        }
      },
      delete: {
        summary: 'Hapus Akun Pengguna (Admin Only)',
        description: 'Menghapus akun pengguna dari sistem KMS.',
        tags: ['Users & Roles'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID pengguna'
          }
        ],
        responses: {
          200: { description: 'Pengguna berhasil dihapus' }
        }
      }
    },
    '/api/users/{id}/eject': {
      post: {
        summary: 'Keluarkan Anggota dari Project',
        description: 'Mencabut akses anggota dari project tertentu dan mengembalikannya ke status akun personal.',
        tags: ['Users & Roles'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID pengguna yang dikeluarkan'
          }
        ],
        responses: {
          200: { description: 'Anggota berhasil dikeluarkan dari project' }
        }
      }
    },

    // ----------------------------------------------------
    // AUTHENTICATION & PROFILE
    // ----------------------------------------------------
    '/api/auth/login': {
      post: {
        summary: 'Login User / Admin',
        description: 'Melakukan autentikasi menggunakan email dan password untuk mendapatkan JWT session token.',
        tags: ['Authentication & Profile'],
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
          200: {
            description: 'Login berhasil, token JWT dan data user dikembalikan',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' }
              }
            }
          },
          401: { description: 'Email atau password salah' }
        }
      }
    },
    '/api/auth/register': {
      post: {
        summary: 'Registrasi Akun Pengguna Baru',
        description: 'Mendaftarkan akun pengguna baru ke dalam platform KMS.',
        tags: ['Authentication & Profile'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' }
            }
          }
        },
        responses: {
          201: { description: 'Registrasi berhasil' },
          400: { description: 'Email sudah terdaftar' }
        }
      }
    },
    '/api/auth/profile/{id}': {
      put: {
        summary: 'Perbarui Profil Akun Sendiri',
        description: 'Memperbarui nama, nomor telepon, dan preferensi profil pengguna yang sedang masuk.',
        tags: ['Authentication & Profile'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID pengguna'
          }
        ],
        responses: {
          200: { description: 'Profil berhasil diperbarui' }
        }
      }
    },
    '/api/auth/change-password/{id}': {
      put: {
        summary: 'Ubah Kata Sandi Akun',
        description: 'Memperbarui kata sandi lama dengan kata sandi baru yang aman.',
        tags: ['Authentication & Profile'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID pengguna'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['oldPassword', 'newPassword'],
                properties: {
                  oldPassword: { type: 'string', example: 'Lama123!' },
                  newPassword: { type: 'string', example: 'Baru456#' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Kata sandi berhasil diubah' },
          400: { description: 'Kata sandi lama tidak sesuai' }
        }
      }
    },

    // ----------------------------------------------------
    // ACTIVITIES & ANALYTICS
    // ----------------------------------------------------
    '/api/activities': {
      get: {
        summary: 'Ambil Log Aktivitas Sistem (Audit Trail)',
        description: 'Mengambil log kronologis peristiwa sistem seperti login pengguna, unggah berkas, perubahan data, dan query semantik.',
        tags: ['Activities & Analytics'],
        responses: {
          200: {
            description: 'Daftar aktivitas sistem berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    activities: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ActivityItem' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/stats/dashboard': {
      get: {
        summary: 'Statistik Analitik Dashboard & Metrik RAG',
        description: 'Mendapatkan statistik komprehensif: total berkas fisik, kapasitas penyimpanan, total proyek, jumlah pengguna, dan akumulasi pertanyaan RAG.',
        tags: ['Activities & Analytics'],
        responses: {
          200: {
            description: 'Statistik analitik dashboard berhasil diambil',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DashboardStatsResponse' }
              }
            }
          }
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dokumentasi API KMS BUMD - Swagger UI</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%232563eb'><path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/></svg>" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-main: #0b0f19;
      --bg-surface: #111827;
      --bg-surface-elevated: #1f2937;
      --border-color: #374151;
      --text-main: #f9fafb;
      --text-muted: #9ca3af;
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --accent: #8b5cf6;
      --success: #10b981;
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      background: var(--bg-main);
      color: var(--text-main);
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .topbar-nav {
      background: rgba(17, 24, 39, 0.95);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--border-color);
      padding: 14px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .brand-title {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: #60a5fa;
      font-weight: 800;
      font-size: 17px;
      letter-spacing: -0.02em;
    }
    .brand-title:hover {
      color: #93c5fd;
    }
    .badge-openapi {
      background: #1e3a8a;
      color: #bfdbfe;
      border: 1px solid #3b82f6;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
    }
    .custom-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
      color: var(--text-main);
      padding: 32px 32px 28px 32px;
      border-bottom: 1px solid var(--border-color);
    }
    .banner-container {
      max-width: 1400px;
      margin: 0 auto;
    }
    .custom-banner h1 {
      margin: 0 0 8px 0;
      color: #ffffff;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.03em;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .badge-v2 {
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: #ffffff;
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-weight: 700;
    }
    .custom-banner p {
      margin: 6px 0 16px 0;
      color: var(--text-muted);
      font-size: 14px;
      max-width: 900px;
      line-height: 1.6;
    }
    .auth-pills-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }
    .key-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #111827;
      border: 1px solid #3b82f6;
      color: #93c5fd;
      padding: 8px 14px;
      border-radius: 10px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
    }
    .key-badge strong {
      color: #ffffff;
      user-select: all;
    }
    .chip-feature {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(31, 41, 55, 0.8);
      border: 1px solid #4b5563;
      color: #e5e7eb;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
    }
    .swagger-ui .topbar { display: none !important; }
    
    /* Dark Theme Swagger UI Adjustments */
    .swagger-ui {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
      color: #e2e8f0;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .swagger-ui .info {
      margin: 20px 0;
    }
    .swagger-ui .info .title {
      color: #f8fafc;
      font-size: 28px;
      font-weight: 800;
    }
    .swagger-ui .info p, .swagger-ui .info li {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.6;
    }
    .swagger-ui .info code {
      background: #1e293b;
      color: #38bdf8;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
    }
    .swagger-ui .scheme-container {
      background: #111827;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 16px 20px;
      box-shadow: none;
      margin-bottom: 24px;
    }
    .swagger-ui .opblock-tag {
      color: #f1f5f9 !important;
      font-size: 18px;
      font-weight: 700;
      border-bottom: 1px solid var(--border-color) !important;
      padding: 14px 0 10px 0;
    }
    .swagger-ui .opblock {
      border-radius: 12px !important;
      border: 1px solid var(--border-color) !important;
      background: #111827 !important;
      box-shadow: none !important;
      margin-bottom: 12px;
    }
    .swagger-ui .opblock .opblock-summary {
      padding: 10px 16px;
    }
    .swagger-ui .opblock .opblock-summary-path {
      color: #f8fafc !important;
      font-weight: 600;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
    }
    .swagger-ui .opblock .opblock-summary-description {
      color: #94a3b8 !important;
      font-size: 12px;
    }
    .swagger-ui .opblock-body {
      background: #0f172a !important;
      border-top: 1px solid var(--border-color);
    }
    .swagger-ui table thead tr td, .swagger-ui table thead tr th {
      color: #94a3b8;
      border-bottom: 1px solid var(--border-color);
    }
    .swagger-ui .parameter__name {
      color: #f8fafc;
      font-family: 'JetBrains Mono', monospace;
    }
    .swagger-ui .parameter__type {
      color: #38bdf8;
    }
    .swagger-ui input[type=text], .swagger-ui textarea, .swagger-ui select {
      background: #1e293b !important;
      color: #f8fafc !important;
      border: 1px solid var(--border-color) !important;
      border-radius: 8px !important;
      padding: 8px 12px !important;
    }
    .swagger-ui .btn {
      border-radius: 8px !important;
      font-weight: 600;
    }
    .swagger-ui .btn.authorize {
      background: #2563eb !important;
      color: #ffffff !important;
      border-color: #3b82f6 !important;
    }
    .swagger-ui .btn.execute {
      background: #3b82f6 !important;
      color: #ffffff !important;
      border-color: #3b82f6 !important;
    }
    .swagger-ui .response-col_status {
      color: #f8fafc;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
    }
    .swagger-ui section.models {
      border: 1px solid var(--border-color) !important;
      background: #111827 !important;
      border-radius: 12px !important;
    }
    .swagger-ui section.models h4 {
      color: #f8fafc !important;
    }
    .swagger-ui .model-box {
      background: #0f172a !important;
    }
    .swagger-ui .model-title {
      color: #60a5fa !important;
      font-family: 'JetBrains Mono', monospace;
    }
    .swagger-ui .prop-type {
      color: #38bdf8 !important;
    }
  </style>
</head>
<body>
  <header class="topbar-nav">
    <a href="/api/docs" class="brand-title">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
        <polyline points="2 17 12 22 22 17"></polyline>
        <polyline points="2 12 12 17 22 12"></polyline>
      </svg>
      <span>KMS BUMD API Portal</span>
    </a>
    <div style="display: flex; align-items: center; gap: 12px;">
      <a href="/api/openapi.json" target="_blank" style="text-decoration: none; color: #94a3b8; font-size: 13px; font-weight: 600; hover:color: #f8fafc;">
        📄 JSON Spec
      </a>
      <span class="badge-openapi">OpenAPI 3.0.3</span>
    </div>
  </header>

  <section class="custom-banner">
    <div class="banner-container">
      <h1>
        Portal Developer & Dokumentasi API KMS BUMD
        <span class="badge-v2">v2.0 Released</span>
      </h1>
      <p>
        Pusat dokumentasi terintegrasi untuk menghubungkan aplikasi eksternal, sistem ERP, bot WhatsApp/Telegram, atau script automasi dengan KMS BUMD AI RAG. Dilengkapi dengan audit access logging, streaming dokumen/media, dan manajemen multi-project.
      </p>
      <div class="auth-pills-row">
        <div class="key-badge">
          <span>Header API Key:</span>
          <strong>kms_dev_live_7x89q2k4m1n5p0</strong>
        </div>
        <div class="chip-feature">
          <span>✨ Multi-Tenant AI RAG</span>
        </div>
        <div class="chip-feature">
          <span>📊 Audit Access Logs</span>
        </div>
        <div class="chip-feature">
          <span>⚡ Kroombox Edge CDN</span>
        </div>
      </div>
    </div>
  </section>

  <main id="swagger-ui"></main>

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
        showRequestHeaders: true,
        filter: true
      });
      window.ui = ui;
    };
  </script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});
