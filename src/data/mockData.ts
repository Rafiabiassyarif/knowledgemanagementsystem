import { Organization, User, DocumentItem, KnowledgeChunk, ActivityLog, JoinRequest, RagConfig } from '../types';

export const initialOrganizations: Organization[] = [
  {
    id: 'org-pam-jaya',
    name: 'PAM Jaya',
    code: 'PAM-JAYA-01',
    description: 'Perusahaan Umum Daerah Air Minum Jaya penyedia layanan air perpipaan di wilayah Provinsi DKI Jakarta.',
    type: 'BUMD Air Minum',
    sector: 'Air Bersih & Sanitasi',
    province: 'DKI Jakarta',
    city: 'Jakarta Pusat',
    adminId: 'user-andi-pam',
    adminName: 'Andi Pratama',
    adminEmail: 'andi.pratama@pamjaya.co.id',
    documentsCount: 124,
    usersCount: 38,
    chunksCount: 864,
    aiQueriesCount: 1420,
    storageUsedMb: 4820,
    status: 'active',
    createdAt: '2024-01-15'
  },
  {
    id: 'org-bank-bjb',
    name: 'Bank BJB',
    code: 'BJB-CORP-02',
    description: 'PT Bank Pembangunan Daerah Jawa Barat dan Banten Tbk berfokus pada layanan intermediasi perbankan dan kredit UMKM daerah.',
    type: 'BUMD Perbankan',
    sector: 'Jasa Keuangan & Perbankan',
    province: 'Jawa Barat',
    city: 'Bandung',
    adminId: 'user-siti-bjb',
    adminName: 'Siti Rahma',
    adminEmail: 'siti.rahma@bankbjb.co.id',
    documentsCount: 96,
    usersCount: 52,
    chunksCount: 712,
    aiQueriesCount: 2180,
    storageUsedMb: 6150,
    status: 'active',
    createdAt: '2024-02-10'
  },
  {
    id: 'org-pasar-jaya',
    name: 'Perumda Pasar Jaya',
    code: 'PSJ-MKT-03',
    description: 'Pengelola 153 pasar tradisional dan modern serta stabilitas pangan daerah di DKI Jakarta.',
    type: 'BUMD Pangan & Pasar',
    sector: 'Perdagangan & Distribusi Pangan',
    province: 'DKI Jakarta',
    city: 'Jakarta Timur',
    adminId: 'user-hendra-psj',
    adminName: 'Hendra Wijaya',
    adminEmail: 'hendra.w@pasarjaya.co.id',
    documentsCount: 58,
    usersCount: 24,
    chunksCount: 420,
    aiQueriesCount: 640,
    storageUsedMb: 2310,
    status: 'active',
    createdAt: '2024-03-01'
  },
  {
    id: 'org-tirta-kahuripan',
    name: 'Perumdam Tirta Kahuripan',
    code: 'TRT-KHR-04',
    description: 'BUMD air minum melayani penyediaan air bersih untuk kawasan permukiman dan industri Kabupaten Bogor.',
    type: 'BUMD Air Minum',
    sector: 'Air Bersih & Sanitasi',
    province: 'Jawa Barat',
    city: 'Cibinong / Kab. Bogor',
    adminId: 'user-dedi-tirta',
    adminName: 'Dedi Kurniawan',
    adminEmail: 'dedi.kurniawan@tirtakahuripan.co.id',
    documentsCount: 41,
    usersCount: 19,
    chunksCount: 290,
    aiQueriesCount: 390,
    storageUsedMb: 1740,
    status: 'active',
    createdAt: '2024-04-20'
  },
  {
    id: 'org-transjakarta',
    name: 'PT Transjakarta',
    code: 'TRX-JKT-05',
    description: 'Operator sistem Bus Rapid Transit (BRT) terpanjang di Asia Tenggara melayani mobilitas perkotaan.',
    type: 'BUMD Transportasi',
    sector: 'Transportasi Publik',
    province: 'DKI Jakarta',
    city: 'Jakarta Timur',
    adminId: 'user-bambang-trx',
    adminName: 'Bambang Soetrisno',
    adminEmail: 'bambang.s@transjakarta.co.id',
    documentsCount: 78,
    usersCount: 31,
    chunksCount: 560,
    aiQueriesCount: 980,
    storageUsedMb: 3490,
    status: 'active',
    createdAt: '2024-05-05'
  }
];

