# KnowBase - Knowledge Management System (KMS BUMD)

Platform pengelolaan dokumen & basis pengetahuan multi-tenant: frontend React/Vite,
backend Express + MySQL, penyimpanan berkas di Kroombox Edge CDN, dan pencarian
semantik lewat server RAG.

## Arsitektur singkat

| Bagian | Teknologi | Catatan |
| --- | --- | --- |
| Frontend | React 19 + Vite + Tailwind 4 | build ke `dist/` |
| Backend | Express + `tsx server/index.ts` | API di `/api/*` |
| Database | MySQL (`kms_bumd`) | tabel dibuat otomatis saat start |
| Berkas | Kroombox Edge CDN | MySQL hanya menyimpan metadata |
| Pencarian AI | Server RAG (`RAG_BASE_URL`) | key master + key per project |

## Menjalankan lokal

```bash
npm ci
cp .env.example .env      # lalu isi nilainya
npm run server            # backend  (default http://localhost:5000)
npm run dev               # frontend (http://localhost:3000)
```

`npm run lint` menjalankan `tsc --noEmit` (type-check). Tidak ada test otomatis di repo ini.

## Deploy produksi (ringkas)

```bash
git pull --ff-only
npm ci                    # hanya bila package.json / package-lock.json berubah
npm run build             # menghasilkan dist/
pm2 restart <nama-app> --update-env
pm2 save
```

Contoh konfigurasi nginx (vhost saja, TLS diterminasi reverse proxy/Cloudflare):

```nginx
server {
  listen 80;
  server_name kms.contoh.id;
  root /path/ke/proyek/dist;
  index index.html;
  client_max_body_size 50m;

  location /api/    { proxy_pass http://127.0.0.1:5000; proxy_set_header Host $host; }
  location /uploads/{ proxy_pass http://127.0.0.1:5000; proxy_set_header Host $host; }
  location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }
  location /        { try_files $uri $uri/ /index.html; }
}
```

## Environment penting

Semua variabel ada di `.env.example`. Yang paling sering salah:

- `RAG_API_KEY` - kunci operator server RAG. Bila kosong, indeks dokumen ditolak 401.
- `KROOMBOX_*` - **wajib** diisi dengan project CDN milik sendiri; bila kosong aplikasi
  memakai kredensial default di kode sehingga berkas project lain ikut terlihat.
- `JWT_SECRET` dan `DEMO_PASSWORD` - wajib diganti sebelum dipublikasikan.
- `GOOGLE_*` + `GMAIL_SENDER` - untuk email fitur lupa sandi. Setelah mengisi client
  id/secret, buka `/api/auth/google/connect` sekali sebagai admin untuk menyimpan refresh token.

## Fitur

- Multi-project (organisasi) dengan isolasi knowledge base per project
- Unggah multi-berkas (dokumen & foto) ke CDN, pratinjau, unduh langsung dari CDN
- Indeks otomatis ke server RAG + sinkronisasi ulang manual
- Manajemen pengguna, permintaan bergabung, log aktivitas, monitoring CDN
- Lupa sandi: token sekali pakai (kedaluwarsa 60 menit) + email via Gmail API
