import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Fase 2, Bagian 6.4 -- rating berkala Orangtua -> SPPG. sppgId dikirim dari client
// (diambil dari data anak yang udah dimuat di /api/orangtua/menu-hari-ini), bukan
// ditebak server -- soalnya 1 orangtua bisa punya anak di sekolah/SPPG berbeda.
const bodySchema = z.object({
  sppgId: z.string(),
  skor: z.number().int().min(1).max(5),
  catatan: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "orangtua") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orangtua = await prisma.orangtua.findUnique({ where: { userId: session.user.id } });
  if (!orangtua) {
    return NextResponse.json({ error: "Data orangtua tidak ditemukan untuk akun ini" }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  // Pastikan sppgId ini beneran nyambung ke salah satu anaknya (lewat sekolah -> sppg),
  // biar orangtua gak bisa asal rating SPPG yang gak ada hubungannya.
  const anakDiSppgIni = await prisma.siswa.findFirst({
    where: { orangtuaId: orangtua.id, sekolah: { sppgId: parsed.data.sppgId } },
  });
  if (!anakDiSppgIni) {
    return NextResponse.json({ error: "SPPG ini tidak terhubung ke anak kamu" }, { status: 403 });
  }

  const rating = await prisma.rating.create({
    data: {
      sppgId: parsed.data.sppgId,
      orangtuaId: orangtua.id,
      skor: parsed.data.skor,
      catatan: parsed.data.catatan || null,
    },
  });

  return NextResponse.json({ rating });
}
