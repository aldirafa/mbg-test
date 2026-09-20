// Panduan deskriptif kebutuhan anak disabilitas & alergi/intoleransi pangan (feedback
// tim Prof Elly, 20 Sep). BUKAN angka AKG resmi -- tim sendiri bilang belum nemu
// standar kecukupan gizi resmi buat kondisi-kondisi ini, jadi yang ditampilkan cuma
// info deskriptif "perhatian komposisi makanan" (+ "pengganti" khusus alergi). Teks
// disalin verbatim dari markdown yang dikasih tim.
//
// Versi ini (tanpa kolom "Implikasi penyajian") ditujukan buat SPPG -- fokus ke
// komposisi/pengolahan makanan pas nyiapin menu (lihat PanelKebutuhanKhusus di
// sppg-dashboard.tsx). Versi Sekolah (fokus ke penyajian/pendampingan di lapangan) ada
// di src/lib/kebutuhan-khusus-implikasi.ts. Kode kondisi (`kode`) match dgn
// src/lib/kebutuhan-khusus.ts (KATEGORI_DISABILITAS / KATEGORI_ALERGI), dipakai buat
// gate tampilan: cuma tampilkan kondisi yang datanya ada (jumlah > 0) di sekolah terkait.

export type PanduanDisabilitas = {
  kode: string; // match KATEGORI_DISABILITAS
  perhatianKomposisi: string;
};

export const PANDUAN_DISABILITAS: PanduanDisabilitas[] = [
  { kode: "A", perhatianKomposisi: "Tidak ada koreksi gizi khusus" },
  { kode: "B", perhatianKomposisi: "Tidak ada koreksi gizi khusus" },
  {
    kode: "C",
    perhatianKomposisi:
      "Jaga porsi jangan berlebihan, karena anak cenderung kurang aktif bergerak sehingga mudah gemuk. Kalau siswa juga punya kondisi lain seperti Down syndrome, ikuti juga catatan untuk kondisi tersebut.",
  },
  {
    kode: "D",
    perhatianKomposisi:
      "Anak dengan gangguan gerak (termasuk cerebral palsy) sering butuh porsi lebih sedikit dari anak seusianya, apalagi yang tidak bisa berjalan sendiri.",
  },
  {
    kode: "E",
    perhatianKomposisi:
      "Kalau anak minum obat dari dokter, nafsu makannya bisa naik atau turun, perhatikan berat badannya secara berkala. Kurangi makanan dan minuman yang terlalu manis atau berkafein.",
  },
];

export type PanduanAlergi = {
  kode: string; // match KATEGORI_ALERGI
  perhatianKomposisi: string;
  pengganti: string;
};

export const PANDUAN_ALERGI: PanduanAlergi[] = [
  {
    kode: "susu",
    perhatianKomposisi:
      "Hindari total susu sapi dan turunannya: susu bubuk, keju, mentega, yogurt, krimer. Sering tersembunyi dalam roti, biskuit, dan kue kemasan, wajib baca label.",
    pengganti: "Ganti dengan susu kedelai atau susu oat. Jaga kecukupan kalsium lewat tahu, tempe, dan sayuran hijau.",
  },
  {
    kode: "laktosa",
    perhatianKomposisi:
      "Batasi susu cair segar; produk fermentasi seperti yogurt dan keju tua biasanya masih bisa ditoleransi dalam jumlah kecil.",
    pengganti: "Gunakan susu rendah laktosa atau susu nabati. Tidak perlu dihindari total kecuali gejalanya berat.",
  },
  {
    kode: "telur",
    perhatianKomposisi:
      "Hindari telur ayam dan bebek, serta bahan yang mengandung telur seperti mayones dan adonan bertepung telur.",
    pengganti: "Ganti sumber protein dengan ikan, ayam, tahu, atau tempe.",
  },
  {
    kode: "kacang_tanah",
    perhatianKomposisi: "Hindari total kacang tanah dan olahannya, bumbu kacang, sambal kacang, selai kacang.",
    pengganti: "Ganti bumbu kacang dengan kecap atau bumbu rempah. Pisahkan alat masak dari yang dipakai memasak kacang.",
  },
  {
    kode: "kacang_pohon",
    perhatianKomposisi:
      "Hindari semua jenis kacang pohon dan produknya, termasuk susu almond dan taburan kacang.",
    pengganti: "Periksa label camilan kemasan dengan cermat. Pisahkan alat masak.",
  },
  {
    kode: "kedelai",
    perhatianKomposisi: "Hindari kedelai dan olahannya: tahu, tempe, kecap, susu kedelai.",
    pengganti:
      "Ganti sumber protein nabati dengan sumber protein hewani, atau sesuaikan dengan kondisi lain yang menyertai.",
  },
  {
    kode: "gandum",
    perhatianKomposisi: "Hindari gandum dan produknya: terigu, roti, mi, biskuit, tepung panir.",
    pengganti: "Ganti dengan tepung beras, tepung jagung, atau tepung singkong.",
  },
  {
    kode: "gluten",
    perhatianKomposisi:
      "Hindari gluten dari gandum, jelai (barley), dan gandum hitam (rye). Lebih ketat dari alergi gandum dan gluten juga tersembunyi di kecap dan saus tertentu.",
    pengganti:
      "Gunakan bahan berlabel bebas gluten. Pisahkan talenan dan alat masak agar tidak tercemar gluten dari bahan lain.",
  },
  {
    kode: "makanan_laut_kerang",
    perhatianKomposisi:
      "Hindari udang, kepiting, lobster, kerang, serta terasi dan kaldu bubuk yang dibuat dari bahan tersebut.",
    pengganti: "Ganti dengan ikan (bila tidak alergi ikan) atau daging lain. Waspadai terasi dan kaldu bubuk kemasan.",
  },
  {
    kode: "ikan",
    perhatianKomposisi: "Hindari semua jenis ikan dan turunannya seperti kecap ikan dan terasi ikan.",
    pengganti: "Ganti dengan ayam, telur, atau daging lain sebagai sumber protein.",
  },
  {
    kode: "wijen",
    perhatianKomposisi:
      "Hindari biji wijen, minyak wijen, dan tahini. Sering ada di taburan roti dan bumbu tanpa disadari.",
    pengganti: "Ganti taburan dengan bawang goreng; gunakan minyak nabati biasa.",
  },
  {
    kode: "nasi",
    perhatianKomposisi: "Jenis pantangannya wajib dikonfirmasi ke orang tua/wali sebelum penyajian.",
    pengganti: "Ganti sumber karbohidrat dengan singkong, jagung, kentang, atau ubi.",
  },
];

export const CATATAN_PANDUAN_KHUSUS =
  "Setiap kondisi di atas dicatat pada kartu gizi individual siswa dan diberi label pada kemasan porsi individual.";
