import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Fase 2, Bagian 6.4 -- rating berkala Sekolah -> SPPG. MVP: sekolah bisa ngirim kapan
// aja (belum ada pembatasan "sekali per minggu/bulan" secara ketat, lihat README),
// riwayat semua tersimpan, rata-rata jadi skor SPPG.
const bodySchema = z.object({
  skor: z.number().int().min(1).max(5),
  catatan: z.string().optional(),
});

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

  const rating = await prisma.rating.create({
    data: {
      sppgId: sekolah.sppgId,
      sekolahId: sekolah.id,
      skor: parsed.data.skor,
      catatan: parsed.data.catatan || null,
    },
  });

  return NextResponse.json({ rating });
}
