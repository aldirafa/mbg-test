import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jarakMeter, RADIUS_GEOFENCE_METER } from "@/lib/geo";
import { checkTriangulasi } from "@/lib/triangulasi";

// Child Voice Interface (Fase 2, Bagian 6.7 Concept Note & Bagian 3.3 Dok Teknis).
// PUBLIK -- tanpa login, diakses lewat QR di lingkungan sekolah. NIS/NISN di sini CUMA
// dipakai buat resolve ke siswa & mastiin 1 anak gak ngisi 2x per distribusi (hari) --
// BUKAN dibalikin ke client atau ditampilkan bebas ke role selain admin (lihat
// src/app/api/dinas/feedback-anak/route.ts).
const bodySchema = z.object({
  nisNisn: z.string().min(1),
  suka: z.boolean(),
  habis: z.boolean(),
  catatanPerbaikan: z.string().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
  const { nisNisn, suka, habis, catatanPerbaikan, lat, lng } = parsed.data;

  const siswa = await prisma.siswa.findUnique({
    where: { nisNisn },
    include: { sekolah: true },
  });
  if (!siswa) {
    return NextResponse.json(
      { error: "NIS/NISN gak ketemu. Coba cek lagi, atau tanya Bapak/Ibu guru." },
      { status: 404 }
    );
  }

  const distribusi = await prisma.distribusi.findFirst({
    where: { sekolahId: siswa.sekolahId },
    orderBy: { waktuKirim: "desc" },
  });
  if (!distribusi) {
    return NextResponse.json(
      { error: "Belum ada menu hari ini buat sekolahmu." },
      { status: 404 }
    );
  }

  const existing = await prisma.feedbackAnak.findUnique({
    where: { distribusiId_siswaId: { distribusiId: distribusi.id, siswaId: siswa.id } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Kamu udah ngisi feedback buat menu hari ini. Makasih ya!" },
      { status: 409 }
    );
  }

  // Soft-flag, bukan tolak otomatis: kalau GPS gak dikasih/ditolak, atau titik acuan
  // sekolah belum diset, tetap disimpan tapi lokasiTerverifikasi = false buat ditinjau manual.
  let lokasiTerverifikasi = false;
  if (lat != null && lng != null && siswa.sekolah.lat != null && siswa.sekolah.lng != null) {
    const jarak = jarakMeter(lat, lng, siswa.sekolah.lat, siswa.sekolah.lng);
    lokasiTerverifikasi = jarak <= RADIUS_GEOFENCE_METER;
  }

  await prisma.feedbackAnak.create({
    data: {
      distribusiId: distribusi.id,
      siswaId: siswa.id,
      suka,
      habis,
      catatanPerbaikan: catatanPerbaikan || null,
      geotagLat: lat ?? null,
      geotagLng: lng ?? null,
      lokasiTerverifikasi,
    },
  });

  await checkTriangulasi(distribusi.id);

  return NextResponse.json({ ok: true });
}
