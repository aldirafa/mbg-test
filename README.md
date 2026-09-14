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
   lihat pesan "udah ngisi hari ini". Kalau diisi catatan perbaikan, cek
   dashboard Dinas -> flag baru jenis "Catatan dari anak (CVI)" langsung
   muncul.
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
relevan, bukan cron terjadwal. Dipanggil dari tiga tempat:

- `POST /api/sekolah/komplain` (sekolah ajukan komplain)
- `POST /api/orangtua/konfirmasi` (orangtua konfirmasi/lapor masalah)
- `POST /api/anak/feedback` (anak submit Suara Anak/CVI)

Empat aturan saat ini (disepakati bareng user secara bertahap, detail
ambang batas belum dirinci di dokumen konsep/teknis -- ini keputusan
implementasi):

1. **Komplain sekolah** -- begitu sekolah menandai distribusi `bermasalah`
   (lewat form komplain), langsung dibikin flag jenis "Komplain kualitas
   dari sekolah".
2. **Selisih laporan penerimaan/porsi** -- gabungan sinyal dari Orangtua
   ("tidak_diterima"/"ada_masalah") DAN anak/CVI ("gak habis"), dihitung
   dalam 1 rasio yang sama karena keduanya indikasi porsi/kualitas
   bermasalah. Kalau >=20% dari total laporan (orangtua + anak) yang masuk
   utk 1 distribusi nunjukkin masalah, dibikin flag jenis "Selisih laporan
   penerimaan". Syarat minimal 3 laporan gabungan dulu sebelum aturan ini
   dicek, supaya 1 laporan tunggal belum langsung nge-flag saat data masih
   sangat sedikit. **"Suka/gak suka" dari CVI SENGAJA gak ikut dihitung** --
   itu soal selera, bukan sinyal ketidaksesuaian data (disepakati bareng
   user).
3. **Catatan perbaikan dari anak (CVI)** -- begitu ada 1 anak nulis catatan
   teks bebas, langsung dibikin flag jenis "Catatan dari anak (CVI)" (sama
   kayak komplain sekolah, gak nunggu jumlah tertentu). Detail flag berisi
   SEMUA catatan yang masuk utk distribusi itu (diregenerasi ulang tiap job
   jalan), tanpa nama/NIS-NISN anak -- konsisten sama aturan anonimisasi CVI
   ke role Dinas.
4. **Entri CVI yang lokasinya belum terverifikasi** (`lokasiTerverifikasi:
   false` -- GPS ditolak/lemah/di luar radius 10m) **tetap dihitung** ke
   aturan 2 & 3 di atas (disepakati bareng user) -- gagal verifikasi bukan
   berarti palsu, cuma perlu ditinjau manual (Bagian 3.3 Dok Teknis), bukan
   alasan exclude otomatis.

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

Feedback CVI sekarang JUGA jadi sumber `checkTriangulasi()` (sesuai Bagian
6.2 -- "data ini menjadi sumber triangulasi tambahan"), bukan cuma tampil
terpisah lagi -- lihat aturan 2-4 di bagian "Job triangulasi" di atas buat
detail lengkapnya.

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

### Info gizi & nomor menu di pesan WA ke sekolah (feedback Teh Lingga, tim Prof Elly)

Pesan "siap-bagi" yang di-generate di dashboard Sekolah (tombol salin/kirim
WA, lihat `src/app/api/sekolah/pesan-harian/route.ts`) sekarang JUGA
menyertakan nomor menu/siklus + rincian nilai gizi (energi/protein/lemak/
karbohidrat), terpisah buat Kategori I (SD) & Kategori II (SMP ke atas) --
sesuai contoh format WA yang dikirim Teh Lingga (2 screenshot, 26 Sep 2026).
Info status/porsi-diterima yang udah ada TETAP dipertahankan (digabung, bukan
diganti), per keputusan user.

Field baru di `MenuHarian` (`nomorMenu`, `siklus`, 4 nilai gizi Kategori I,
4 nilai gizi Kategori II -- lihat `prisma/schema.prisma`):
- **Wajib diisi** di form upload & edit menu SPPG (dashboard SPPG) -- divalidasi
  server-side lewat `src/lib/gizi.ts` (`parseGizi()`), dipakai bareng oleh
  `POST /api/sppg/menu` & `PATCH /api/sppg/menu/[id]`.
- **Nullable di level DB** (judgment call implementasi, bukan dari dokumen)
  -- biar data menu lama (sebelum field ini ada) gak rusak/perlu di-backfill
  paksa. Pesan WA otomatis nge-skip bagian nomor-menu/gizi kalau field-nya
  null di record lama, gak nge-crash.
