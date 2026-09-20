import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Daftar SPPG buat Dinas/Admin -- dipakai buat kelola profil provinsi/kabupaten-kota
// (feedback tim 20 Sep, buat filter dashboard statistik Dinas -- lihat SppgProfilManager).
export async function GET() {
  const session = await auth();
  if (!session?.user || !["dinas", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sppgList = await prisma.sppg.findMany({
    orderBy: { namaSppg: "asc" },
    select: { id: true, namaSppg: true, provinsi: true, kabupatenKota: true },
  });

  return NextResponse.json({ sppgList });
}