export const initialUsers: User[] = [
  // Superadmin
  {
    id: 'user-super-rafi',
    name: 'Rafi Abias Syarif',
    email: 'rafi.superadmin@kms.gov.id',
    role: 'superadmin',
    organizationId: null,
    organizationName: 'KMS Platform Superadmin',
    department: 'Platform Governance & Cloud Engineering',
    status: 'active',
    joinedAt: '2023-11-01',
    avatarInitials: 'RS'
  },
  // PAM Jaya Admin & Users
  {
    id: 'user-andi-pam',
    name: 'Andi Pratama',
    email: 'andi.pratama@pamjaya.co.id',
    role: 'admin',
    organizationId: 'org-pam-jaya',
    organizationName: 'PAM Jaya',
    department: 'Teknologi Informasi & Pengetahuan',
    status: 'active',
    joinedAt: '2024-01-15',
    avatarInitials: 'AP'
  },
  {
    id: 'user-budi-pam',
    name: 'Budi Santoso',
    email: 'budi.santoso@pamjaya.co.id',
    role: 'user',
    organizationId: 'org-pam-jaya',
    organizationName: 'PAM Jaya',
    department: 'Distribusi & Pemeliharaan Jaringan',
    status: 'active',
    joinedAt: '2024-02-01',
    avatarInitials: 'BS'
  },
  {
    id: 'user-ratna-pam',
    name: 'Ratna Wulandari',
    email: 'ratna.w@pamjaya.co.id',
    role: 'user',
    organizationId: 'org-pam-jaya',
    organizationName: 'PAM Jaya',
    department: 'Laboratorium & Kontrol Kualitas Air',
    status: 'active',
    joinedAt: '2024-02-18',
    avatarInitials: 'RW'
  },
  // Bank BJB Admin & Users
  {
    id: 'user-siti-bjb',
    name: 'Siti Rahma',
    email: 'siti.rahma@bankbjb.co.id',
    role: 'admin',
    organizationId: 'org-bank-bjb',
    organizationName: 'Bank BJB',
    department: 'Risk Management & Corporate Knowledge',
    status: 'active',
    joinedAt: '2024-02-10',
    avatarInitials: 'SR'
  },
  {
    id: 'user-dewi-bjb',
    name: 'Dewi Lestari',
    email: 'dewi.lestari@bankbjb.co.id',
    role: 'user',
    organizationId: 'org-bank-bjb',
    organizationName: 'Bank BJB',
    department: 'Divisi Kredit Komersial & UMKM',
    status: 'active',
    joinedAt: '2024-03-05',
    avatarInitials: 'DL'
  },
  {
    id: 'user-fajar-bjb',
    name: 'Fajar Nugraha',
    email: 'fajar.nugraha@bankbjb.co.id',
    role: 'user',
    organizationId: 'org-bank-bjb',
    organizationName: 'Bank BJB',
    department: 'Kepatuhan & Tata Kelola Perbankan',
    status: 'active',
    joinedAt: '2024-03-12',
    avatarInitials: 'FN'
  },
  // Perumda Pasar Jaya Admin
  {
    id: 'user-hendra-psj',
    name: 'Hendra Wijaya',
    email: 'hendra.w@pasarjaya.co.id',
    role: 'admin',
    organizationId: 'org-pasar-jaya',
    organizationName: 'Perumda Pasar Jaya',
    department: 'Manajemen Operasional Pasar',
    status: 'active',
    joinedAt: '2024-03-01',
    avatarInitials: 'HW'
  },
  // User Baru Belum Bergabung (Untuk Uji Flow Join Org & Empty State)
  {
    id: 'user-rina-baru',
    name: 'Rina Melati',
    email: 'rina.baru@gmail.com',
    role: 'user',
    organizationId: null,
    organizationName: null,
    department: 'Pengguna Umum',
    status: 'active',
    joinedAt: '2026-09-29',
    avatarInitials: 'RM',
    orgJoinStatus: 'none'
  },
  // Admin Baru Belum Memiliki Organisasi (Untuk Uji Aturan 1 Admin = 1 Org)
  {
    id: 'user-dedi-admin-baru',
    name: 'Dedi Kurnia',
    email: 'admin.baru@kms.id',
    role: 'admin',
    organizationId: null,
    organizationName: null,
    department: 'Inisiator Organisasi',
    status: 'active',
    joinedAt: '2026-09-29',
    avatarInitials: 'DK',
    orgJoinStatus: 'none'
  }
];

