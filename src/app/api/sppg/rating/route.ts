import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// SPPG cuma baca HASIL agregat (rata-rata & jumlah), bukan riwayat per-rater --
// biar identitas sekolah/orangtua yang ngasih rating tetap terjaga (role matrix Bagian 4).
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "sppg") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sppg = await prisma.sppg.findUnique({ where: { userId: session.user.id } });
  if (!sppg) {
    return NextResponse.json({ error: "Data SPPG tidak ditemukan untuk akun ini" }, { status: 404 });
  }

  const agg = await prisma.rating.aggregate({
    where: { sppgId: sppg.id },
    _avg: { skor: true },
    _count: true,
  });

  return NextResponse.json({ rataRata: agg._avg.skor, jumlah: agg._count });
}
