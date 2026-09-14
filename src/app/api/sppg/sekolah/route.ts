import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Daftar sekolah yang dilayani SPPG ini -- dipakai buat dropdown target menu (satu menu
// = satu sekolah + satu waktu makan, lihat POST /api/sppg/menu) & panel ringkasan
// disabilitas/alergi. TODO produk final: assignment SPPG<->sekolah masih prototype
// (lihat catatan di src/app/api/sppg/menu/route.ts).
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "sppg") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sppg = await prisma.sppg.findUnique({
    where: { userId: session.user.id },
    include: {
      sekolahList: {
        select: {
          id: true,
          namaSekolah: true,
          jenjang: true,
          jumlahSiswa: true,
          disabilitasData: true,
          alergiData: true,
        },
      },
    },
  });
  if (!sppg) {
    return NextResponse.json({ error: "Data SPPG tidak ditemukan untuk akun ini" }, { status: 404 });
  }

  return NextResponse.json({ sekolahList: sppg.sekolahList });
}