export const initialDocuments: DocumentItem[] = [
  // PAM Jaya Documents
  {
    id: 'doc-pam-01',
    organizationId: 'org-pam-jaya',
    organizationName: 'PAM Jaya',
    title: 'SOP Penanganan Kebocoran Pipa Distribusi Utama (Non-Revenue Water)',
    category: 'SOP & Prosedur',
    year: 2025,
    fileType: 'PDF',
    fileSizeKb: 3420,
    uploadedBy: 'Andi Pratama',
    uploadedAt: '2025-08-14',
    version: 'v3.2',
    status: 'indexed',
    chunksCount: 14,
    summary: 'Petunjuk teknis identifikasi kebocoran pipa HDPE & pipa besi ductile, protokol isolasi zona katup darurat, standar pelaporan teknis, dan SLA perbaikan maksimal 4 jam kerja.',
    department: 'Distribusi & Pemeliharaan Jaringan',
    tags: ['distribusi', 'NRW', 'pipa', 'kebocoran', 'emergency']
  },
  {
    id: 'doc-pam-02',
    organizationId: 'org-pam-jaya',
    organizationName: 'PAM Jaya',
    title: 'Pedoman Standar Kekeruhan dan Klorinasi IPA Pejompongan I & II',
    category: 'Engineering & Teknis',
    year: 2026,
    fileType: 'PDF',
    fileSizeKb: 2150,
    uploadedBy: 'Ratna Wulandari',
    uploadedAt: '2026-02-10',
    version: 'v2.0',
    status: 'indexed',
    chunksCount: 10,
    summary: 'Spesifikasi teknis ambang batas kekeruhan air baku < 5 NTU, dosis koagulan PAC, klorin sisa 0.2 - 0.5 mg/L pada titik terjauh jaringan distribusi.',
    department: 'Laboratorium & Kontrol Kualitas Air',
    tags: ['kualitas air', 'IPA', 'klorinasi', 'turbiditas', 'laboratorium']
  },
  {
    id: 'doc-pam-03',
    organizationId: 'org-pam-jaya',
    organizationName: 'PAM Jaya',
    title: 'Laporan Keuangan Tahunan Audited PAM Jaya Tahun Buku 2025',
    category: 'Laporan Keuangan',
    year: 2025,
    fileType: 'PDF',
    fileSizeKb: 8900,
    uploadedBy: 'Andi Pratama',
    uploadedAt: '2026-01-22',
    version: 'v1.0',
    status: 'indexed',
    chunksCount: 38,
    summary: 'Laporan posisi keuangan audited, realisasi capex sambungan perpipaan baru 100% Jakarta 2030, rasio likuiditas dan kontribusi dividen PAD DKI Jakarta.',
    department: 'Direktorat Keuangan',
    tags: ['keuangan', 'audit', 'laba rugi', 'dividen', 'capex']
  },
  {
    id: 'doc-pam-04',
    organizationId: 'org-pam-jaya',
    organizationName: 'PAM Jaya',
    title: 'Peraturan Direksi tentang Tata Cara Pengajuan Cuti dan Lembur Pegawai',
    category: 'Kebijakan HR',
    year: 2024,
    fileType: 'DOCX',
    fileSizeKb: 920,
    uploadedBy: 'Andi Pratama',
    uploadedAt: '2024-11-05',
    version: 'v1.4',
    status: 'indexed',
    chunksCount: 6,
    summary: 'Kebijakan internal SDM PAM Jaya perihal cuti tahunan, cuti melahirkan, kompensasi kerja shift teknisi lapangan pada hari libur nasional.',
    department: 'Human Capital',
    tags: ['HR', 'cuti', 'lembur', 'kompensasi', 'SDM']
  },

  // Bank BJB Documents
  {
    id: 'doc-bjb-01',
    organizationId: 'org-bank-bjb',
    organizationName: 'Bank BJB',
    title: 'Pedoman Standar Penilaian Kelayakan Kredit UMKM BJB Mesra (Masyarakat Ekonomi Sejahtera)',
    category: 'SOP & Prosedur',
    year: 2025,
    fileType: 'PDF',
    fileSizeKb: 4210,
    uploadedBy: 'Siti Rahma',
    uploadedAt: '2025-09-02',
    version: 'v4.1',
    status: 'indexed',
    chunksCount: 18,
    summary: 'Kriteria analisa kredit tanpa agunan bunga rendah, verifikasi kolektif tempat ibadah, metodologi credit scoring, dan tata cara mitigasi kredit bermasalah (NPL).',
    department: 'Divisi Kredit Komersial & UMKM',
    tags: ['kredit', 'bjb mesra', 'UMKM', 'scoring', 'analisis risiko']
  },
  {
    id: 'doc-bjb-02',
    organizationId: 'org-bank-bjb',
    organizationName: 'Bank BJB',
    title: 'Kebijakan Tata Kelola Anti Pencucian Uang dan Pencegahan Pendanaan Terorisme (APU-PPT)',
    category: 'Regulasi & Perda',
    year: 2026,
    fileType: 'PDF',
    fileSizeKb: 3670,
    uploadedBy: 'Fajar Nugraha',
    uploadedAt: '2026-03-01',
    version: 'v5.0',
    status: 'indexed',
    chunksCount: 16,
    summary: 'Kerangka kepatuhan APU-PPT mengacu pada Peraturan OJK POJK No. 8/2023, Customer Due Diligence (CDD), Enhanced Due Diligence (EDD), dan mekanisme pelaporan PPATK.',
    department: 'Kepatuhan & Tata Kelola Perbankan',
    tags: ['APU-PPT', 'OJK', 'kepatuhan', 'CDD', 'PPATK']
  },
  {
    id: 'doc-bjb-03',
    organizationId: 'org-bank-bjb',
    organizationName: 'Bank BJB',
    title: 'Laporan Keuangan Triwulan II 2026 Publikasi Otoritas Jasa Keuangan',
    category: 'Laporan Keuangan',
    year: 2026,
    fileType: 'XLSX',
    fileSizeKb: 5410,
    uploadedBy: 'Siti Rahma',
    uploadedAt: '2026-07-15',
    version: 'v1.1',
    status: 'indexed',
    chunksCount: 22,
    summary: 'Ringkasan rasio CAR, NIM, BOPO, NPL Net 1.18%, Loan to Deposit Ratio (LDR), serta pertumbuhan kredit sindikasi BUMD se-Jawa Barat.',
    department: 'Divisi Akuntansi & Keuangan',
    tags: ['keuangan', 'rasio keuangan', 'CAR', 'NIM', 'NPL']
  },

  // Perumda Pasar Jaya Documents
  {
    id: 'doc-psj-01',
    organizationId: 'org-pasar-jaya',
    organizationName: 'Perumda Pasar Jaya',
    title: 'Tata Tertib Penggunaan Kios dan Zonasi Komoditas Pasar Tradisional DKI',
    category: 'Regulasi & Perda',
    year: 2025,
    fileType: 'PDF',
    fileSizeKb: 2840,
    uploadedBy: 'Hendra Wijaya',
    uploadedAt: '2025-10-18',
    version: 'v2.3',
    status: 'indexed',
    chunksCount: 12,
    summary: 'Pengaturan sewa tempat usaha (BPTU), retribusi kebersihan, zonasi komoditas basah/kering, dan sanksi pencabutan izin usaha pedagang.',
    department: 'Manajemen Operasional Pasar',
    tags: ['pasar', 'kios', 'retribusi', 'zonasi', 'pedagang']
  }
];

