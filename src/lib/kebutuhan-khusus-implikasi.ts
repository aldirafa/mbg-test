// Panduan disabilitas versi Sekolah (feedback tim Prof Elly, 20 Sep) -- "Ini info untuk
// ditampilkan di dashboard sekolah" (kutipan langsung dari pesan tim). Beda dgn versi
// SPPG (src/lib/kebutuhan-khusus-panduan.ts): versi ini nambahin kolom "Implikasi
// penyajian" yg fokus ke pendampingan & cara penyajian di lapangan, bukan cuma
// komposisi makanan. Teks disalin verbatim dari markdown tim. Kode kondisi (`kode`)
// match src/lib/kebutuhan-khusus.ts (KATEGORI_DISABILITAS).

export type ImplikasiDisabilitas = {
  kode: string; // match KATEGORI_DISABILITAS
  perhatianMikronutrien: string;
  implikasiPenyajian: string;
};

export const IMPLIKASI_DISABILITAS: ImplikasiDisabilitas[] = [
  {
    kode: "A",
    perhatianMikronutrien: "Tidak ada koreksi gizi khusus",
    implikasiPenyajian:
      "Penataan wadah dengan metode arah jam disampaikan lisan sebelum makan; wadah bersekat; hindari tulang, duri, dan biji yang sulit dideteksi; pendamping mengkonfirmasi menu dan suhu makanan secara verbal.",
  },
  {
    kode: "B",
    perhatianMikronutrien: "Tidak ada koreksi gizi khusus",
    implikasiPenyajian:
      "Informasi menu dan kandungan alergen disampaikan visual/tertulis atau bahasa isyarat; pastikan siswa dapat melaporkan keluhan (tersedak, alergi) lewat isyarat yang disepakati dengan pendamping.",
  },
  {
    kode: "C",
    perhatianMikronutrien:
      "Jaga porsi jangan berlebihan, karena anak cenderung kurang aktif bergerak sehingga mudah gemuk. Kalau siswa juga punya kondisi lain seperti Down syndrome, ikuti juga catatan untuk kondisi tersebut.",
    implikasiPenyajian:
      "Porsi dan jadwal makan dibuat konsisten dan terprediksi; instruksi makan disederhanakan dan diulang; dampingi untuk memantau kecepatan makan dan risiko tersedak.",
  },
  {
    kode: "D",
    perhatianMikronutrien:
      "Anak dengan gangguan gerak (termasuk cerebral palsy) sering butuh porsi lebih sedikit dari anak seusianya, apalagi yang tidak bisa berjalan sendiri.",
    implikasiPenyajian:
      "Sesuaikan tekstur makanan (dihaluskan atau dipotong kecil) dan alat makan dengan kemampuan anak. Beri waktu makan lebih lama, jangan terburu-buru.",
  },
  {
    kode: "E",
    perhatianMikronutrien:
      "Kalau anak minum obat dari dokter, nafsu makannya bisa naik atau turun, perhatikan berat badannya secara berkala. Kurangi makanan dan minuman yang terlalu manis atau berkafein.",
    implikasiPenyajian:
      "Buat waktu makan teratur dengan suasana tenang. Kalau anak menolak makan, jangan dipaksa atau dimarahi, ajak pelan-pelan.",
  },
];
