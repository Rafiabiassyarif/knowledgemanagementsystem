/**
 * Konfigurasi Konten & Data Landing Page KMS BUMD (KnowBase)
 * Semua teks, daftar fitur, langkah, harga, dan informasi brand dikelola di sini.
 */

interface SiteData {
  brand: {
    name: string;
    tagline: string;
    description: string;
    logoText: string;
    logoHighlight: string;
    foundedYear: number;
    contactEmail: string;
    contactPhone: string;
    officeLocation: string;
  };
  navLinks: Array<{ name: string; href: string }>;
  problemSolution: {
    sectionBadge: string;
    title: string;
    subtitle: string;
    items: Array<{ number: string; title: string; description: string }>;
  };
  features: {
    sectionBadge: string;
    title: string;
    subtitle: string;
    list: Array<{ id: string; iconName: string; title: string; description: string }>;
  };
  howItWorks: {
    sectionBadge: string;
    title: string;
    subtitle: string;
    steps: Array<{ step: string; title: string; description: string; tag: string }>;
  };
  pricing: {
    sectionBadge: string;
    title: string;
    subtitle: string;
    discountBadge: string;
    plans: any[];
  };
  faqs: Array<{ id: string; question: string; answer: string }>;
  ctaSection: {
    badge: string;
    headline: string;
    subheadline: string;
    primaryButton: string;
    secondaryButton: string;
    footnote: string;
  };
  footer: {
    about: string;
    columns: Array<{ title: string; links: Array<{ label: string; href: string }> }>;
    copyright: string;
  };
}

