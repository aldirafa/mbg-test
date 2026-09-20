// Klasifikasi ketepatan waktu kirim->terima (revisi feedback 20 Sep). TERPISAH dari
// aturan 4 jam checklist BGN (src/lib/bgn-checklist.ts, item "batas_waktu_4_jam") --
// itu tetap cek keamanan pangan/kelayakan konsumsi, gak diganti sama sekali. Field
// ini murni buat rekap statistik ketepatan waktu distribusi di dashboard Dinas.
//
// JUDGMENT CALL: tim cuma kasih satu angka acuan ("Terlambat > 15 menit"), tanpa angka
// "tepat waktu" atau tingkat keparahan lain. Threshold yang dipakai di sini:
//   <= 15 menit           -> tepat_waktu
//   > 15 menit s/d 30 menit -> terlambat_ringan
//   > 30 menit             -> terlambat_berat
// Ini disederhanakan jadi 3 klasifikasi (Bab 6.2 dsb minta 3-bucket: "Tepat waktu",
// "Terlambat <= 15 menit", "Terlambat > 15 menit") tapi dipecah 2 di sisi "terlambat"
// biar rekap Dinas lebih informatif (bisa gampang digabung balik jadi 2-bucket kalau
// mau strict ke spesifikasi asli -- lihat README). Gampang diubah kalau tim kasih
// angka resmi lain.
export type KlasifikasiKetepatanWaktu = "tepat_waktu" | "terlambat_ringan" | "terlambat_berat";

export const LABEL_KETEPATAN_WAKTU: Record<KlasifikasiKetepatanWaktu, string> = {
  tepat_waktu: "Tepat waktu (≤ 15 menit)",
  terlambat_ringan: "Terlambat 15–30 menit",
  terlambat_berat: "Terlambat > 30 menit",
};

const AMBANG_RINGAN_MENIT = 15;
const AMBANG_BERAT_MENIT = 30;

// selisih dalam menit antara waktuKirim & waktuTerima (keduanya ISO string / Date).
// Kalau waktuTerima < waktuKirim (data ga wajar), tetep diklasifikasi dari nilai
// absolut selisihnya -- validasi urutan waktu itu tanggung jawab pemanggil.
export function klasifikasiKetepatanWaktu(
  waktuKirim: string | Date,
  waktuTerima: string | Date
): KlasifikasiKetepatanWaktu {
  const kirim = typeof waktuKirim === "string" ? new Date(waktuKirim) : waktuKirim;
  const terima = typeof waktuTerima === "string" ? new Date(waktuTerima) : waktuTerima;
  const selisihMenit = Math.abs(terima.getTime() - kirim.getTime()) / 60000;

  if (selisihMenit <= AMBANG_RINGAN_MENIT) return "tepat_waktu";
  if (selisihMenit <= AMBANG_BERAT_MENIT) return "terlambat_ringan";
  return "terlambat_berat";
}
