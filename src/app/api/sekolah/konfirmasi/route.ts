import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkTriangulasi } from "@/lib/triangulasi";
import { itemGagal, ringkasanItemGagal } from "@/lib/bgn-checklist";
import { klasifikasiKetepatanWaktu } from "@/lib/ketepatan-waktu";

const BATAS_JAM = 4;

const bodySchema = z.object({
  distribusiId: z.string(),
  waktuTerima: z.string(),
  porsiDiterimaUmum: z.number().int().min(0),
  porsiDiterimaKhusus: z.number().int().min(0),
  layakCount: z.number().int().min(0),
  tidakLayakCount: z.number().int().min(0),
  checklistBgn: z.record(z.string(), z.boolean()),
});

// Alur konfirmasi penerimaan (revisi rapat tim 14 Sep): sekarang wajib isi waktu terima
// (dicek otomatis vs batas 4 jam sejak waktuKirim), pecahan porsi umum/khusus, hasil
// hitung layak/tidak layak, & checklist pra-penerimaan BGN penuh (src/lib/bgn-checklist.ts).
// Kalau ADA item checklist WAJIB yang gagal, ATAU waktu terima > 4 jam sejak dikirim,
// penerimaan diblokir -- distribusi otomatis jadi "bermasalah" (bukan "diterima") dengan
// catatan ringkasan kegagalan, masuk ke alur yang sama kayak komplain/checkTriangulasi
// (bukan entitas rejection baru).
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "sekolah") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sekolah = await prisma.sekolah.findUnique({ where: { userId: session.user.id } });
  if (!sekolah) {
    return NextResponse.json({ error: "Data sekolah tidak ditemukan untuk akun ini" }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
  const { distribusiId, waktuTerima, porsiDiterimaUmum, porsiDiterimaKhusus, layakCount, tidakLayakCount, checklistBgn } =
    parsed.data;

  const waktuTerimaDate = new Date(waktuTerima);
  if (Number.isNaN(waktuTerimaDate.getTime())) {
    return NextResponse.json({ error: "Waktu terima wajib diisi dengan tanggal/jam yang valid" }, { status: 400 });
  }

  const existing = await prisma.distribusi.findFirst({
    where: { id: distribusiId, sekolahId: sekolah.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Distribusi tidak ditemukan" }, { status: 404 });
  }
  if (existing.status !== "dikirim") {
    return NextResponse.json({ error: "Distribusi ini sudah dikonfirmasi/dilaporkan sebelumnya" }, { status: 409 });
  }

  const masalah: string[] = [];

  if (existing.waktuKirim) {
    const selisihJam = (waktuTerimaDate.getTime() - existing.waktuKirim.getTime()) / (1000 * 60 * 60);
    if (selisihJam > BATAS_JAM) {
      masalah.push(
        `Waktu terima melebihi batas ${BATAS_JAM} jam sejak dikirim (selisih ${selisihJam.toFixed(1)} jam).`
      );
    }
  }

  const gagal = itemGagal(checklistBgn);
  if (gagal.length > 0) {
    masalah.push(ringkasanItemGagal(checklistBgn));
  }

  const bermasalah = masalah.length > 0;

  // Klasifikasi ketepatan waktu (rekap statistik Dinas) -- TERPISAH dari cek batas 4 jam
  // BGN di atas (itu tetap jadi alasan "bermasalah"; ini murni buat statistik, gak
  // mempengaruhi status distribusi). Cuma dihitung kalau waktuKirim ada.
  const ketepatanWaktu = existing.waktuKirim
    ? klasifikasiKetepatanWaktu(existing.waktuKirim, waktuTerimaDate)
    : null;

  const distribusi = await prisma.distribusi.update({
    where: { id: distribusiId },
    data: {
      status: bermasalah ? "bermasalah" : "diterima",
      waktuTerima: waktuTerimaDate,
      porsiDiterima: porsiDiterimaUmum + porsiDiterimaKhusus,
      porsiDiterimaUmum,
      porsiDiterimaKhusus,
      layakCount,
      tidakLayakCount,
      checklistBgn,
      ketepatanWaktu,
      catatan: bermasalah ? masalah.join(" ") : null,
    },
    include: { menu: { include: { sppg: true } } },
  });

  if (bermasalah) {
    await checkTriangulasi(distribusi.id);
  }

  return NextResponse.json({ distribusi, bermasalah });
}
