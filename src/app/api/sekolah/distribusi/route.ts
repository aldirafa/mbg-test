import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "sekolah") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sekolah = await prisma.sekolah.findUnique({ where: { userId: session.user.id } });
  if (!sekolah) {
    return NextResponse.json({ error: "Data sekolah tidak ditemukan untuk akun ini" }, { status: 404 });
  }

  const distribusi = await prisma.distribusi.findMany({
    where: { sekolahId: sekolah.id },
    orderBy: { waktuKirim: "desc" },
    include: { menu: { include: { sppg: true } } },
    take: 20,
  });

  return NextResponse.json({ distribusi });
}
