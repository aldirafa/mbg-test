import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Dipakai Dinas/Admin buat 2 hal sekaligus (digabung 1 endpoint krn sama-sama "profil
// sekolah" & selalu diedit dari baris yang sama di SekolahLokasiManager): titik acuan
// lokasi geo-fence CVI (lat/lng) & provinsi/kabupaten-kota teks bebas (feedback tim
// 20 Sep, buat filter dashboard statistik Dinas). Semua field opsional per-request --
// kirim cuma yang mau diubah.
const bodySchema = z.object({
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  provinsi: z.string().optional(),
  kabupatenKota: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["dinas", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const sekolah = await prisma.sekolah.findUnique({ where: { id } });
  if (!sekolah) {
    return NextResponse.json({ error: "Sekolah tidak ditemukan" }, { status: 404 });
  }

  const { lat, lng, provinsi, kabupatenKota } = parsed.data;

  const updated = await prisma.sekolah.update({
    where: { id },
    data: {
      ...(lat !== undefined ? { lat } : {}),
      ...(lng !== undefined ? { lng } : {}),
      ...(provinsi !== undefined ? { provinsi: provinsi || null } : {}),
      ...(kabupatenKota !== undefined ? { kabupatenKota: kabupatenKota || null } : {}),
    },
  });

  return NextResponse.json({ sekolah: updated });
}
