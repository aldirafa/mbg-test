// Refleksi mingguan sekolah (feedback tim Prof Elly, 20 Sep) -- 2 survei checkbox
// yang wajib diisi sekolah tiap minggu: (1) kendala pelaksanaan MBG selama seminggu
// berjalan, (2) persepsi sekolah terhadap jalannya program. Teks item persis verbatim
// dari markdown yang dikasih tim. Disimpan di RefleksiMingguan.kendalaJawaban /
// .persepsiJawaban sbg JSON { [itemId]: jawaban }, satu submission per sekolah per
// minggu (upsert berdasar periodeMulai = tanggal Senin minggu itu, WIB).

export type JawabanKendala = "sudah_diselesaikan" | "belum_diselesaikan" | "tidak";

export const OPSI_JAWABAN_KENDALA: { value: JawabanKendala; label: string }[] = [
  { value: "sudah_diselesaikan", label: "Ya, sudah diselesaikan" },
  { value: "belum_diselesaikan", label: "Ya, belum diselesaikan" },
  { value: "tidak", label: "Tidak" },
];

export type ItemKendala = {
  id: string;
  pertanyaan: string;
  // item terakhir ("Lainnya") minta teks bebas tambahan selain pilihan 3-way di atas.
  punyaTeksLainnya?: boolean;
};

export const KENDALA_ITEMS: ItemKendala[] = [
  { id: "sdm", pertanyaan: "Kurangnya SDM untuk menangani penerimaan, penyimpanan, atau distribusi MBG" },
  { id: "ruang_simpan", pertanyaan: "Tidak ada ruangan penyimpanan khusus" },
  { id: "keterlambatan_sppg", pertanyaan: "Keterlambatan makanan oleh SPPG" },
  { id: "pembuangan_limbah", pertanyaan: "Pembuangan limbah" },
  { id: "lainnya", pertanyaan: "Lainnya (sebutkan ………)", punyaTeksLainnya: true },
];

export type JawabanPersepsi = 1 | 2 | 3 | 4 | 5;

// 1 = Sangat setuju .. 5 = Sangat tidak setuju (urutan skala persis seperti tabel asli).
export const OPSI_JAWABAN_PERSEPSI: { value: JawabanPersepsi; label: string }[] = [
  { value: 1, label: "Sangat setuju" },
  { value: 2, label: "Setuju" },
  { value: 3, label: "Netral" },
  { value: 4, label: "Tidak setuju" },
  { value: 5, label: "Sangat tidak setuju" },
];

export type ItemPersepsi = { id: string; pertanyaan: string };

export const PERSEPSI_ITEMS: ItemPersepsi[] = [
  { id: "kehadiran", pertanyaan: "Adanya peningkatan kehadiran siswa" },
  { id: "nilai_akademik", pertanyaan: "Adanya peningkatan nilai akademik siswa" },
  { id: "semangat_belajar", pertanyaan: "Adanya peningkatan semangat belajar siswa" },
  { id: "kesadaran_gizi", pertanyaan: "Adanya kesadaran siswa terhadap makan bergizi" },
  { id: "pendidikan_karakter", pertanyaan: "Program MBG mendukung pendidikan karakter dan kebersihan" },
];

export type JawabanKendalaData = Record<string, JawabanKendala>;
export type JawabanPersepsiData = Record<string, JawabanPersepsi>;

// Tanggal Senin (00:00 WIB) dari minggu yang mengandung `acuan` (default: sekarang).
// Dipakai sbg periodeMulai -- satu record RefleksiMingguan per sekolah per minggu ini.
export function getMingguIni(acuan: Date = new Date()): Date {
  const wibMs = acuan.getTime() + 7 * 60 * 60 * 1000; // geser ke WIB (UTC+7)
  const wib = new Date(wibMs);
  const hari = wib.getUTCDay(); // 0 = Minggu, 1 = Senin, ...
  const selisihKeSenin = hari === 0 ? -6 : 1 - hari;
  const senin = new Date(
    Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate() + selisihKeSenin)
  );
  return senin;
}

export function formatPeriode(periodeMulai: Date): string {
  const akhir = new Date(periodeMulai);
  akhir.setUTCDate(akhir.getUTCDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return `${fmt(periodeMulai)} – ${fmt(akhir)}`;
}