export const siteData: SiteData = {
  brand: {
    name: 'KMS BUMD',
    tagline: 'RAG Knowledge Management System Cerdas & Terverifikasi',
    description:
      'Ubah seluruh arsip dokumen, buku panduan, modul, dan catatan pengetahuan menjadi asisten cerdas yang menjawab dengan akurat disertai rujukan sumber asli.',
    logoText: 'KnowBase',
    logoHighlight: 'AI',
    foundedYear: 2026,
    contactEmail: 'halo@knowbase.id',
    contactPhone: '+62 21 5088 9200',
    officeLocation: 'Jakarta Selatan, DKI Jakarta, Indonesia',
  },

  navLinks: [
    { name: 'Tentang RAG', href: '#rag' },
    { name: 'Fitur', href: '#fitur' },
    { name: 'Cara Kerja', href: '#cara-kerja' },
    // SEMBUNYI SEMENTARA: link paket belum dipublikasikan
    // { name: 'Paket & Harga', href: '#paket' },
    { name: 'FAQ', href: '#faq' },
  ],

  problemSolution: {
    sectionBadge: 'Solusi Praktis',
    title: 'Tiga Keunggulan Utama KnowBase',
    subtitle: 'Cara paling sederhana dan aman untuk mengelola dokumen dan pengetahuan Anda.',
    items: [
      {
        number: '01',
        title: 'Dokumen Terpusat & Cepat Ditemukan',
        description:
          'Seluruh format file PDF, Word, dan materi tersentralisasi dalam satu sistem yang dapat diakses instan kapan saja.',
      },
      {
        number: '02',
        title: 'Rujukan Sumber Terverifikasi',
        description:
          'Setiap informasi selalu disertai kutipan dokumen resmi dan nomor halaman presisi tanpa risiko jawaban karangan.',
      },
      {
        number: '03',
        title: 'Keamanan Data & Privasi Terjamin',
        description:
          'Perlindungan data menyeluruh dengan enkripsi AES-256 serta kontrol privasi penuh atas seluruh berkas Anda.',
      },
    ],
  },

  features: {
    sectionBadge: 'Kemampuan Utama Platform',
    title: '3 Pilar Utama KnowBase AI',
    subtitle:
      'Tiga fondasi penting untuk mengubah tumpukan dokumen menjadi pusat pengetahuan cerdas dan terverifikasi.',
    list: [
      {
        id: 'upload',
        iconName: 'FileSpreadsheet',
        title: 'Sentralisasi Dokumen Multi-Format',
        description:
          'Dukungan penuh untuk PDF, DOCX, TXT, dan spreadsheet. Ekstraksi otomatis teks, tabel, dan metadata tanpa perlu konversi manual.',
      },
      {
        id: 'rag-citation',
        iconName: 'BookmarkCheck',
        title: 'Rujukan Sumber Terverifikasi',
        description:
          'Setiap informasi selalu disertai kutipan transparan judul file dan nomor halaman presisi, sehingga bebas dari risiko halusinasi.',
      },
      {
        id: 'security',
        iconName: 'LockKeyhole',
        title: 'Keamanan Terjamin & Kendali Akses',
        description:
          'Enkripsi menyeluruh AES-256 dengan pemisahan izin Admin dan Pengguna untuk memastikan kerahasiaan seluruh dokumen Anda.',
      },
    ],
  },

  howItWorks: {
    sectionBadge: 'Alur Kerja Sederhana',
    title: '4 Langkah Menghidupkan Knowledge Base AI Anda',
    subtitle:
      'Tidak butuh keahlian coding atau pengetahuan teknis rumit. Mulai dari registrasi hingga tanya-jawab pertama hanya butuh waktu beberapa menit.',
    steps: [
      {
        step: '01',
        title: 'Daftar & Atur Workspace',
        description: 'Buat akun Anda, tentukan nama ruang kerja (workspace), dan undang kolaborator jika dibutuhkan.',
        tag: 'Setup Cepat',
      },
      {
        step: '02',
        title: 'Unggah Dokumen Anda',
        description:
          'Tarik dan lepas dokumen, modul materi, panduan, catatan, atau arsip pendukung ke dalam kategori yang sesuai.',
        tag: 'Drag & Drop',
      },
      {
        step: '03',
        title: 'AI Memproses & Mengindeks',
        description:
          'Mesin RAG otomatis memecah isi dokumen menjadi potongan semantik (chunking) dan membentuk vektor indeks pencarian super cepat.',
        tag: 'Otomatisasi RAG',
      },
      {
        step: '04',
        title: 'Mulai Bertanya & Dapatkan Jawaban',
        description:
          'Ketik pertanyaan seperti berbicara dengan asisten ahli. Dapatkan jawaban instan lengkap dengan kutipan halaman dokumen asli.',
        tag: 'Siap Pakai',
      },
    ],
  },

  pricing: {
    sectionBadge: 'Transparansi Biaya',
    title: 'Pilihan Paket Fleksibel untuk Segala Kebutuhan',
    subtitle:
      'Mulai dari penggunaan mandiri, tim kolaborasi, hingga organisasi skala besar. Hemat 20% dengan pembayaran tahunan.',
    discountBadge: 'Hemat 20% Pembayaran Tahunan',
    plans: [
      {
        id: 'starter',
        name: 'Starter',
        badge: 'Penggunaan Mandiri',
        description:
          'Pilihan tepat untuk individu, pelajar, atau profesional mandiri yang ingin kecepatan pencarian dokumen berbasis RAG.',
        monthlyPrice: 99000,
        annualPrice: 79000,
        currency: 'Rp',
        periodText: '/ bulan',
        isPopular: false,
        specs: {
          admins: '1 Pengelola',
          users: '5 Anggota',
          docs: '50 Dokumen',
          kbs: '1 Knowledge Base',
        },
        features: [
          '1 Akun Pengelola Utama',
          '5 Akun Anggota / Kolaborator',
          'Kapasitas hingga 50 Dokumen',
          '1 Knowledge Base Utama',
          'Format Dokumen PDF, DOCX, TXT',
          'Pencarian Semantik & RAG Standar',
          'Rujukan Halaman & Sumber Dokumen',
          'Dukungan Bantuan Email Standar',
        ],
        ctaText: 'Pilih Paket Starter',
        buttonVariant: 'outline',
      },
      {
        id: 'business',
        name: 'Pro',
        badge: 'Paling Populer',
        description: 'Solusi lengkap untuk tim riset, kelompok kerja, atau proyek aktif dengan banyak topik dokumen.',
        monthlyPrice: 299000,
        annualPrice: 239000,
        currency: 'Rp',
        periodText: '/ bulan',
        isPopular: true,
        specs: {
          admins: '3 Pengelola',
          users: '25 Anggota',
          docs: '500 Dokumen',
          kbs: '5 Knowledge Base',
        },
        features: [
          '3 Akun Pengelola',
          '25 Akun Anggota Aktif',
          'Kapasitas hingga 500 Dokumen',
          '5 Knowledge Base Terpisah (Riset, Materi, dll)',
          'Semua Format Dokumen (PDF, DOCX, TXT, CSV, MD)',
          'Prioritas Pemrosesan & Indexing Cepat',
          'Rujukan Halaman dengan Preview Dokumen',
          'Audit Log & Riwayat Pertanyaan Workspace',
          'Dukungan Prioritas Respons 4 Jam',
        ],
        ctaText: 'Pilih Paket Pro',
        buttonVariant: 'solid',
      },
      {
        id: 'enterprise',
        name: 'Custom',
        badge: 'Kapasitas Maksimal',
        description:
          'Kapasitas maksimal untuk organisasi atau komunitas besar dengan arsip tak terbatas dan kebutuhan integrasi khusus.',
        monthlyPrice: null,
        annualPrice: null,
        isCustomPrice: true,
        customPriceText: 'Hubungi Kami',
        periodText: 'Kustomisasi Kebutuhan',
        isPopular: false,
        specs: {
          admins: 'Pengelola Fleksibel',
          users: 'Anggota Fleksibel',
          docs: 'Dokumen Tak Terbatas',
          kbs: 'Multi-Workspace',
        },
        features: [
          'Jumlah Pengelola & Anggota Fleksibel',
          'Kapasitas Dokumen & Penyimpanan Tak Terbatas',
          'Knowledge Base Multi-Workspace Tanpa Batas',
          'Opsi Private Cloud / Penyimpanan Terisolasi',
          'SLA Ketersediaan 99.9% dengan Dukungan Penuh',
          'Kustomisasi Vector Embeddings & Fine-Tuning',
          'Integrasi REST API ke Sistem Eksternal',
          'Bantuan Pendampingan & Konsultasi 24/7',
        ],
        ctaText: 'Hubungi Tim Layanan',
        buttonVariant: 'outline',
      },
    ],
  },

  faqs: [
    {
      id: 'faq-1',
      question: 'Format dokumen apa saja yang didukung oleh sistem?',
      answer:
        'KnowBase AI mendukung berkas PDF (termasuk PDF hasil scan dengan teks terindeks), Microsoft Word (.docx, .doc), plain text (.txt), Markdown (.md), serta spreadsheet sederhana (.csv). Sistem kami mengekstrak teks, hierarki judul, dan tabel secara otomatis tanpa mengubah dokumen asli Anda.',
    },
    {
      id: 'faq-2',
      question: 'Bagaimana keamanan dan kerahasiaan dokumen saya?',
      answer:
        'Keamanan adalah prioritas mutlak kami. Data setiap pengguna diisolasi secara ketat dalam workspace terenkripsi (AES-256 saat tersimpan dan TLS 1.3 saat transmisi). Kami berkomitmen bahwa seluruh dokumen dan percakapan Anda tidak akan pernah dibagikan atau digunakan untuk melatih model AI publik.',
    },
    // SEMBUNYI SEMENTARA: FAQ seputar paket/langganan belum dipublikasikan
    // {
    //   id: 'faq-3',
    //   question: 'Bagaimana cara melakukan upgrade paket jika kebutuhan saya bertambah?',
    //   answer:
    //     'Anda dapat melakukan upgrade paket kapan saja langsung melalui menu pengaturan workspace. Seluruh data, riwayat dokumen, dan indeks yang sudah ada akan tetap utuh tanpa downtime. Perhitungan biaya akan disesuaikan secara prorata untuk periode yang sedang berjalan.',
    // },
    // {
    //   id: 'faq-4',
    //   question: 'Apakah ada batasan pengguna jika memilih paket Starter atau Pro?',
    //   answer:
    //     'Paket Starter mencakup 1 Pengelola dan hingga 5 Anggota, sedangkan paket Pro mencakup 3 Pengelola dan hingga 25 Anggota. Jika Anda membutuhkan slot tambahan, Anda dapat menambahkan kuota anggota dengan tarif add-on terjangkau.',
    // },
    // {
    //   id: 'faq-5',
    //   question: 'Bagaimana kebijakan pembatalan atau pergantian paket langganan?',
    //   answer:
    //     'Anda dapat membatalkan langganan kapan saja tanpa ikatan kontrak jangka panjang untuk paket bulanan. Setelah dibatalkan, akses workspace akan tetap aktif hingga akhir siklus penagihan yang telah dibayar. Kami juga menyediakan fasilitas ekspor data dokumen secara lengkap sebelum akun ditutup.',
    // },
  ],

  ctaSection: {
    badge: 'Mulai Sekarang',
    headline: 'Hentikan Pemborosan Waktu Mencari Informasi di Ratusan File',
    subheadline:
      'Bergabunglah dengan ribuan pengguna yang telah mempercayakan dokumen dan arsip pengetahuannya pada KnowBase AI. Setup mudah, aman, dan siap pakai.',
    primaryButton: 'Mulai dengan Paket Pilihan',
    secondaryButton: 'Pelajari Lebih Lanjut',
    footnote: 'Dukungan penuh berbahasa Indonesia · Keamanan data terenkripsi',
  },

  footer: {
    about:
      'KnowBase AI adalah platform sistem manajemen pengetahuan berbasis Retrieval-Augmented Generation (RAG) untuk mentransformasi dokumen, buku, modul, dan arsip menjadi asisten cerdas terverifikasi.',
    columns: [
      {
        title: 'Navigasi Produk',
        links: [
          { label: 'Solusi Praktis', href: '#solusi' },
          { label: 'Fitur Unggulan', href: '#fitur' },
          { label: 'Alur Cara Kerja', href: '#cara-kerja' },
          // SEMBUNYI SEMENTARA: link paket belum dipublikasikan
          // { label: 'Paket Harga', href: '#paket' },
        ],
      },
      {
        title: 'Dokumentasi & Bantuan',
        links: [
          { label: 'Pertanyaan Umum (FAQ)', href: '#faq' },
          { label: 'Panduan Format Dokumen', href: '#faq' },
          { label: 'Kebijakan Privasi Data', href: '#solusi' },
        ],
      },
      {
        title: 'Kontak & Dukungan',
        links: [
          { label: 'Email: halo@knowbase.id', href: 'mailto:halo@knowbase.id' },
          { label: 'Telepon: +62 21 5088 9200', href: 'tel:+622150889200' },
          // SEMBUNYI SEMENTARA: link paket belum dipublikasikan
          // { label: 'Konsultasi Layanan', href: '#paket' },
          { label: 'Bantuan: Senin - Jumat (09:00 - 18:00 WIB)', href: '#' },
        ],
      },
    ],
    copyright: '© 2026 KnowBase AI. Seluruh hak cipta dilindungi undang-undang. Platform RAG Knowledge Management.',
  },
};
