// Checklist pra-penerimaan BGN (Badan Gizi Nasional) -- teks dari tim (rapat 14 Sep),
// dipakai sekolah pas mau konfirmasi terima menu. Kalau ADA item WAJIB (required=true)
// yang gagal, penerimaan diblokir & distribusi otomatis diarahkan ke status
// "bermasalah" + catatan diisi ringkasan item yang gagal (lihat API konfirmasi sekolah,
// src/app/api/sekolah/konfirmasi/route.ts).
//
// Catatan transkripsi: 1 typo kecil dari teks asli dibetulin ("Hasi pemeriksaan tekstur"
// -> "Hasil pemeriksaan tekstur") biar konsisten sama 3 item pemeriksaan sensorik
// lainnya yang polanya sama persis ("Hasil pemeriksaan ... dinyatakan layak").

export type ItemChecklistBgn = {
  id: string;
  label: string;
  guidance?: string; // teks panduan yang expandable di UI
  required: boolean;
};

export const CHECKLIST_BGN: ItemChecklistBgn[] = [
  {
    id: "menu_sesuai",
    label: "Menu yang diterima sesuai dengan menu yang dilaporkan SPPG.",
    required: true,
  },
  {
    id: "batas_waktu_4_jam",
    label:
      "Batas Waktu 4 Jam: Makanan MBG wajib dikonsumsi maksimal 4 jam setelah matang dan dilengkapi label waktu pada kemasan. (Ada label/tersegel ga?)",
    required: true,
  },
  {
    id: "visual",
    label: "Hasil pemeriksaan visual dinyatakan layak",
    guidance:
      "Nilai warna dan penampilan makanan. Lihat warna makanan. Jika warna cerah, alami, dan tidak kusam: layak. Jika warna keabu-abuan, kehijauan, atau terlihat berlendir: tidak layak.",
    required: true,
  },
  {
    id: "aroma",
    label: "Hasil pemeriksaan aroma dinyatakan layak",
    guidance:
      "Cium aroma makanannya. Layak jika aroma makanannya adalah aroma khas bahan makanan dan tidak menyengat. Tidak layak jika baunya asam, tengik, atau busuk.",
    required: true,
  },
  {
    id: "tekstur",
    label: "Hasil pemeriksaan tekstur dinyatakan layak",
    guidance:
      "Sentuh atau tekan dengan sendok atau tangan dengan sarung tangan steril. Cek kekenyalan dan permukaan makanan. Jika tekstur lembut, tidak lengket berlebihan: layak. Jika berlendir, menggumpal, atau tidak sewajarnya keras: tidak layak.",
    required: true,
  },
  {
    id: "rasa",
    label: "Hasil pemeriksaan rasa dinyatakan layak",
    guidance:
      "Cek rasa makanan. Cicipi sedikit, oleh petugas yang sehat dengan sendok berbeda, makanan yang diberikan. Jika rasa sesuai jenis makanan: layak. Jika rasa asam/tengik/tidak normal, tidak layak.",
    required: true,
  },
  {
    id: "suhu",
    label: "Hasil pemeriksaan suhu dinyatakan layak",
    guidance:
      "Cek suhu makanan dengan termometer makanan. Layak: hangat dan matang, ~60°C. Tidak layak: suhu ruang terlalu lama (> 2 jam).",
    required: false,
  },
  {
    id: "kemasan_higienis",
    label: "Kemasan makanan higienis",
    required: true,
  },
  {
    id: "tidak_ada_kotoran",
    label: "Baik makanan maupun kemasannya tidak terpapar kotoran",
    required: true,
  },
  {
    id: "tidak_ada_hama",
    label: "Tidak ada hama atau serangga pada makanan maupun kemasannya",
    required: true,
  },
  {
    id: "kebutuhan_khusus",
    label: "Jika ada, kebutuhan khusus penerima manfaat sudah disiapkan dengan tepat",
    required: false,
  },
];

export type JawabanChecklistBgn = Record<string, boolean>;

// Item wajib yg belum lolos (belum dicentang / dicentang false). Kosong = semua item
// wajib udah lolos.
export function itemGagal(jawaban: JawabanChecklistBgn): ItemChecklistBgn[] {
  return CHECKLIST_BGN.filter((item) => item.required && jawaban[item.id] !== true);
}

export function ringkasanItemGagal(jawaban: JawabanChecklistBgn): string {
  const gagal = itemGagal(jawaban);
  if (gagal.length === 0) return "";
  return `Checklist BGN gagal pada: ${gagal.map((i) => i.label).join("; ")}`;
}
