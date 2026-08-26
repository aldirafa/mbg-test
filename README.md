# MBG Digital - Model Triangulasi

Purwarupa sistem pengelolaan MBG Digital dengan model triangulasi
SPPG - Sekolah - Orangtua, untuk pilot di SMAN 1 Garut.

Dokumen konsep & teknis lengkap ada di project Claude "MBG Digital Prof Elly"
(Konsep-Sistem-MBG-Digital-Triangulasi.docx & Dokumen-Teknis-MBG-Digital.docx).

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
- Prisma ORM + PostgreSQL (rencana: Supabase atau Neon)
- Auth.js v5 (NextAuth) - Credentials provider, JWT session, role-based (sppg/sekolah/orangtua/dinas/admin)

## Setup

```bash
npm install

cp .env.example .env
# isi DATABASE_URL (connection string Supabase/Neon) dan AUTH_SECRET
# generate AUTH_SECRET: openssl rand -base64 32

npx prisma generate
npx prisma db push   # sinkronkan skema ke database (dev awal, sebelum pakai migrate)

npm run dev
```

Buka http://localhost:3000

### Catatan penting soal `npx prisma generate`

Kalau kamu menjalankan step-step di atas lewat sesi Claude/Cowork (bukan
langsung di Terminal Mac kamu), `prisma generate` akan gagal dengan error
`403 Forbidden` saat fetch `binaries.prisma.sh`. Itu bukan bug di skema —
sandbox yang dipakai Claude untuk menyentuh file kamu cuma boleh akses
registry npm, bukan domain lain seperti binaries.prisma.sh atau bun.sh.
Laptop kamu sendiri tidak punya batasan itu, jadi tinggal jalankan
`npx prisma generate` (dan `npm run build`/`npm run dev`) langsung di
Terminal biasa, bukan lewat bridge.

## Struktur folder

```
src/
  app/
    login/        # halaman login (semua peran)
    sppg/          # portal SPPG - unggah menu & distribusi
    sekolah/       # portal Sekolah - konfirmasi & pesan siap-bagi
    orangtua/      # dashboard Orangtua - kanal partisipasi utama
    dinas/         # dashboard Dinas/Admin - flag triangulasi
    api/auth/[...nextauth]/  # route handler Auth.js
  auth.ts          # config Auth.js lengkap (Credentials provider + Prisma)
  auth.config.ts   # config edge-safe dipakai middleware (tanpa Prisma)
  middleware.ts    # proteksi route: redirect ke /login kalau belum masuk
  lib/prisma.ts    # Prisma Client singleton
  types/next-auth.d.ts  # augmentasi tipe role & id di Session/JWT
prisma/
  schema.prisma    # skema DB cakupan MVP (Bagian 5 Dokumen Teknis)
```

Skema Prisma saat ini mencakup entitas MVP saja (users, sppg, sekolah,
siswa, orangtua, menu_harian, distribusi, konfirmasi_orangtua,
flag_triangulasi). Entitas Fase 2 (feedback_anak, rating, pengaduan)
sengaja belum ditambahkan — menyusul sesuai roadmap Bagian 11.2 Dokumen
Teknis, setelah pilot MVP berjalan.

## Belum dikerjakan (langkah berikutnya)

- Setup project Supabase/Neon & isi `DATABASE_URL`
- `npx prisma db push` pertama kali (bikin tabel di database)
- Seed user awal per role (SPPG, Sekolah, Orangtua, Dinas/Admin) untuk testing login
- Wireframe / UX per peran (belum ada di dokumen — lihat Concept Note Bagian 8)
- Implementasi fitur per fase sesuai roadmap (Bagian 11.1 Dokumen Teknis):
  Modul SPPG -> Modul Sekolah -> Modul Orangtua -> Job Triangulasi -> Testing & Deploy