export const initialKnowledgeChunks: KnowledgeChunk[] = [
  // PAM Jaya Chunks
  {
    id: 'chunk-pam-101',
    documentId: 'doc-pam-01',
    documentTitle: 'SOP Penanganan Kebocoran Pipa Distribusi Utama (Non-Revenue Water)',
    organizationId: 'org-pam-jaya',
    organizationName: 'PAM Jaya',
    chunkIndex: 1,
    totalChunks: 14,
    sectionTitle: 'Bab II: Prosedur Verifikasi Lapangan dan Deteksi Akustik',
    content: 'Tim Reaksi Cepat (TRC) NRW wajib tiba di lokasi dugaan kebocoran maksimal 30 menit setelah laporan tiket terbit dari Call Center 1500-223. Deteksi fisik dilakukan menggunakan Ground Microphone tipe correlator untuk memetakan koordinat presisi kebocoran pada kedalaman 1,5 - 2,5 meter di bawah aspal/beton jalan raya.',
    tokenCount: 84,
    embeddingStatus: 'embedded'
  },
  {
    id: 'chunk-pam-102',
    documentId: 'doc-pam-01',
    documentTitle: 'SOP Penanganan Kebocoran Pipa Distribusi Utama (Non-Revenue Water)',
    organizationId: 'org-pam-jaya',
    organizationName: 'PAM Jaya',
    chunkIndex: 2,
    totalChunks: 14,
    sectionTitle: 'Bab III: Protokol Isolasi Valve dan Pemotongan Aliran',
    content: 'Sebelum penggalian, supervisor lapangan harus memutar katup isolasi (gate valve) zona terdampak berlawanan arah jarum jam sebanyak 16 putaran penuh. Pemberitahuan penghentian sementara suplai air bersih disebarkan melalui kanal WhatsApp Blast dan akun resmi media sosial PAM Jaya dengan estimasi waktu perbaikan (SLA perbaikan maksimal 4 jam).',
    tokenCount: 92,
    embeddingStatus: 'embedded'
  },
  {
    id: 'chunk-pam-103',
    documentId: 'doc-pam-02',
    documentTitle: 'Pedoman Standar Kekeruhan dan Klorinasi IPA Pejompongan I & II',
    organizationId: 'org-pam-jaya',
    organizationName: 'PAM Jaya',
    chunkIndex: 1,
    totalChunks: 10,
    sectionTitle: 'Bagian 1: Standar Mutu Air Olahan Titik Reservoir',
    content: 'Air olahan yang keluar dari instalasi filtrasi pasir cepat (rapid sand filter) wajib memenuhi kriteria turbiditas di bawah 1.0 NTU (maksimal 5 NTU sesuai Permenkes 2/2023). Injeksi gas klorin dilakukan dengan takaran 1.8 - 2.4 mg/L untuk menjamin sisa klor aktif 0.3 mg/L di pipa distribusi konsumen terjauh.',
    tokenCount: 88,
    embeddingStatus: 'embedded'
  },
  {
    id: 'chunk-pam-104',
    documentId: 'doc-pam-04',
    documentTitle: 'Peraturan Direksi tentang Tata Cara Pengajuan Cuti dan Lembur Pegawai',
    organizationId: 'org-pam-jaya',
    organizationName: 'PAM Jaya',
    chunkIndex: 3,
    totalChunks: 6,
    sectionTitle: 'Pasal 8: Ketentuan Upah Lembur Shift Lapangan',
    content: 'Teknisi lapangan yang ditugaskan pada kondisi tanggap darurat di luar jam kerja normal atau hari libur resmi berhak atas uang lembur dengan formula 1.5x upah sejam untuk jam pertama, dan 2x upah sejam untuk jam berikutnya, ditambah uang makan darurat sebesar Rp 65.000 per penugasan.',
    tokenCount: 78,
    embeddingStatus: 'embedded'
  },

  // Bank BJB Chunks
  {
    id: 'chunk-bjb-201',
    documentId: 'doc-bjb-01',
    documentTitle: 'Pedoman Standar Penilaian Kelayakan Kredit UMKM BJB Mesra',
    organizationId: 'org-bank-bjb',
    organizationName: 'Bank BJB',
    chunkIndex: 1,
    totalChunks: 18,
    sectionTitle: 'Bab 1: Syarat Pengajuan & Verifikasi Organisasi',
    content: 'Kredit bjb Mesra diperuntukkan bagi pelaku usaha ultra mikro dan mikro dengan plafon maksimal Rp 5.000.000 (tahap awal) tanpa agunan fisik. Syarat mutlak: terdaftar dalam kelompok binaan rumah ibadah (masjid/gereja/vihara) minimal 5 anggota dan mengantongi rekomendasi tertulis dari pengurus tempat ibadah.',
    tokenCount: 81,
    embeddingStatus: 'embedded'
  },
  {
    id: 'chunk-bjb-202',
    documentId: 'doc-bjb-01',
    documentTitle: 'Pedoman Standar Penilaian Kelayakan Kredit UMKM BJB Mesra',
    organizationId: 'org-bank-bjb',
    organizationName: 'Bank BJB',
    chunkIndex: 2,
    totalChunks: 18,
    sectionTitle: 'Bab 4: Restrukturisasi dan Kebijakan NPL',
    content: 'Nasabah yang mengalami penurunan omzet akibat bencana atau force majeure dapat mengajukan restrukturisasi kredit berupa perpanjangan tenor angsuran maksimal 12 bulan atau penundaan pokok angsuran selama 3 bulan. Analis kredit wajib menyusun Memorandum Restrukturisasi Kredit (MRK) untuk disetujui Pemimpin Cabang.',
    tokenCount: 86,
    embeddingStatus: 'embedded'
  },
  {
    id: 'chunk-bjb-203',
    documentId: 'doc-bjb-02',
    documentTitle: 'Kebijakan Tata Kelola Anti Pencucian Uang dan Pencegahan Pendanaan Terorisme (APU-PPT)',
    organizationId: 'org-bank-bjb',
    organizationName: 'Bank BJB',
    chunkIndex: 4,
    totalChunks: 16,
    sectionTitle: 'Bab III: Prosedur Customer Due Diligence (CDD) Diperluas (EDD)',
    content: 'Pemeriksaan EDD wajib dilakukan terhadap calon nasabah yang masuk kategori Politically Exposed Persons (PEP), nasabah dari yurisdiksi berisiko tinggi (FATF grey/black list), serta transaksi tunai mencurigakan melebihi Rp 500.000.000 dalam satu hari kerja melalui sistem Anti-Money Laundering automated alert.',
    tokenCount: 85,
    embeddingStatus: 'embedded'
  }
];

