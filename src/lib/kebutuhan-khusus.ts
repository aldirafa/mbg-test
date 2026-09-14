// Kategori disabilitas & alergi/pantangan buat data entry sekolah (revisi rapat tim,
// 14 Sep). Disimpen di Sekolah.disabilitasData / Sekolah.alergiData sbg JSON dgn shape:
//   { [kodeKategori]: { jumlah: number, catatan?: string } }
// "catatan" opsional -- dipake sekolah buat keterangan tambahan per kategori (mis. nama
// anak, tingkat keparahan, dll), gak wajib diisi.

export type EntriKebutuhanKhusus = {
  jumlah: number;
  catatan?: string;
};

export type DataKebutuhanKhusus = Record<string, EntriKebutuhanKhusus>;

// Klasifikasi disabilitas anak sekolah Indonesia (Permendikbud/rujukan pendidikan
// khusus): A = tunanetra, B = tunarungu, C = tunagrahita, D = tunadaksa,
// E = tunalaras. (Kategori G/multi-disabilitas ada di sumber tapi gak diminta user.)
export const KATEGORI_DISABILITAS: { kode: string; label: string; deskripsi: string }[] = [
  { kode: "A", label: "Tunanetra", deskripsi: "Gangguan penglihatan" },
  { kode: "B", label: "Tunarungu", deskripsi: "Gangguan pendengaran" },
  { kode: "C", label: "Tunagrahita", deskripsi: "Hambatan intelektual" },
  { kode: "D", label: "Tunadaksa", deskripsi: "Hambatan fisik/motorik" },
  { kode: "E", label: "Tunalaras", deskripsi: "Hambatan emosi & perilaku" },
];

// Alergi/pantangan makanan umum -- gabungan "Big 9" alergen FARE (yg paling sering
// jadi standar rujukan internasional) + contoh yg dikasih user sendiri (nasi,
// intoleransi laktosa/gluten, telur, kacang-kacangan -- beberapa udah overlap dgn Big 9
// tapi tetep dicantumin biar istilahnya familiar buat user lokal).
export const KATEGORI_ALERGI: { kode: string; label: string }[] = [
  { kode: "susu", label: "Alergi susu / produk olahan susu" },
  { kode: "laktosa", label: "Intoleransi laktosa" },
  { kode: "telur", label: "Alergi telur" },
  { kode: "kacang_tanah", label: "Alergi kacang tanah" },
  { kode: "kacang_pohon", label: "Alergi kacang-kacangan (kenari, almond, mete, dll)" },
  { kode: "kedelai", label: "Alergi kedelai" },
  { kode: "gandum", label: "Alergi gandum" },
  { kode: "gluten", label: "Intoleransi gluten" },
  { kode: "makanan_laut_kerang", label: "Alergi makanan laut berkulit keras (udang, kepiting, dll)" },
  { kode: "ikan", label: "Alergi ikan" },
  { kode: "wijen", label: "Alergi wijen" },
  { kode: "nasi", label: "Alergi/pantangan nasi" },
];
