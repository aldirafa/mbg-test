import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["dinas", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const pengaduan = await prisma.pengaduan.findMany({
    orderBy: { createdAt: "desc" },
    include: { sekolah: true, orangtua: true, sppg: true },
  });
  return NextResponse.json({ pengaduan });
}
