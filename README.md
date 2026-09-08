# MBG Digital - Model Triangulasi

Purwarupa sistem pengelolaan MBG Digital dengan model triangulasi
SPPG - Sekolah - Orangtua.

**Update timeline (per kesepakatan terbaru):** target sekarang adalah
**ujicoba internal**, bukan lagi pilot langsung ke SMAN 1 Garut -- itu
digeser ke 2027. Karena gak ada lagi tenggat pilot eksternal tahun ini,
seluruh fitur MVP + Fase 2 dikerjakan sekaligus dulu, baru QA menyeluruh
sekali di akhir sebelum ujicoba internal (bukan QA bertahap per modul
kayak sebelumnya).

Dokumen konsep & teknis lengkap ada di project Claude "MBG Digital Prof Elly"
(Konsep-Sistem-MBG-Digital-Triangulasi.docx & Dokumen-Teknis-MBG-Digital.docx).
Wireframe/prototype UX per peran MVP (sudah di-approve Prof Elly): lihat
artifact "Wireframe MBG Digital". Fitur Fase 2 (Suara Anak/CVI, Rating,
Pengaduan, Dashboard Publik) dikerjakan langsung dari dokumen + kesepakatan
chat, TANPA wireframe terpisah -- keputusan sadar buat ngejar kecepatan,
jadi UI-nya seadanya/fungsional dan wajar kalau perlu dirapikan pas QA.

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

# Kalau kamu lagi update dari clone/pull sebelumnya dan schema.prisma berubah
# (mis. abis nambah entitas Fase 2), jalanin ulang 2 baris di atas
# (generate + db push) biar Prisma Client & database-nya sinkron.

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
    sppg/          # portal SPPG - unggah menu, distribusi, lihat rating & pengaduan masuk
    sekolah/       # portal Sekolah - konfirmasi, rating, pengaduan, titik lokasi geo-fence
    orangtua/      # dashboard Orangtua - konfirmasi anak, rating, pengaduan
    dinas/         # dashboard Dinas/Admin - flag triangulasi, lokasi sekolah, pengaduan,
                   # feedback Suara Anak (CVI)
    suara-anak/    # PUBLIK, tanpa login - form Child Voice Interface (Fase 2, QR)
    transparansi/  # PUBLIK, tanpa login - dashboard transparansi agregat (Fase 2)
    api/
      auth/[...nextauth]/   # route handler Auth.js
      sppg/menu, sppg/distribusi, sppg/rating, sppg/pengaduan
      sekolah/distribusi, sekolah/konfirmasi, sekolah/komplain, sekolah/pesan-harian,
      sekolah/lokasi, sekolah/rating, sekolah/pengaduan
      orangtua/menu-hari-ini, orangtua/konfirmasi, orangtua/rating, orangtua/pengaduan
      dinas/flags, dinas/flags/[id], dinas/sekolah, dinas/sekolah/[id]/lokasi,
      dinas/pengaduan, dinas/pengaduan/[id], dinas/feedback-anak
      anak/feedback   # PUBLIK -- submit Child Voice Interface
      publik/stats    # PUBLIK -- angka agregat dashboard transparansi
  components/      # client component per dashboard peran + widget lintas-peran
                   # (RatingWidget, PengaduanPanel, dll) + session provider
  auth.ts          # config Auth.js lengkap (Credentials provider + Prisma)
  auth.config.ts   # config edge-safe dipakai proxy.ts (tanpa Prisma) -- termasuk
                   # daftar route publik (suara-anak, transparansi, & API publiknya)
  proxy.ts         # proteksi route (Next.js 16 -- pengganti middleware.ts): redirect ke /login
  lib/
    prisma.ts        # Prisma Client singleton
    storage.ts        # upload foto ke Supabase Storage
    auth-helpers.ts    # requireRole() -- guard role per halaman server component
    triangulasi.ts     # job pembanding 3 laporan -- lihat "Job triangulasi" di bawah
    geo.ts             # haversine + radius geo-fence -- dipakai Child Voice Interface
  types/next-auth.d.ts  # augmentasi tipe role & id di Session/JWT
