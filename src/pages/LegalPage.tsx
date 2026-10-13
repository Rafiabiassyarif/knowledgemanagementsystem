import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../landing/Navbar';
import Footer from '../landing/Footer';
import { FileText, ShieldCheck, ArrowLeft, Mail } from 'lucide-react';
import '../landing/landing.css';

export type LegalKind = 'terms' | 'privacy';

interface Section {
  heading: string;
  body: string[];
}

const CONTENT: Record<LegalKind, {
  badge: string;
  title: string;
  updated: string;
  intro: string;
  sections: Section[];
}> = {
  terms: {
    badge: 'Ketentuan Layanan',
    title: 'Ketentuan Layanan KnowBase AI',
    updated: 'Terakhir diperbarui: 12 Oktober 2026',
    intro:
      'Dengan membuat akun dan menggunakan platform KnowBase AI, Anda menyetujui ketentuan berikut. Harap dibaca sebelum menggunakan layanan.',
    sections: [
      {
        heading: '1. Definisi Layanan',
        body: [
          'KnowBase AI adalah platform manajemen pengetahuan (Knowledge Management System) berbasis Retrieval-Augmented Generation (RAG) yang memungkinkan pengguna menyimpan, mengelola, dan menelusuri dokumen serta menanyakan isinya melalui kecerdasan buatan.',
        ],
      },
      {
        heading: '2. Akun dan Tanggung Jawab Pengguna',
        body: [
          'Anda bertanggung jawab menjaga kerahasiaan kredensial akun (kata sandi, API key, maupun token akses) dan atas seluruh aktivitas yang terjadi melalui akun Anda.',
          'Anda wajib menggunakan layanan secara sah dan tidak mengunggah konten yang melanggar hukum, hak kekayaan intelektual pihak lain, atau bersifat menyesatkan.',
          'Kunci API yang diterbitkan bersifat rahasia. Jika diduga bocor, segera cabut melalui menu pengaturan API key.',
        ],
      },
      {
        heading: '3. Kepemilikan dan Isolasi Data',
        body: [
          'Dokumen yang Anda unggah tetap menjadi milik Anda. Kami tidak mengklaim kepemilikan atas isi dokumen Anda.',
          'Setiap project terisolasi: akun dengan peran pengguna hanya dapat mengakses data project yang terkait dengan akunnya. Peran admin memiliki akses lintas project untuk keperluan tata kelola.',
          'Dokumen Anda tidak digunakan untuk melatih model AI publik.',
        ],
      },
      {
        heading: '4. Batasan Penggunaan',
        body: [
          'Ukuran maksimum satu berkas yang dapat diunggah adalah 50 MB.',
          'Jumlah project dan dokumen tidak dibatasi per akun, namun penggunaan yang berlebihan atau bersifat menyalahgunakan dapat dibatasi untuk menjaga kestabilan layanan.',
          'Percobaan masuk dibatasi untuk mencegah penyalahgunaan akses.',
        ],
      },
      {
        heading: '5. Ketersediaan Layanan',
        body: [
          'Kami berupaya menjaga ketersediaan layanan, namun tidak menjamin layanan bebas dari gangguan teknis sepenuhnya. Pemeliharaan terjadwal akan diinformasikan bila memungkinkan.',
        ],
      },
      {
        heading: '6. Perubahan Ketentuan',
        body: [
          'Ketentuan ini dapat diperbarui sewaktu-waktu. Perubahan berlaku sejak dipublikasikan pada halaman ini.',
        ],
      },
    ],
  },
  privacy: {
    badge: 'Kebijakan Privasi',
    title: 'Kebijakan Privasi KnowBase AI',
    updated: 'Terakhir diperbarui: 12 Oktober 2026',
    intro:
      'Kebijakan ini menjelaskan bagaimana KnowBase AI mengumpulkan, menggunakan, dan melindungi data Anda.',
    sections: [
      {
        heading: '1. Data yang Kami Simpan',
        body: [
          'Data akun: nama, alamat email, peran, dan organisasi/project yang terkait.',
          'Metadata dokumen: judul, kategori, ukuran berkas, dan waktu unggah. Berkas fisik dokumen disimpan pada layanan penyimpanan (Edge CDN), bukan di dalam basis data aplikasi.',
          'Log aktivitas: catatan tindakan seperti unggah, lihat, unduh, dan ubah dokumen, untuk keperluan audit.',
        ],
      },
      {
        heading: '2. Penggunaan Data',
        body: [
          'Data digunakan untuk menjalankan layanan: autentikasi, pengelolaan dokumen, pencarian, dan tanya jawab berbasis AI atas dokumen Anda.',
          'Kami tidak menjual data Anda kepada pihak ketiga.',
          'Dokumen Anda tidak digunakan untuk melatih model AI publik.',
        ],
      },
      {
        heading: '3. Isolasi dan Kontrol Akses',
        body: [
          'Data dipisahkan per project. Akun dengan peran pengguna hanya dapat mengakses data project miliknya; peran admin memiliki akses lintas project untuk tata kelola.',
          'Setiap permintaan ke API wajib menyertakan autentikasi (token sesi atau API key). Permintaan tanpa autentikasi yang sah akan ditolak.',
        ],
      },
      {
        heading: '4. Keamanan',
        body: [
          'Kata sandi disimpan dalam bentuk hash (bcrypt) dan tidak pernah dalam bentuk teks asli.',
          'Kunci API disimpan dalam bentuk hash (SHA-256) dan dapat dicabut kapan saja.',
          'Seluruh komunikasi dengan layanan dilakukan melalui koneksi terenkripsi TLS.',
        ],
      },
      {
        heading: '5. Hak Anda',
        body: [
          'Anda dapat memperbarui data profil, mengganti kata sandi, mencabut API key, dan menghapus dokumen melalui aplikasi.',
          'Untuk permintaan penghapusan akun atau pertanyaan terkait privasi, hubungi kami melalui email yang tercantum di bawah.',
        ],
      },
      {
        heading: '6. Perubahan Kebijakan',
        body: [
          'Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan berlaku sejak dipublikasikan pada halaman ini.',
        ],
      },
    ],
  },
};

export const LegalPage: React.FC<{ kind: LegalKind }> = ({ kind }) => {
  const navigate = useNavigate();
  const data = CONTENT[kind];
  const other: LegalKind = kind === 'terms' ? 'privacy' : 'terms';
  const Icon = kind === 'terms' ? FileText : ShieldCheck;

  return (
    <div className="landing-root min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 lg:px-12 py-14 sm:py-20">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-mono">
              {data.badge}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {data.title}
          </h1>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 font-mono">{data.updated}</p>
          <p className="mt-5 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            {data.intro}
          </p>

          <div className="mt-10 space-y-8">
            {data.sections.map((s) => (
              <section key={s.heading}>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2.5">
                  {s.heading}
                </h2>
                <div className="space-y-2.5">
                  {s.body.map((p, i) => (
                    <p key={i} className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Pertanyaan seputar dokumen ini:</span>
              <a href="mailto:halo@knowbase.id" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                halo@knowbase.id
              </a>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Lihat juga:{' '}
              <Link
                to={other === 'terms' ? '/ketentuan' : '/kebijakan-privasi'}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {CONTENT[other].badge}
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LegalPage;
