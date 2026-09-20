import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { KENDALA_ITEMS, PERSEPSI_ITEMS } from "@/lib/refleksi-mingguan";
import { OPSI_ALASAN_SUKA, OPSI_PERBAIKAN } from "@/lib/suara-anak";
import { TZ_TIMEZONE } from "@/lib/waktu";

// Dashboard statistik Dinas (feedback tim Prof Elly, 20 Sep, "Dashboard dinas,
// summarised") -- SATU endpoint gabungan biar filter (Periode/Provinsi/Kabupaten-Kota/
// Jenjang) diterapkan konsisten ke semua bagian sekaligus, daripada 7 request terpisah.
//
// BANYAK bagian di sini adalah JUDGMENT CALL krn spek asli cuma nyebut nama metrik
// tanpa definisi presisi (mis. "persentase sekolah yang terpantau") -- tiap keputusan
// didokumentasikan inline di bawah & dirangkum ulang di README. Gampang diubah kalau
// definisi resminya beda.

function persen(bagian: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((bagian / total) * 1000) / 10; // 1 desimal
}

// Rata-rata "jam dalam sehari" dari sekumpulan Date, dihitung di zona WIB (biar
// konsisten sama input jam manual sekolah/SPPG -- src/lib/waktu.ts). Dikembalikan
// sbg "HH:MM"; null kalau gak ada data.
function rataRataJam(dates: Date[]): string | null {
  if (dates.length === 0) return null;
  const totalMenit = dates.reduce((acc, d) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ_TIMEZONE.WIB,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(d);
    const jam = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
    const menit = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
    return acc + jam * 60 + menit;
  }, 0);
  const rataMenit = Math.round(totalMenit / dates.length);
  const jj = Math.floor(rataMenit / 60) % 24;
  const mm = rataMenit % 60;
  return `${String(jj).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function tallyTop(lists: string[][], opsi: { value: string; label: string }[], topN = 5) {
  const count: Record<string, number> = {};
  for (const list of lists) {
    for (const v of list) count[v] = (count[v] ?? 0) + 1;
  }
  return Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([value, jumlah]) => ({ value, label: opsi.find((o) => o.value === value)?.label ?? value, jumlah }));
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || !["dinas", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sekarang = new Date();
  const bulan = Number(searchParams.get("bulan")) || sekarang.getUTCMonth() + 1; // 1-12
  const tahun = Number(searchParams.get("tahun")) || sekarang.getUTCFullYear();
  const provinsi = searchParams.get("provinsi") || undefined;
  const kabupatenKota = searchParams.get("kabupatenKota") || undefined;
  const jenjang = searchParams.get("jenjang") as "SD" | "SMP" | "SMA" | null;

  const periodeMulai = new Date(Date.UTC(tahun, bulan - 1, 1));
  const periodeAkhir = new Date(Date.UTC(tahun, bulan, 1)); // eksklusif

  const sekolahList = await prisma.sekolah.findMany({
    where: {
      ...(provinsi ? { provinsi } : {}),
      ...(kabupatenKota ? { kabupatenKota } : {}),
      ...(jenjang ? { jenjang } : {}),
    },
    select: { id: true },
  });
  const sekolahIds = sekolahList.map((s) => s.id);
  const totalSekolah = sekolahIds.length;

  const kosong = {
    periode: { bulan, tahun },
    filter: { provinsi: provinsi ?? null, kabupatenKota: kabupatenKota ?? null, jenjang: jenjang ?? null },
    totalSekolahCocokFilter: 0,
    ketepatanWaktu: { rataRataJam: {}, distribusi: { tepat_waktu: 0, terlambat_ringan: 0, terlambat_berat: 0 }, totalDiklasifikasi: 0 },
    porsi: { totalDikirim: 0, totalDiterima: 0, persenDiterima: null },
    refleksiSekolah: { persenSekolahMengisi: null, kendala: [], persepsi: [] },
    suaraAnak: { totalRespon: 0, penilaian: {}, kondisiHabis: {}, topDisukai: [], topPerbaikan: [] },
    ratingOrangtua: { rataRata: null, totalRating: 0 },
    dataDinas: { persenPelaporan: null, persenTerpantau: null, persenKendalaDitindaklanjuti: null, persenLaporanDiselesaikan: null },
  };
  if (totalSekolah === 0) return NextResponse.json(kosong);

  const distribusiList = await prisma.distribusi.findMany({
    where: { sekolahId: { in: sekolahIds }, menu: { tanggal: { gte: periodeMulai, lt: periodeAkhir } } },
    include: { menu: { select: { untukWaktu: true, jumlahPorsi: true } } },
  });

  // --- 1. Ketepatan Waktu Distribusi Makanan ---------------------------------------
  const kirimPagi = distribusiList.filter((d) => d.menu.untukWaktu === "pagi" && d.waktuKirim).map((d) => d.waktuKirim!);
  const kirimSiang = distribusiList.filter((d) => d.menu.untukWaktu === "siang" && d.waktuKirim).map((d) => d.waktuKirim!);
  const terimaPagi = distribusiList.filter((d) => d.menu.untukWaktu === "pagi" && d.waktuTerima).map((d) => d.waktuTerima!);
  const terimaSiang = distribusiList.filter((d) => d.menu.untukWaktu === "siang" && d.waktuTerima).map((d) => d.waktuTerima!);

  const diklasifikasi = distribusiList.filter((d) => d.ketepatanWaktu != null);
  const distribusiKetepatan = {
    tepat_waktu: diklasifikasi.filter((d) => d.ketepatanWaktu === "tepat_waktu").length,
    terlambat_ringan: diklasifikasi.filter((d) => d.ketepatanWaktu === "terlambat_ringan").length,
    terlambat_berat: diklasifikasi.filter((d) => d.ketepatanWaktu === "terlambat_berat").length,
  };

  // --- 2. % jumlah porsi (bulanan) -- diterima vs yang dikirim SPPG ----------------
  const totalDikirim = distribusiList.reduce((acc, d) => acc + (d.menu.jumlahPorsi ?? 0), 0);
  const totalDiterima = distribusiList.reduce((acc, d) => acc + (d.porsiDiterima ?? 0), 0);

  // --- 3. Rekap refleksi mingguan sekolah (minggu2 yang mulai dalam periode ini) ---
  const refleksiList = await prisma.refleksiMingguan.findMany({
    where: { sekolahId: { in: sekolahIds }, periodeMulai: { gte: periodeMulai, lt: periodeAkhir } },
  });
  const sekolahSudahIsi = new Set(refleksiList.map((r) => r.sekolahId));
  const kendalaRekap = KENDALA_ITEMS.map((item) => {
    const jawabanList = refleksiList
      .map((r) => (r.kendalaJawaban as Record<string, string>)[item.id])
      .filter((v): v is string => v != null);
    const total = jawabanList.length;
    return {
      id: item.id,
      pertanyaan: item.pertanyaan,
      total,
      sudah_diselesaikan: persen(jawabanList.filter((v) => v === "sudah_diselesaikan").length, total),
      belum_diselesaikan: persen(jawabanList.filter((v) => v === "belum_diselesaikan").length, total),
      tidak: persen(jawabanList.filter((v) => v === "tidak").length, total),
    };
  });
  const persepsiRekap = PERSEPSI_ITEMS.map((item) => {
    const jawabanList = refleksiList
      .map((r) => (r.persepsiJawaban as Record<string, number>)[item.id])
      .filter((v): v is number => v != null);
    const total = jawabanList.length;
    const rataRata = total > 0 ? Math.round((jawabanList.reduce((a, b) => a + b, 0) / total) * 10) / 10 : null;
    return { id: item.id, pertanyaan: item.pertanyaan, total, rataRataSkala1to5: rataRata };
  });

  // --- 4. Data Anak (Suara Anak) ----------------------------------------------------
  const feedbackList = await prisma.feedbackAnak.findMany({
    where: { distribusi: { sekolahId: { in: sekolahIds }, menu: { tanggal: { gte: periodeMulai, lt: periodeAkhir } } } },
    select: { suka: true, habis: true, penilaian: true, kondisiHabis: true, alasanSuka: true, perbaikanDiinginkan: true },
  });
  const totalRespon = feedbackList.length;
  const penilaianEfektif = feedbackList.map((f) => f.penilaian ?? (f.suka ? "suka" : "tidak_suka"));
  const kondisiHabisEfektif = feedbackList.map((f) => f.kondisiHabis ?? (f.habis ? "habis" : "sisa_banyak"));
  const penilaianBreakdown = {
    suka: persen(penilaianEfektif.filter((v) => v === "suka").length, totalRespon),
    biasa: persen(penilaianEfektif.filter((v) => v === "biasa").length, totalRespon),
    tidak_suka: persen(penilaianEfektif.filter((v) => v === "tidak_suka").length, totalRespon),
  };
  const kondisiHabisBreakdown = {
    habis: persen(kondisiHabisEfektif.filter((v) => v === "habis").length, totalRespon),
    sisa_sedikit: persen(kondisiHabisEfektif.filter((v) => v === "sisa_sedikit").length, totalRespon),
    sisa_banyak: persen(kondisiHabisEfektif.filter((v) => v === "sisa_banyak").length, totalRespon),
  };
  const topDisukai = tallyTop(feedbackList.map((f) => f.alasanSuka), OPSI_ALASAN_SUKA);
  const topPerbaikan = tallyTop(feedbackList.map((f) => f.perbaikanDiinginkan), OPSI_PERBAIKAN);

  // --- 5. Rating orangtua ------------------------------------------------------------
  // Rating dari orangtua discope lewat anak2 mereka yg sekolahnya masuk filter (Rating
  // orangtua gak nyimpen sekolahId langsung -- lihat komentar model Rating).
  const orangtuaIds = await prisma.orangtua
    .findMany({ where: { siswa: { some: { sekolahId: { in: sekolahIds } } } }, select: { id: true } })
    .then((rows) => rows.map((r) => r.id));
  const ratingOrangtuaList =
    orangtuaIds.length > 0
      ? await prisma.rating.findMany({
          where: { orangtuaId: { in: orangtuaIds }, createdAt: { gte: periodeMulai, lt: periodeAkhir } },
          select: { skor: true },
        })
      : [];
  const rataRataRating =
    ratingOrangtuaList.length > 0
      ? Math.round((ratingOrangtuaList.reduce((a, r) => a + r.skor, 0) / ratingOrangtuaList.length) * 10) / 10
      : null;

  // --- 6. Data Dinas -----------------------------------------------------------------
  // JUDGMENT CALL (definisi gak dirinci di spek asli):
  // - "terpantau"  = sekolah punya >=1 distribusi TERCATAT (SPPG udah kirim) di periode ini.
  // - "pelaporan"  = subset dari terpantau: sekolah yg BENERAN konfirmasi balik (status
  //                  udah "diterima"/"bermasalah", bukan cuma "dikirim" & didiemin).
  // - "kendala ditindaklanjuti" = FlagTriangulasi (masalah yg kedeteksi OTOMATIS oleh
  //                  sistem) yg statusnya udah bergerak dari "terbuka".
  // - "laporan diselesaikan"    = Pengaduan (komplain yg diajukan MANUAL) yg udah "selesai".
  const sekolahTerpantau = new Set(distribusiList.map((d) => d.sekolahId));
  const sekolahLapor = new Set(distribusiList.filter((d) => d.status !== "dikirim").map((d) => d.sekolahId));

  const flagList = await prisma.flagTriangulasi.findMany({
    where: { distribusi: { sekolahId: { in: sekolahIds }, menu: { tanggal: { gte: periodeMulai, lt: periodeAkhir } } } },
    select: { status: true },
  });
  const pengaduanList = await prisma.pengaduan.findMany({
    where: {
      createdAt: { gte: periodeMulai, lt: periodeAkhir },
      OR: [{ sekolahId: { in: sekolahIds } }, { distribusi: { sekolahId: { in: sekolahIds } } }],
    },
    select: { status: true },
  });

  return NextResponse.json({
    periode: { bulan, tahun },
    filter: { provinsi: provinsi ?? null, kabupatenKota: kabupatenKota ?? null, jenjang: jenjang ?? null },
    totalSekolahCocokFilter: totalSekolah,
    ketepatanWaktu: {
      rataRataJam: {
        kirimPagi: rataRataJam(kirimPagi),
        kirimSiang: rataRataJam(kirimSiang),
        terimaPagi: rataRataJam(terimaPagi),
        terimaSiang: rataRataJam(terimaSiang),
      },
      distribusi: distribusiKetepatan,
      totalDiklasifikasi: diklasifikasi.length,
    },
    porsi: { totalDikirim, totalDiterima, persenDiterima: persen(totalDiterima, totalDikirim) },
    refleksiSekolah: {
      persenSekolahMengisi: persen(sekolahSudahIsi.size, totalSekolah),
      kendala: kendalaRekap,
      persepsi: persepsiRekap,
    },
    suaraAnak: {
      totalRespon,
      penilaian: penilaianBreakdown,
      kondisiHabis: kondisiHabisBreakdown,
      topDisukai,
      topPerbaikan,
    },
    ratingOrangtua: { rataRata: rataRataRating, totalRating: ratingOrangtuaList.length },
    dataDinas: {
      persenPelaporan: persen(sekolahLapor.size, totalSekolah),
      persenTerpantau: persen(sekolahTerpantau.size, totalSekolah),
      persenKendalaDitindaklanjuti: persen(flagList.filter((f) => f.status !== "terbuka").length, flagList.length),
      persenLaporanDiselesaikan: persen(pengaduanList.filter((p) => p.status === "selesai").length, pengaduanList.length),
    },
  });
}
