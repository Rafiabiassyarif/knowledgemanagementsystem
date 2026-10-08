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

export const initialDocuments: DocumentItem[] = [];

export const initialKnowledgeChunks: KnowledgeChunk[] = [];

export const initialActivityLogs: ActivityLog[] = [];

export const initialJoinRequests: JoinRequest[] = [];

export const defaultRagConfig: RagConfig = {
  chunkSize: 512,
  chunkOverlap: 64,
  embeddingModel: 'text-embedding-3-large (Mock / Local)',
  similarityThreshold: 0.78,
  topKRetrieval: 4,
  systemPrompt: `Anda adalah AI Knowledge Assistant resmi organisasi. Anda HANYA diperbolehkan menjawab berdasarkan dokumen yang terindeks dan diperuntukkan bagi organisasi terkait. Selalu sertakan kutipan nomor chunk dan judul dokumen rujukan secara transparan.`
};
