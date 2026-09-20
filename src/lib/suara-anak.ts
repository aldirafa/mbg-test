// Redesign Suara Anak / Child Voice Interface (feedback tim Prof Elly, 20 Sep) --
// ganti 2 pertanyaan biner (suka/habis: ya-tidak) jadi 3-pilihan + pertanyaan
// follow-up multi-select kondisional, plus pertanyaan baru "kondisi kemasan", plus
// pertanyaan penutup "ada yang mau diperbaiki" diganti dari teks bebas jadi
// multi-select + "Lainnya". Semua teks & emoji verbatim dari markdown yang dikasih
// tim -- JANGAN diubah tanpa konfirmasi ulang.
//
// Value enum (penilaian/kondisiHabis/kondisiKemasan) match Prisma enum PenilaianAnak /
// KondisiHabis / KondisiKemasan di schema. Opsi multi-select (alasan*/perbaikan*)
// disimpan sbg array kode string (bukan enum Prisma) krn sifatnya cuma daftar
// checkbox tetap, bukan domain value yang perlu integritas enum DB -- lihat
// FeedbackAnak.alasanSuka dkk (String[] @default([])).
//
// FeedbackAnak.suka & .habis (boolean legacy) TETAP dipertahankan buat backward-compat
// src/lib/triangulasi.ts (gak diubah logicnya) -- dihitung OTOMATIS di API route saat
// create: suka = (penilaian !== "tidak_suka"), habis = (kondisiHabis === "habis").

export const INTRO_SUARA_ANAK =
  "Website Suara Anak ini dirancang agar peserta didik dapat memberi umpan balik langsung atas menu makan siang harian dalam Program Makan Bergizi Gratis. Data ini menjadi input harian bagi Satuan Pelayanan Pemenuhan Gizi (SPPG) untuk menilai penerimaan menu dan tingkat sisa makanan per hari. Jawabanmu membantu sekolah membuat makanan yang lebih enak, nyaman, dan sesuai dengan kebutuhan anak.";

export type OpsiSuaraAnak = {
  value: string;
  label: string;
  // true = opsi ini butuh input teks tambahan ("Lainnya: ___") kalau dipilih.
  butuhTeksLainnya?: boolean;
};

// --- 1. Penilaian menu (ganti "Suka gak menunya?") -------------------------------

export const PERTANYAAN_PENILAIAN = "Hari ini kamu suka makanannya?";

export const OPSI_PENILAIAN: OpsiSuaraAnak[] = [
  { value: "suka", label: "😊 Suka" },
  { value: "biasa", label: "😐 Biasa saja" },
  { value: "tidak_suka", label: "🙁 Tidak suka" },
];

// Follow-up kalau penilaian = "suka".
export const PERTANYAAN_ALASAN_SUKA = "Bagian mana yang kamu suka? Bisa pilih lebih dari satu.";

export const OPSI_ALASAN_SUKA: OpsiSuaraAnak[] = [
  { value: "rasa_enak", label: "❤️ Rasanya enak" },
  { value: "porsi_pas", label: "🍚 Porsinya pas" },
  { value: "sayur_enak", label: "🥗 Sayurannya enak" },
  { value: "lauk_enak", label: "🍗 Lauknya enak" },
  { value: "buah_enak", label: "🍊 Buahnya enak" },
  { value: "bau_enak", label: "👃 Baunya enak" },
  { value: "tampilan_menarik", label: "✨ Tampilannya menarik" },
];

// Follow-up kalau penilaian = "biasa" ATAU "tidak_suka".
export const PERTANYAAN_ALASAN_KURANG_SUKA = "Kalau ada yang kurang kamu suka, kenapa? Bisa pilih lebih dari satu.";

export const OPSI_ALASAN_KURANG_SUKA: OpsiSuaraAnak[] = [
  { value: "rasa_kurang_enak", label: "😋 Rasanya kurang enak" },
  { value: "kurang_asin_terlalu_asin", label: "🧂 Kurang asin / terlalu asin" },
  { value: "terlalu_pedas", label: "🌶️ Terlalu pedas" },
  { value: "tekstur_kurang_enak", label: "🍚 Teksturnya kurang enak" },
  { value: "bau_kurang_enak", label: "👃 Baunya kurang enak" },
  { value: "tidak_suka_jenis_makanan", label: "🥗 Tidak suka jenis makanannya" },
  { value: "porsi_terlalu_banyak", label: "🍽️ Porsinya terlalu banyak" },
  { value: "porsi_terlalu_sedikit", label: "🍚 Porsinya terlalu sedikit" },
  { value: "kurang_hangat", label: "🌡️ Makanannya kurang hangat" },
  { value: "lainnya", label: "💬 Lainnya", butuhTeksLainnya: true },
];

