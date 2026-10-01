# KMS BUMD — Knowledge Management System

Platform Knowledge Management untuk BUMD: kelola dokumen & knowledge per project (organisasi), lengkap dengan asisten AI berbasis **RAG (Retrieval-Augmented Generation)** yang menjawab dari dokumen resmi disertai rujukan sumber, plus render multi-dokumen (foto/file/dokumen) langsung di chat.

## Arsitektur

| Komponen | Teknologi |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind (port 3000) |
| Backend | Express + MySQL (Laragon, port 5000) |
| Berkas fisik | Kroombox Edge CDN (MySQL hanya menyimpan metadata) |
| Knowledge AI | Multi-Tenant RAG & Jev AI (`https://rag.aiones.app`) |
| Auth | JWT + bcrypt, guard `requireAuth`/`requireRole` |

Alur utama: user membuat project → otomatis dibuatkan API key RAG khusus project → upload multi-dokumen (PDF/Word/Excel/foto/teks) tersimpan ke CDN & di-ingest ke knowledge base RAG project → pengguna bertanya lewat chat AI, jawaban grounded + lampiran CDN dirender di chat.

## Menjalankan Lokal

**Prasyarat:** Node.js 18+, MySQL (Laragon).

1. Install dependencies:
   ```bash
   npm install
   ```
2. Salin `.env.example` menjadi `.env`, lalu isi:
   - `DB_*` — kredensial MySQL lokal
   - `JWT_SECRET` — secret acak yang kuat
   - `RAG_BASE_URL` & `RAG_API_KEY` — layanan RAG (bisa diminta ke admin)
   - `KROOMBOX_*` — kredensial Kroombox Edge CDN
3. Jalankan backend + frontend:
   ```bash
   npm run server   # backend (tsx watch, port 5000)
   npm run dev      # frontend (Vite, port 3000)
   ```

> Catatan: tidak ada `GEMINI_API_KEY` atau key AI pihak ketiga lain yang dibutuhkan — seluruh fitur AI berjalan lewat layanan RAG internal.

## Skrip

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Frontend Vite (dev) |
| `npm run server` | Backend Express (tsx watch) |
| `npm run lint` | Typecheck TypeScript (`tsc --noEmit`) |
| `npm run build` | Build produksi frontend |

## Akun Demo (development)

Dibuat otomatis saat seeding, password `password123`:
- `superadmin@kms.id` — superadmin
- `admin@kms.id` — admin organisasi demo
- `user@kms.id` — user biasa
