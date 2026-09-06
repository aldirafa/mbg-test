# MBG Digital - Model Triangulasi

Purwarupa sistem pengelolaan MBG Digital dengan model triangulasi
SPPG - Sekolah - Orangtua, untuk pilot di SMAN 1 Garut.

Dokumen konsep & teknis lengkap ada di project Claude "MBG Digital Prof Elly"
(Konsep-Sistem-MBG-Digital-Triangulasi.docx & Dokumen-Teknis-MBG-Digital.docx).
Wireframe/prototype UX per peran (sudah di-approve Prof Elly): lihat artifact
"Wireframe MBG Digital".

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
- Prisma ORM + PostgreSQL (Supabase)
- Auth.js v5 (NextAuth) - Credentials provider, JWT session, role-based (sppg/sekolah/orangtua/dinas/admin)
- Supabase Storage - foto menu/distribusi

## Setup

```bash
npm install

cp .env.example .env
# isi semua nilai di .env (lihat penjelasan tiap variabel di .env.example):
# - DATABASE_URL: connection string Supabase (pakai Session Pooler kalau direct connection
#   gak bisa diakses -- laptop tanpa IPv6 keluar sering kena ini)
# - AUTH_SECRET: generate dengan `openssl rand -base64 32`
# - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET: lihat bagian
#   "Setup Supabase Storage" di bawah

npx prisma generate
npx prisma db push   # sinkronkan skema ke database (dev awal, sebelum pakai migrate)
npm run db:seed      # bikin akun awal per role, lihat output terminal buat kredensialnya

npm run dev
```

Buka http://localhost:3000, login pakai salah satu akun hasil `npm run db:seed`.

### Setup Supabase Storage (buat upload foto)

1. Buka project Supabase kamu -> **Storage** (sidebar kiri) -> **New bucket**
2. Nama bucket: `mbg-photos`, centang **Public bucket** (biar foto bisa diakses lewat URL langsung -- cukup buat pilot, non-data sensitif)
3. Ambil kredensial dari **Project Settings -> API**:
   - `Project URL` -> isi ke `SUPABASE_URL`
   - `service_role` key (bagian "Project API keys", BUKAN yang `anon`/`public`) -> isi ke `SUPABASE_SERVICE_ROLE_KEY`
4. `SUPABASE_STORAGE_BUCKET` isi `mbg-photos` (atau nama bucket yang kamu pakai)

`service_role` key itu punya akses penuh ke database & storage -- jangan pernah dipakai di kode
sisi client, cuma dipakai di API route server-side (`src/lib/storage.ts` sudah begitu).

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
    login/         # form login (semua peran)
    sppg/          # portal SPPG - unggah menu & distribusi
    sekolah/       # portal Sekolah - konfirmasi & pesan siap-bagi
    orangtua/      # dashboard Orangtua - konfirmasi anak menerima makan
    dinas/         # dashboard Dinas/Admin - lihat & tindak lanjuti flag triangulasi
    api/
      auth/[...nextauth]/   # route handler Auth.js
      sppg/menu, sppg/distribusi
      sekolah/distribusi, sekolah/konfirmasi, sekolah/komplain, sekolah/pesan-harian
      orangtua/menu-hari-ini, orangtua/konfirmasi
      dinas/flags, dinas/flags/[id]
  components/      # client component per dashboard peran + session provider
  auth.ts          # config Auth.js lengkap (Credentials provider + Prisma)
  auth.config.ts   # config edge-safe dipakai proxy.ts (tanpa Prisma)
  proxy.ts         # proteksi route (Next.js 16 -- pengganti middleware.ts): redirect ke /login
  lib/
    prisma.ts        # Prisma Client singleton
    storage.ts        # upload foto ke Supabase Storage
    auth-helpers.ts    # requireRole() -- guard role per halaman server component
    triangulasi.ts     # job pembanding 3 laporan -- lihat "Job triangulasi" di bawah
  types/next-auth.d.ts  # augmentasi tipe role & id di Session/JWT
prisma/
  schema.prisma    # skema DB cakupan MVP (Bagian 5 Dokumen Teknis)
  seed.ts          # data awal: 1 SPPG, 1 Sekolah, 1 Orangtua+Siswa, 1 Dinas