export const initialActivityLogs: ActivityLog[] = [
  {
    id: 'act-01',
    organizationId: 'org-pam-jaya',
    organizationName: 'PAM Jaya',
    actorName: 'Andi Pratama',
    actorRole: 'admin',
    action: 'Unggah Dokumen Baru',
    target: 'SOP Penanganan Kebocoran Pipa Distribusi Utama v3.2',
    timestamp: '10 menit lalu',
    type: 'document'
  },
  {
    id: 'act-02',
    organizationId: 'org-bank-bjb',
    organizationName: 'Bank BJB',
    actorName: 'Siti Rahma',
    actorRole: 'admin',
    action: 'Indexing 22 Chunks RAG',
    target: 'Laporan Keuangan Triwulan II 2026',
    timestamp: '35 menit lalu',
    type: 'ai'
  },
  {
    id: 'act-03',
    organizationId: 'org-pam-jaya',
    organizationName: 'PAM Jaya',
    actorName: 'Budi Santoso',
    actorRole: 'user',
    action: 'Query AI Assistant',
    target: '"Berapa putaran gate valve saat isolasi kebocoran pipa?"',
    timestamp: '1 jam lalu',
    type: 'ai'
  },
  {
    id: 'act-04',
    organizationId: 'org-bank-bjb',
    organizationName: 'Bank BJB',
    actorName: 'Dewi Lestari',
    actorRole: 'user',
    action: 'Pencarian Knowledge',
    target: 'Kriteria Plafon BJB Mesra kelompok ibadah',
    timestamp: '2 jam lalu',
    type: 'document'
  },
  {
    id: 'act-05',
    organizationId: null,
    organizationName: 'KMS Platform Superadmin',
    actorName: 'Rafi Abias Syarif',
    actorRole: 'superadmin',
    action: 'Konfigurasi Parameter RAG',
    target: 'Update Chunk Size 512 & Top-K 5 untuk semua tenant',
    timestamp: '5 jam lalu',
    type: 'security'
  },
  {
    id: 'act-06',
    organizationId: 'org-pasar-jaya',
    organizationName: 'Perumda Pasar Jaya',
    actorName: 'Hendra Wijaya',
    actorRole: 'admin',
    action: 'Memperbarui Dokumen',
    target: 'Tata Tertib Kios & Zonasi Komoditas Pasar v2.3',
    timestamp: '1 hari lalu',
    type: 'document'
  }
];

