// Daftar nama menu default -- bantuan cepat buat combobox creatable di form item menu
// SPPG. User tetap bebas ngetik nama bebas (creatable); daftar ini cuma opsi cepat,
// bukan validasi/batasan.
//
// CATATAN: dulu tiap nama di sini juga punya mapping "kategori nutrisi yang di-
// highlight otomatis" (mis. "Susu" -> Protein Hewani + Lemak). Fitur itu DIHAPUS &
// digantiin field "Sumber" manual per item (single-select, lihat src/lib/sumber-
// gizi.ts) -- keputusan eksplisit user supaya kategorisasi gizi selalu ditandain
// manual, gak ditebak dari nama.
export const OPSI_MENU_ITEM: string[] = [
  // Sumber karbohidrat / energi utama
  "Nasi putih",
  "Nasi merah",
  "Mie",
  "Kentang",
  "Singkong",
  "Jagung",
  "Roti",

  // Protein hewani
  "Ayam",
  "Ikan",
  "Telur",
  "Daging sapi",
  "Bakso",
  "Susu",

  // Protein nabati
  "Tahu",
  "Tempe",
  "Kacang-kacangan",

  // Sayur
  "Sayur bayam",
  "Sayur kangkung",
  "Sayur sop",
  "Tumis kacang panjang",

  // Sumber lemak
  "Minyak goreng",
  "Santan",
  "Keju",

  // Buah
  "Buah pisang",
  "Buah jeruk",
  "Buah semangka",
];
