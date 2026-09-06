import { prisma } from "@/lib/prisma";

// Job pembanding 3 laporan (Fase 5, Bagian 6.2 Concept Note & Bagian 5.4/6.2 Dok. Teknis).
// Dipanggil langsung tiap kali ada laporan baru yang relevan (write-time trigger), bukan
// cron terjadwal -- lebih simpel di atas Vercel serverless & flag langsung muncul ke Dinas.
//
// Dua aturan MVP (disepakati bareng user, belum dirinci di dokumen):
// 1. Sekolah mengajukan komplain (distribusi.status = "bermasalah") -> selalu di-flag.
// 2. Sekian persen laporan orangtua utk 1 distribusi bilang "tidak_diterima"/"ada_masalah"
//    -> di-flag. Ambang: >=20% dari yang SUDAH konfirmasi (bukan dari total siswa terdaftar),
//    dengan syarat minimal 3 konfirmasi supaya 1 laporan tunggal (1/1 = 100%) belum langsung
//    men-trigger flag saat data masih sangat sedikit -- ini judgment call implementasi, bukan
//    dari dokumen, didokumentasikan di README.
const MIN_KONFIRMASI_UNTUK_CEK_SELISIH = 3;
const AMBANG_RASIO_BERMASALAH = 0.2;

const JENIS_KOMPLAIN_SEKOLAH = "Komplain kualitas dari sekolah";
const JENIS_SELISIH_ORANGTUA = "Selisih laporan penerimaan";

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
  // selama masih "terbuka" (mis. jumlah laporan orangtua terus bertambah).
  if (existing.status === "terbuka" && existing.detail !== detail) {
    await prisma.flagTriangulasi.update({ where: { id: existing.id }, data: { detail } });
  }
}

export async function checkTriangulasi(distribusiId: string) {
  const distribusi = await prisma.distribusi.findUnique({
    where: { id: distribusiId },
    include: {
      konfirmasiOrangtua: true,
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

  // Aturan 2: selisih laporan orangtua.
  const total = distribusi.konfirmasiOrangtua.length;
  if (total >= MIN_KONFIRMASI_UNTUK_CEK_SELISIH) {
    const bermasalah = distribusi.konfirmasiOrangtua.filter(
      (k) => k.statusTerima !== "diterima"
    ).length;
    const rasio = bermasalah / total;

    if (rasio >= AMBANG_RASIO_BERMASALAH) {
      await upsertFlag(
        distribusi.id,
        JENIS_SELISIH_ORANGTUA,
        `${bermasalah} dari ${total} orangtua (${Math.round(rasio * 100)}%) yang sudah konfirmasi melaporkan anak tidak menerima makan atau ada masalah, untuk distribusi ke ${distribusi.sekolah.namaSekolah}.`
      );
    }
  }
}