export const initialJoinRequests: JoinRequest[] = [
  {
    id: 'req-01',
    organizationCode: 'PAM-JAYA-01',
    organizationName: 'PAM Jaya',
    applicantName: 'Eko Sulistyo',
    applicantEmail: 'eko.sulistyo@gmail.com',
    department: 'Teknik Sipil & Perencanaan Jaringan',
    reason: 'Memerlukan akses ke arsip gambar teknik pipa transmisi dan SOP pemeliharaan katup untuk penugasan proyek pipa baru 2026.',
    status: 'pending',
    requestedAt: '2026-09-28'
  },
  {
    id: 'req-02',
    organizationCode: 'BJB-CORP-02',
    organizationName: 'Bank BJB',
    applicantName: 'Rina Kusuma',
    applicantEmail: 'rina.kusuma@gmail.com',
    department: 'Relationship Officer Cabang Bogor',
    reason: 'Sebagai staf baru komersial butuh akses dokumen panduan kredit bjb Mesra dan formulir persetujuan restrukturisasi kredit.',
    status: 'pending',
    requestedAt: '2026-09-27'
  }
];

export const defaultRagConfig: RagConfig = {
  chunkSize: 512,
  chunkOverlap: 64,
  embeddingModel: 'text-embedding-3-large (Mock / Local)',
  similarityThreshold: 0.78,
  topKRetrieval: 4,
  systemPrompt: `Anda adalah AI Knowledge Assistant resmi organisasi. Anda HANYA diperbolehkan menjawab berdasarkan dokumen yang terindeks dan diperuntukkan bagi organisasi terkait. Selalu sertakan kutipan nomor chunk dan judul dokumen rujukan secara transparan.`
};
