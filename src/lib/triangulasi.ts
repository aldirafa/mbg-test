import { prisma } from "@/lib/prisma";

// Job pembanding laporan SPPG/Sekolah/Orangtua/Anak (Fase 5 & Fase 2, Bagian 6.2 Concept
// Note & Bagian 5.4/6.2 Dok. Teknis). Dipanggil langsung tiap kali ada laporan baru yang
// relevan (write-time trigger), bukan cron terjadwal -- lebih simpel di atas Vercel
// serverless & flag langsung muncul ke Dinas.
//
// Aturan MVP (disepakati bareng user secara bertahap, belum dirinci di dokumen):
// 1. Sekolah mengajukan komplain (distribusi.status = "bermasalah") -> selalu di-flag.
// 2. Selisih laporan penerimaan/porsi: gabungan sinyal "tidak_diterima"/"ada_masalah" dari
//    Orangtua DAN "gak habis" dari feedback anak (CVI) -- keduanya indikasi porsi/kualitas
//    bermasalah, jadi dihitung dalam 1 rasio yang sama. Ambang: >=20% dari total laporan
//    (orangtua + anak) yang masuk utk distribusi itu, minimal 3 laporan dulu (gabungan)
//    sebelum aturan ini dicek -- biar 1 laporan tunggal gak langsung nge-flag.
//    "Suka/gak suka" dari CVI SENGAJA gak ikut dihitung -- itu soal selera, bukan sinyal
//    ketidaksesuaian data (disepakati bareng user).
// 3. Catatan perbaikan dari anak (CVI, teks bebas) -- begitu ada 1 anak nulis catatan,
//    langsung di-flag (sama kayak komplain sekolah). Detail flag berisi SEMUA catatan yang
//    masuk utk distribusi itu (bukan cuma yang terbaru), diregenerasi ulang tiap kali job
//    jalan -- tanpa nama/NIS-NISN anak, cuma teks catatannya (konsisten sama aturan
//    anonimisasi CVI: identitas siswa cuma keliatan admin, bukan flag/dashboard Dinas).
// 4. Entri CVI yang lokasinya belum terverifikasi (lokasiTerverifikasi: false) TETAP
//    dihitung ke semua aturan di atas (disepakati bareng user) -- gagal verifikasi lokasi
//    bukan berarti palsu, cuma perlu ditinjau manual (Bagian 3.3 Dok Teknis), bukan alasan
//    exclude otomatis dari agregat.
const MIN_LAPORAN_UNTUK_CEK_SELISIH = 3;
const AMBANG_RASIO_BERMASALAH = 0.2;

const JENIS_KOMPLAIN_SEKOLAH = "Komplain kualitas dari sekolah";
const JENIS_SELISIH_PENERIMAAN = "Selisih laporan penerimaan";
const JENIS_CATATAN_ANAK = "Catatan dari anak (CVI)";

async function upsertFlag(distribusiId: string, jenis: string, detail: string) {
  const existing = await prisma.flagTriangulasi.findFirst({
    where: { distribusiId, jenisKetidaksesuaian: jenis },
  });

  if (!existing) {
    await prisma.flagTriangulasi.create({
      data: { distribusiId, jenisKetidaksesuaian: jenis, detail },
    });
    return;
  }

  // Kalau Dinas udah mulai/selesai menindaklanjuti, jangan diutak-atik lagi --
  // biar statusnya gak kereset & kerjaan Dinas gak keganggu. Detail cuma diperbarui
  // selama masih "terbuka" (mis. jumlah laporan terus bertambah).
  if (existing.status === "terbuka" && existing.detail !== detail) {
    await prisma.flagTriangulasi.update({ where: { id: existing.id }, data: { detail } });
  }
}

export async function checkTriangulasi(distribusiId: string) {
  const distribusi = await prisma.distribusi.findUnique({
    where: { id: distribusiId },
    include: {
      konfirmasiOrangtua: true,
      feedbackAnak: true,
      sekolah: true,
      menu: true,
    },
  });
  if (!distribusi) return;

  // Aturan 1: komplain sekolah.
  if (distribusi.status === "bermasalah" && distribusi.catatan) {
    await upsertFlag(
      distribusi.id,
      JENIS_KOMPLAIN_SEKOLAH,
      `Sekolah (${distribusi.sekolah.namaSekolah}) melaporkan masalah pada distribusi ini: "${distribusi.catatan}"`
    );
  }

  // Aturan 2: selisih laporan penerimaan/porsi -- gabungan Orangtua + Anak (CVI).
  const totalOrangtua = distribusi.konfirmasiOrangtua.length;
  const bermasalahOrangtua = distribusi.konfirmasiOrangtua.filter(
    (k) => k.statusTerima !== "diterima"
  ).length;
  const totalAnak = distribusi.feedbackAnak.length;
  const bermasalahAnak = distribusi.feedbackAnak.filter((f) => !f.habis).length;

  const totalLaporan = totalOrangtua + totalAnak;
  const totalBermasalah = bermasalahOrangtua + bermasalahAnak;

  if (totalLaporan >= MIN_LAPORAN_UNTUK_CEK_SELISIH) {
    const rasio = totalBermasalah / totalLaporan;

    if (rasio >= AMBANG_RASIO_BERMASALAH) {
      await upsertFlag(
        distribusi.id,
        JENIS_SELISIH_PENERIMAAN,
        `${totalBermasalah} dari ${totalLaporan} laporan orangtua & anak (${Math.round(rasio * 100)}%) ` +
          `menunjukkan masalah penerimaan/porsi untuk distribusi ke ${distribusi.sekolah.namaSekolah} ` +
          `(${bermasalahOrangtua}/${totalOrangtua} orangtua bilang tidak diterima/ada masalah, ` +
          `${bermasalahAnak}/${totalAnak} anak bilang tidak habis).`
      );
    }
  }

  // Aturan 3: catatan perbaikan dari anak (CVI) -- 1 catatan langsung di-flag, detail
  // diregenerasi dari SEMUA catatan yang ada (bukan cuma yang terbaru).
  const catatanList = distribusi.feedbackAnak
    .map((f) => f.catatanPerbaikan)
    .filter((c): c is string => !!c && c.trim().length > 0);

  if (catatanList.length > 0) {
    const detail =
      `${catatanList.length} catatan dari anak untuk distribusi ke ${distribusi.sekolah.namaSekolah}: ` +
      catatanList.map((c) => `"${c}"`).join("; ");
    await upsertFlag(distribusi.id, JENIS_CATATAN_ANAK, detail);
  }
}
