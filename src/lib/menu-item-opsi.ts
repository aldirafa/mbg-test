// Daftar nama menu default (buat opsi combobox creatable di form item menu SPPG) +
// kategori nutrisi yg otomatis di-highlight pas nama itu dipilih/diketik. User boleh
// tetep ngetik nama bebas (creatable) -- daftar ini cuma bantuan cepat & pemicu
// highlight, bukan validasi/batasan.
//
// Kategori nutrisi yg bisa di-highlight: "energi" | "karbohidrat" | "lemak" |
// "proteinHewani" | "proteinNabati". Satu nama menu boleh nge-trigger lebih dari satu
// kategori sekaligus (mis. "susu" -> proteinHewani + lemak, kesepakatan eksplisit user).

export type KategoriNutrisi = "energi" | "karbohidrat" | "lemak" | "proteinHewani" | "proteinNabati";

export type OpsiMenuItem = {
  nama: string;
  highlight: KategoriNutrisi[];
};

export const OPSI_MENU_ITEM: OpsiMenuItem[] = [
  // Sumber karbohidrat / energi utama
  { nama: "Nasi putih", highlight: ["karbohidrat", "energi"] },
  { nama: "Nasi merah", highlight: ["karbohidrat", "energi"] },
  { nama: "Mie", highlight: ["karbohidrat", "energi"] },
  { nama: "Kentang", highlight: ["karbohidrat", "energi"] },
  { nama: "Singkong", highlight: ["karbohidrat", "energi"] },
  { nama: "Jagung", highlight: ["karbohidrat", "energi"] },
  { nama: "Roti", highlight: ["karbohidrat", "energi"] },

  // Protein hewani
  { nama: "Ayam", highlight: ["proteinHewani"] },
  { nama: "Ikan", highlight: ["proteinHewani"] },
  { nama: "Telur", highlight: ["proteinHewani"] },
  { nama: "Daging sapi", highlight: ["proteinHewani"] },
  { nama: "Bakso", highlight: ["proteinHewani"] },

  // Susu -- trigger dobel per kesepakatan eksplisit (proteinHewani + lemak)
  { nama: "Susu", highlight: ["proteinHewani", "lemak"] },

  // Protein nabati
  { nama: "Tahu", highlight: ["proteinNabati"] },
  { nama: "Tempe", highlight: ["proteinNabati"] },
  { nama: "Kacang-kacangan", highlight: ["proteinNabati"] },

  // Sayur (dianggap kontribusi kecil ke semua, gak di-highlight khusus -- opsional
  // dipilih tanpa ngubah highlight apa pun)
  { nama: "Sayur bayam", highlight: [] },
  { nama: "Sayur kangkung", highlight: [] },
  { nama: "Sayur sop", highlight: [] },
  { nama: "Tumis kacang panjang", highlight: [] },

  // Sumber lemak
  { nama: "Minyak goreng", highlight: ["lemak"] },
  { nama: "Santan", highlight: ["lemak"] },
  { nama: "Keju", highlight: ["lemak", "proteinHewani"] },

  // Buah (energi ringan dari gula alami)
  { nama: "Buah pisang", highlight: ["energi"] },
  { nama: "Buah jeruk", highlight: ["energi"] },
  { nama: "Buah semangka", highlight: ["energi"] },
];

// Gabungin highlight dari nama menu yg cocok persis (case-insensitive) dgn daftar di
// atas. Nama yg gak ada di daftar (murni custom/creatable) -> array kosong, gak ada
// highlight otomatis.
export function highlightUntukNama(nama: string): KategoriNutrisi[] {
  const cocok = OPSI_MENU_ITEM.find((o) => o.nama.toLowerCase() === nama.trim().toLowerCase());
  return cocok ? cocok.highlight : [];
}

export const LABEL_KATEGORI_NUTRISI: Record<KategoriNutrisi, string> = {
  energi: "Energi",
  karbohidrat: "Karbohidrat",
  lemak: "Lemak",
  proteinHewani: "Protein Hewani",
  proteinNabati: "Protein Nabati",
};