prisma/
  schema.prisma    # skema DB -- MVP (Bagian 5 Dokumen Teknis) + Fase 2 (Bagian 11.2)
  seed.ts          # data awal: 1 SPPG, 1 Sekolah, 1 Orangtua+Siswa, 1 Dinas
```

Skema Prisma sekarang mencakup MVP (users, sppg, sekolah, siswa, orangtua,
menu_harian, distribusi, konfirmasi_orangtua, flag_triangulasi) DAN Fase 2
(feedback_anak, rating, pengaduan) -- lihat komentar di tiap model di
`schema.prisma` buat rujukan bagian dokumen & keputusan implementasi
masing-masing.

Field `distribusi.catatan` dipakai buat komplain ringkas sekolah -> SPPG per
distribusi (status `bermasalah`). Ini beda dari entitas `pengaduan` (Fase 2)
yang jadi sistem pengaduan trackable penuh (Bagian 6.5) dengan status
diterima/ditindaklanjuti/selesai dan bisa dari sekolah maupun orangtua.

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

Fitur Fase 2 yang bisa langsung dites juga:

5. Buka `/suara-anak` (gak perlu login) -> masukin NIS/NISN siswa seed
   (`1234567890`, Bilqis) -> isi feedback emoji -> kirim. Coba isi 2x buat
   lihat pesan "udah ngisi hari ini".
6. Buka `/transparansi` (gak perlu login) -> lihat angka agregat.
7. Di dashboard Sekolah/Orangtua, coba widget "Kasih rating" & panel
   "Pengaduan" -> cek hasilnya muncul di dashboard SPPG (rating: agregat aja;
   pengaduan: baca-saja) dan di dashboard Dinas (panel "Kelola Pengaduan").
8. Di dashboard Sekolah, set "Titik Lokasi Sekolah" dulu (perlu izin lokasi
   browser) sebelum coba `/suara-anak` dari device yang sama, biar
   `lokasiTerverifikasi` bisa kebaca `true` (radius 10m).

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

## Fase 2

Semua item Fase 2 (Bagian 11.2 roadmap) udah dibangun. Detail per fitur:

### Child Voice Interface / Suara Anak (Bagian 6.7, 3.3)

Form publik di `/suara-anak` -- tanpa login, dimaksudkan diakses lewat QR yang
ditempel di area makan siswa (QR-nya sendiri belum dibikin/dicetak, itu
kerjaan operasional, bukan bagian dari app ini). Alurnya: anak masukin
NIS/NISN, jawab 2 pertanyaan emoji (suka/gak suka, habis/gak habis), opsional
catatan perbaikan, kirim.

Keputusan yang udah DISEPAKATI bareng user (beda dari draf awal dokumen):
- **Consent** data anak diurus terpisah di level deployment/operasional --
  di luar scope frontend/backend aplikasi ini.
- **NIS/NISN** cuma dipakai server-side buat (1) cari siswa yang sesuai dan
  (2) cegah 1 anak ngisi 2x per hari (`@@unique([distribusiId, siswaId])` di
  `FeedbackAnak`). Identitas siswa (nama & NIS/NISN) di balik tiap entri
  feedback CUMA ditampilkan ke role **admin** di dashboard Dinas -- role
  **dinas** biasa lihat entrinya teranonimkan (lihat
  `src/app/api/dinas/feedback-anak/route.ts`).
- **Radius geo-fence: 10 meter** (bukan ±100-150m di draf dokumen awal), dari
  titik acuan yang di-set sekolah sendiri (kartu "Titik Lokasi Sekolah" di
  dashboard Sekolah) dan/atau dikoreksi Dinas/Admin (panel "Kelola Titik
  Lokasi Sekolah" di dashboard Dinas). Kalau lokasi gak match/GPS
  ditolak/lemah, submission TETAP disimpan (`lokasiTerverifikasi: false`)
  buat ditinjau manual -- bukan ditolak otomatis, sesuai Bagian 3.3 Dok
  Teknis.

**Belum dikerjakan/known gap:** feedback CVI belum diikutsertakan ke job
`checkTriangulasi()` sebagai sumber tambahan (Bagian 6.2 nyebut ini
seharusnya jadi sumber triangulasi juga) -- saat ini cuma tampil terpisah di
dashboard Dinas, belum otomatis mempengaruhi flag. Perlu keputusan lanjutan
soal cara agregasinya (per sekolah/per menu?) sebelum diintegrasikan.

### Rating (Bagian 6.4)

Sekolah & Orangtua bisa ngasih skor 1-5 + catatan opsional ke SPPG mereka
kapan aja (widget `RatingWidget` di dashboard masing-masing). SPPG cuma
lihat HASIL agregat (rata-rata & jumlah) di dashboard-nya sendiri, gak lihat
siapa yang ngasih rating apa -- jaga anonimitas rater sesuai matriks peran
Bagian 4.

**Penyederhanaan MVP (judgment call, belum dirinci di dokumen):** dokumen
bilang rating "berkala" tapi gak nentuin intervalnya -- di sini rater bisa
ngirim kapan aja tanpa pembatasan frekuensi (mis. sekali per minggu). Kalau
mau lebih ketat, perlu ditambah validasi tanggal terakhir submit per rater.

### Pengaduan (Bagian 6.5)

Kanal pengaduan trackable penuh (`diterima -> ditindaklanjuti -> selesai`),
beda dari `distribusi.catatan` (komplain ringkas 1-distribusi, MVP). Sekolah
& Orangtua bisa ajukan (opsional terkait 1 distribusi tertentu), SPPG baca
yang terkait dirinya, Dinas kelola status semua pengaduan (panel "Kelola
Pengaduan" di dashboard Dinas).

### Dashboard Publik / Transparansi (Bagian 6.6)

Halaman publik di `/transparansi` -- tanpa login, cuma angka agregat (jumlah
SPPG aktif, jumlah sekolah, % konsistensi pelaporan sekolah, % partisipasi
orangtua, rata-rata rating). TIDAK ADA data individual/PII.

**Penyederhanaan MVP:** "partisipasi orangtua" dihitung sebagai proporsi
siswa terdaftar yang orangtuanya PERNAH ngirim minimal 1 konfirmasi
(bukan per-hari) -- metrik yang lebih presisi (mis. partisipasi harian/
mingguan) bisa disusun kalau dibutuhkan setelah lihat data riil dari
ujicoba internal.

## Belum dikerjakan (langkah berikutnya)

- Proteksi role per halaman sudah ada (`requireRole()`), tapi belum ada
  halaman "tidak diizinkan" yang jelas -- sekarang cuma redirect diam-diam.
- Ambang batas & aturan job triangulasi masih judgment call MVP -- perlu
  dievaluasi ulang bareng Prof Elly/tim Dinas begitu ujicoba internal jalan
  (mis. apa 20%/minimal 3 konfirmasi udah pas, atau perlu jenis flag
  tambahan seperti "foto bukti gak sesuai jadwal" yang ada di wireframe
  awal tapi belum diimplementasi).
- Feedback Suara Anak (CVI) belum masuk ke job triangulasi otomatis (lihat
  catatan di bagian Fase 2 di atas).
- Fitur Fase 2 dibangun tanpa wireframe (keputusan sadar demi kecepatan,
  lihat catatan di bagian atas) -- UI-nya fungsional tapi seadanya,
  kemungkinan perlu dirapikan pas QA menyeluruh sebelum ujicoba internal.
- QA menyeluruh (Fase 6 roadmap: unit/E2E testing, review UX Fase 2, cek
  keamanan endpoint publik `/api/anak/feedback` & `/api/publik/stats`
  terhadap abuse/rate-limit) -- belum dikerjakan, ini langkah berikutnya
  yang disepakati (Fase 2 dulu, QA sekali di akhir).
