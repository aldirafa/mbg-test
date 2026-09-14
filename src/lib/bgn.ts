// Evaluasi kecukupan gizi vs standar BGN (Badan Gizi Nasional).
//
// Sumber ambang batas: cuma dikasih tim buat jenjang "SMA - Makan Siang" (rapat tim,
// 14 Sep). Ambang buat Makan Pagi SMA BELUM ada dari tim -- atas arahan user, sementara
// dipakein angka Makan Siang yg sama sbg placeholder, tapi disimpen di key terpisah
// (`SMA.pagi`) biar gampang diganti begitu angka aslinya ada, tanpa nyentuh Makan Siang.
// Jenjang SD/SMP: belum ada ambang batas resmi sama sekali -> evaluasi dilewatin
// (return null), bukan ditebak.
//
// Aturan traffic-light (kesepakatan tim):
//   hijau  = nilai ada di dalam rentang [min, maks]
//   kuning = nilai di luar rentang tapi masih dalam 10% dari batas yg dilanggar
//   merah  = nilai lebih dari 10% di luar batas yg dilanggar

export type WaktuMakanBgn = "pagi" | "siang";
export type JenjangBgn = "SD" | "SMP" | "SMA";
export type StatusGizi = "hijau" | "kuning" | "merah";

export type RentangGizi = { min: number; maks: number };

export type AmbangGizi = {
  energi: RentangGizi;
  proteinTotal: RentangGizi; // proteinHewani + proteinNabati dibandingin ke sini
  lemak: RentangGizi;
  karbohidrat: RentangGizi;
};

// Angka SMA - Makan Siang dari rapat tim (14 Sep). SMA - Makan Pagi masih placeholder
// (sama persis dgn Makan Siang) sampe tim kasih angka resmi -- lihat catatan di atas.
const AMBANG: Record<JenjangBgn, Partial<Record<WaktuMakanBgn, AmbangGizi>>> = {
  SMA: {
    siang: {
      energi: { min: 700, maks: 900 },
      proteinTotal: { min: 20, maks: 30 },
      lemak: { min: 15, maks: 25 },
      karbohidrat: { min: 90, maks: 120 },
    },
    // PLACEHOLDER: belum ada angka resmi dari tim buat makan pagi SMA. Sengaja disamain
    // ke angka makan siang dulu (arahan user) -- ganti nilai ini begitu angka aslinya
    // ada, TANPA nyentuh blok `siang` di atas.
    pagi: {
      energi: { min: 700, maks: 900 },
      proteinTotal: { min: 20, maks: 30 },
      lemak: { min: 15, maks: 25 },
      karbohidrat: { min: 90, maks: 120 },
    },
  },
  SD: {},
  SMP: {},
};

export function getAmbangGizi(jenjang: JenjangBgn, waktu: WaktuMakanBgn): AmbangGizi | null {
  return AMBANG[jenjang]?.[waktu] ?? null;
}

function evaluasiSatuNilai(nilai: number, rentang: RentangGizi): StatusGizi {
  if (nilai >= rentang.min && nilai <= rentang.maks) return "hijau";
  const batasTerlanggar = nilai < rentang.min ? rentang.min : rentang.maks;
  // toleransi 10% dari batas yg dilanggar (bukan dari lebar rentang)
  const toleransi = batasTerlanggar * 0.1;
  const selisih = Math.abs(nilai - batasTerlanggar);
  return selisih <= toleransi ? "kuning" : "merah";
}

// hijau > kuning > merah -- skor gabungan = yg terburuk dari ke-4 nilai.
const URUTAN_KEPARAHAN: Record<StatusGizi, number> = { hijau: 0, kuning: 1, merah: 2 };

export function gabungkanStatus(status: StatusGizi[]): StatusGizi {
  return status.reduce((terburuk, s) =>
    URUTAN_KEPARAHAN[s] > URUTAN_KEPARAHAN[terburuk] ? s : terburuk,
  "hijau");
}

export type HasilEvaluasiGizi = {
  status: StatusGizi;
  perNutrisi: {
    energi: StatusGizi;
    proteinTotal: StatusGizi;
    lemak: StatusGizi;
    karbohidrat: StatusGizi;
  };
  ambang: AmbangGizi;
};

export type TotalGiziSiklus = {
  energi: number;
  karbohidrat: number;
  lemak: number;
  proteinHewani: number;
  proteinNabati: number;
};

// Evaluasi total gizi satu siklus terhadap ambang BGN. Return null kalau jenjang/waktu
// belum punya ambang batas (SD/SMP saat ini) -- artinya "belum bisa dievaluasi", bukan
// "gagal".
export function evaluasiGizi(
  total: TotalGiziSiklus,
  jenjang: JenjangBgn,
  waktu: WaktuMakanBgn,
): HasilEvaluasiGizi | null {
  const ambang = getAmbangGizi(jenjang, waktu);
  if (!ambang) return null;

  const proteinTotal = total.proteinHewani + total.proteinNabati;
  const perNutrisi = {
    energi: evaluasiSatuNilai(total.energi, ambang.energi),
    proteinTotal: evaluasiSatuNilai(proteinTotal, ambang.proteinTotal),
    lemak: evaluasiSatuNilai(total.lemak, ambang.lemak),
    karbohidrat: evaluasiSatuNilai(total.karbohidrat, ambang.karbohidrat),
  };

  return {
    status: gabungkanStatus(Object.values(perNutrisi)),
    perNutrisi,
    ambang,
  };
}

export const LABEL_STATUS_GIZI: Record<StatusGizi, string> = {
  hijau: "Sesuai standar BGN",
  kuning: "Mendekati batas standar BGN",
  merah: "Di luar standar BGN",
};
