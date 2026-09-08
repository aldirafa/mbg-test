import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Dashboard transparansi publik (Fase 2, Bagian 6.6) -- PUBLIK, tanpa login. Cuma
// angka agregat, TIDAK ADA data individual/PII (nama siswa, isi laporan, dst).
export async function GET() {
  const [
    sppgAktif,
    totalSekolah,
    totalDistribusi,
    distribusiDikonfirmasiSekolah,
    totalSiswa,
    siswaDenganKonfirmasi,
    ratingOrangtua,
    ratingSemua,
  ] = await Promise.all([
    prisma.sppg.count({ where: { statusAktif: true } }),
    prisma.sekolah.count(),
    prisma.distribusi.count(),
    prisma.distribusi.count({ where: { status: { in: ["diterima", "bermasalah"] } } }),
    prisma.siswa.count(),
    prisma.konfirmasiOrangtua.findMany({
      distinct: ["siswaId"],
      select: { siswaId: true },
    }),
    prisma.rating.aggregate({ where: { orangtuaId: { not: null } }, _avg: { skor: true } }),
    prisma.rating.aggregate({ _avg: { skor: true } }),
  ]);

  const konsistensiPelaporanPersen =
    totalDistribusi > 0 ? Math.round((distribusiDikonfirmasiSekolah / totalDistribusi) * 100) : null;
  const partisipasiOrangtuaPersen =
    totalSiswa > 0 ? Math.round((siswaDenganKonfirmasi.length / totalSiswa) * 100) : null;

  return NextResponse.json({
    sppgAktif,
    totalSekolah,
    konsistensiPelaporanPersen,
    partisipasiOrangtuaPersen,
    kepuasanOrangtua: ratingOrangtua._avg.skor,
    kepuasanKeseluruhan: ratingSemua._avg.skor,
  });
}
