import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// SPPG cuma baca pengaduan yang terkait diri sendiri (role matrix Bagian 4) -- gak bisa
// ubah status, itu wewenang Dinas.
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "sppg") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sppg = await prisma.sppg.findUnique({ where: { userId: session.user.id } });
  if (!sppg) {
    return NextResponse.json({ error: "Data SPPG tidak ditemukan untuk akun ini" }, { status: 404 });
  }
  const pengaduan = await prisma.pengaduan.findMany({
    where: { sppgId: sppg.id },
    orderBy: { createdAt: "desc" },
    include: { sekolah: true, orangtua: true },
  });
  return NextResponse.json({ pengaduan });
}