export function tampilkanAlasanSuka(penilaian: string | null): boolean {
  return penilaian === "suka";
}

export function tampilkanAlasanKurangSuka(penilaian: string | null): boolean {
  return penilaian === "biasa" || penilaian === "tidak_suka";
}

// --- 2. Kondisi habis (ganti "Makanannya habis gak?") -----------------------------

export const PERTANYAAN_KONDISI_HABIS = "Makanannya kamu habiskan?";

export const OPSI_KONDISI_HABIS: OpsiSuaraAnak[] = [
  { value: "habis", label: "🍽️ Habis" },
  { value: "sisa_sedikit", label: "🥄 Masih tersisa sedikit" },
  { value: "sisa_banyak", label: "🍱 Masih tersisa banyak" },
];

// Follow-up kalau kondisiHabis != "habis" (masih ada sisa, sedikit ataupun banyak).
export const PERTANYAAN_ALASAN_TIDAK_HABIS = "Kenapa makanannya tidak habis? Bisa pilih lebih dari satu.";

export const OPSI_ALASAN_TIDAK_HABIS: OpsiSuaraAnak[] = [
  { value: "rasa_kurang_cocok", label: "😐 Rasanya kurang cocok" },
  { value: "porsi_terlalu_banyak", label: "🍚 Porsinya terlalu banyak" },
  { value: "tidak_suka_jenis_makanan", label: "🥗 Tidak suka jenis makanannya" },
  { value: "terlalu_pedas", label: "🌶️ Terlalu pedas" },
  { value: "terlalu_asin", label: "🧂 Terlalu asin" },
  { value: "lauk_sayur_kurang_suka", label: "🍗 Lauk/sayur kurang saya suka" },
  { value: "tidak_sempat", label: "⏰ Tidak sempat menghabiskan" },
  { value: "kurang_enak_setelah_makan", label: "🤢 Merasa kurang enak setelah makan" },
  { value: "lainnya", label: "Lainnya", butuhTeksLainnya: true },
];

export function tampilkanAlasanTidakHabis(kondisiHabis: string | null): boolean {
  return kondisiHabis === "sisa_sedikit" || kondisiHabis === "sisa_banyak";
}

// --- 3. Kondisi kemasan (pertanyaan baru) -----------------------------------------

export const PERTANYAAN_KONDISI_KEMASAN = "Bagaimana kondisi makanan saat kamu menerimanya?";

export const OPSI_KONDISI_KEMASAN: OpsiSuaraAnak[] = [
  { value: "bersih_rapi", label: "🙂 Bersih dan rapi" },
  { value: "cukup_bersih", label: "😐 Cukup bersih" },
  { value: "kurang_bersih", label: "🙁 Kurang bersih" },
];

// --- 4. Perbaikan diinginkan (ganti "Ada yang mau diperbaiki? (opsional)") --------
// catatanPerbaikan (field lama, satu-satunya field teks bebas versi lama) di-reuse
// jadi teks "Lainnya" pelengkap multi-select ini -- lihat komentar di schema.prisma.

export const PERTANYAAN_PERBAIKAN =
  "Kalau boleh mengubah satu hal dari makanan hari ini, kamu ingin apa?";

export const OPSI_PERBAIKAN: OpsiSuaraAnak[] = [
  { value: "porsi", label: "🍚 Porsinya" },
  { value: "rasa", label: "😋 Rasanya" },
  { value: "jenis_sayur", label: "🥗 Jenis sayur" },
  { value: "jenis_lauk", label: "🍗 Jenis lauk" },
  { value: "buah", label: "🍎 Buah" },
  { value: "suhu_makanan", label: "🌡️ Suhu makanan" },
  { value: "tampilan_makanan", label: "✨ Tampilan makanan" },
  { value: "sudah_cukup_baik", label: "👍 Sudah cukup baik" },
  { value: "lainnya", label: "💬 Lainnya", butuhTeksLainnya: true },
];
