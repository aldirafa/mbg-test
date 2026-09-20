import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Daftar sekolah buat Dinas/Admin -- dipakai buat kelola titik acuan lokasi (geo-fence
// CVI) & profil provinsi/kabupaten-kota (filter dashboard statistik Dinas, feedback
// tim 20 Sep -- lihat SekolahLokasiManager & PATCH .../[id]/lokasi).
export async function GET() {
  const session = await auth();
  if (!session?.user || !["dinas", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sekolahList = await prisma.sekolah.findMany({
    orderBy: { namaSekolah: "asc" },
    select: { id: true, namaSekolah: true, lat: true, lng: true, provinsi: true, kabupatenKota: true },
  });

  return NextResponse.json({ sekolahList });
}