```

Skema Prisma saat ini mencakup entitas MVP saja (users, sppg, sekolah,
siswa, orangtua, menu_harian, distribusi, konfirmasi_orangtua,
flag_triangulasi). Entitas Fase 2 (feedback_anak, rating, pengaduan)
sengaja belum ditambahkan — menyusul sesuai roadmap Bagian 11.2 Dokumen
Teknis, setelah pilot MVP berjalan.

Field `distribusi.catatan` dipakai buat komplain ringkas sekolah -> SPPG per
distribusi (status `bermasalah`). Ini beda dari entitas `pengaduan` (Fase 2)
yang jadi sistem pengaduan trackable penuh (Bagian 6.5) dengan status
diterima/ditindaklanjuti/selesai dan bisa dari orangtua juga.

## Alur yang sudah bisa dites end-to-end

1. Login sebagai SPPG (`sppg@mbgdigital.test`) -> unggah menu + foto -> otomatis
   terdistribusi ke semua sekolah yang terhubung ke SPPG itu.
2. Login sebagai Sekolah (`sekolah@mbgdigital.test`) -> konfirmasi terima ->
   generate pesan siap-bagi (buat di-copy ke WA) -- atau ajukan komplain kalau
   ada masalah.
3. Login sebagai Orangtua (`orangtua@mbgdigital.test`) -> lihat menu hari ini
   anaknya -> konfirmasi anak menerima makan atau lapor masalah.
4. Login sebagai Dinas (`dinas@mbgdigital.test`) -> lihat daftar flag
   triangulasi (kalau ada), filter per status, klik buat lihat detail &
   tandai ditindaklanjuti/selesai. Buat munculin flag: ajukan komplain
   sebagai Sekolah, atau bikin >=3 akun Orangtua konfirmasi "tidak
   diterima"/"ada masalah" pada distribusi yang sama (lihat "Job
   triangulasi" di bawah buat aturan lengkapnya).

Password semua akun seed sama, dicetak di terminal setelah `npm run db:seed`.

## Job triangulasi (Fase 5)

Inti pembeda sistem ini (Bagian 4 & 6.2 Concept Note, Bagian 5.4/6.2 Dokumen
Teknis): bandingkan laporan SPPG, Sekolah & Orangtua, lalu tandai kasus yang
gak sinkron ke `flag_triangulasi` buat ditindaklanjuti Dinas.

Diimplementasikan sebagai **write-time trigger** (`src/lib/triangulasi.ts`,
fungsi `checkTriangulasi()`) -- dipanggil langsung tiap ada laporan baru yang
relevan, bukan cron terjadwal. Dipanggil dari dua tempat:

- `POST /api/sekolah/komplain` (sekolah ajukan komplain)
- `POST /api/orangtua/konfirmasi` (orangtua konfirmasi/lapor masalah)

Dua aturan MVP saat ini (disepakati bareng user, detail ambang batas belum
dirinci di dokumen konsep/teknis -- ini keputusan implementasi):

1. **Komplain sekolah** -- begitu sekolah menandai distribusi `bermasalah`
   (lewat form komplain), langsung dibikin flag jenis "Komplain kualitas
   dari sekolah".
2. **Selisih laporan orangtua** -- kalau >=20% dari orangtua yang SUDAH
   konfirmasi (bukan dari total siswa terdaftar) bilang "tidak
   diterima"/"ada masalah" utk 1 distribusi yang sama, dibikin flag jenis
   "Selisih laporan penerimaan". Syarat minimal 3 konfirmasi dulu sebelum
   aturan ini dicek, supaya 1 laporan tunggal (1/1 = 100%) belum langsung
   nge-flag saat data masih sangat sedikit.

Flag yang statusnya masih "terbuka" akan diperbarui detailnya kalau job
jalan lagi (mis. jumlah laporan bertambah), tapi flag yang udah
"ditindaklanjuti"/"selesai" gak diutak-atik lagi -- biar kerjaan Dinas yang
udah jalan gak kereset.

Dashboard Dinas (`/dinas`) menampilkan semua flag, bisa difilter per status,
dan Dinas bisa majuin status flag terbuka -> ditindaklanjuti -> selesai
(linear, belum ada tombol mundur di MVP ini).

## Belum dikerjakan (langkah berikutnya)

- Proteksi role per halaman sudah ada (`requireRole()`), tapi belum ada
  halaman "tidak diizinkan" yang jelas -- sekarang cuma redirect diam-diam.
- Ambang batas & aturan job triangulasi di atas masih judgment call MVP --
  perlu dievaluasi ulang bareng Prof Elly/tim Dinas begitu pilot jalan
  (mis. apa 20%/minimal 3 konfirmasi udah pas, atau perlu jenis flag
  tambahan seperti "foto bukti gak sesuai jadwal" yang ada di wireframe
  awal tapi belum diimplementasi).
- Fase 2 (Bagian 11.2): rating SPPG, kanal pengaduan trackable, dashboard
  transparansi publik, Child Voice Interface -- menyusul setelah pilot MVP
  jalan.