- Angka desimal ditampilkan gaya Indonesia (koma, bukan titik) lewat
  `src/lib/format.ts` (`formatAngkaID()`), mis. `16,3` bukan `16.3`.
- Daftar menu di pesan WA dinomori otomatis dari `deskripsi` (dipisah per
  koma) -- kalau SPPG nulis deskripsi tanpa koma, tetap ditampilkan sebagai
  1 baris.

**Kolom Prisma baru -- WAJIB jalanin `npx prisma generate && npx prisma db
push` lagi lokal sebelum lanjut testing**, karena skema `MenuHarian` berubah.

### Perbaikan UX round pertama (feedback Teh Lingga & tim, sesi testing 14 Sep)

Sekumpulan perbaikan kecil ke UI Fase 2 berdasarkan hasil coba-coba pertama:

- **Rating**: kursor jadi pointer + bintang "nyala" saat di-hover (preview skor sebelum
  diklik). Widget juga gak lagi nyembunyiin diri permanen abis submit -- ada tombol
  "Kirim rating lagi", soalnya ternyata backend-nya emang udah support kirim berkali-kali
  dari awal (gak ada limit/cooldown), cuma UI-nya yang bikin kelihatan cuma bisa sekali.
- **Pengaduan**: dicek juga -- backend udah support kirim berkali-kali & submitter udah
  bisa lihat status pengaduannya sendiri (Diterima/Ditindaklanjuti/Selesai). Diputuskan
  gak perlu nambah visibilitas silang antar-pihak (sekolah lihat pengaduan ortu ke SPPG
  yang sama, dst) untuk sekarang -- kalau butuh, udah ada panel Dinas yang pegang semua.
- **Foto menu**: gak di-crop lagi (`object-contain` bukan `object-cover`) di semua tempat
  foto ditampilkan (Sekolah, SPPG, Orangtua).
- **Portal SPPG**: riwayat distribusi sekarang punya bagian "Lihat rincian" yang expand
  -- nampilin foto, nilai gizi lengkap Kategori I/II, dan detail per sekolah (status,
  porsi diterima, catatan bermasalah). Input upload foto diganti dari `<input
  type="file">` polos jadi kontrol custom (ikon + nama file) biar jelas bisa diklik.
- **Portal Orang Tua**: sekarang pakai `DashboardShell` yang sama kayak portal lain
  (konsisten tampilannya), dan tiap anak punya bagian "Lihat rincian menu" (expand) yang
  nampilin nomor menu/siklus, nilai gizi, & foto menu -- data ini sebenarnya udah
  dikirim API-nya dari awal, cuma belum ditampilkan di UI.
- **Transparansi**: kartu statistik dirombak gaya "icon badge" (terinspirasi contoh
  Tailwind Plus dari user, `@heroicons/react`), diadaptasi ke tema neutral/hitam
  aplikasi ini. Gak pakai indikator naik/turun kayak contohnya karena belum ada data
  historis buat dibandingin -- baru snapshot kondisi sekarang.

Package baru ditambahin user buat ini semua: `@heroicons/react`, `@headlessui/react`,
`motion`, `clsx` (project juga pindah dari npm ke bun buat package manager-nya).

## Belum dikerjakan (langkah berikutnya)

- Proteksi role per halaman sudah ada (`requireRole()`), tapi belum ada
  halaman "tidak diizinkan" yang jelas -- sekarang cuma redirect diam-diam.
- Ambang batas & aturan job triangulasi (termasuk yang gabungan
  orangtua+anak) masih judgment call MVP -- perlu dievaluasi ulang bareng
  Prof Elly/tim Dinas begitu ujicoba internal jalan (mis. apa 20%/minimal 3
  laporan udah pas, atau perlu jenis flag tambahan seperti "foto bukti gak
  sesuai jadwal" yang ada di wireframe awal tapi belum diimplementasi).
- Fitur Fase 2 dibangun tanpa wireframe (keputusan sadar demi kecepatan,
  lihat catatan di bagian atas) -- UI-nya fungsional tapi seadanya,
  kemungkinan perlu dirapikan pas QA menyeluruh sebelum ujicoba internal.
- QA menyeluruh (Fase 6 roadmap: unit/E2E testing, review UX Fase 2, cek
  keamanan endpoint publik `/api/anak/feedback` & `/api/publik/stats`
  terhadap abuse/rate-limit) -- belum dikerjakan, ini langkah berikutnya
  yang disepakati (Fase 2 dulu, QA sekali di akhir).
