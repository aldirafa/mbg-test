import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  isi: z.string().min(1),
  sppgId: z.string(),
  distribusiId: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "orangtua") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orangtua = await prisma.orangtua.findUnique({ where: { userId: session.user.id } });
  if (!orangtua) {
    return NextResponse.json({ error: "Data orangtua tidak ditemukan untuk akun ini" }, { status: 404 });
  }
  const pengaduan = await prisma.pengaduan.findMany({
    where: { orangtuaId: orangtua.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ pengaduan });
}

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

  const anakDiSppgIni = await prisma.siswa.findFirst({
    where: { orangtuaId: orangtua.id, sekolah: { sppgId: parsed.data.sppgId } },
  });
  if (!anakDiSppgIni) {
    return NextResponse.json({ error: "SPPG ini tidak terhubung ke anak kamu" }, { status: 403 });
  }

  const pengaduan = await prisma.pengaduan.create({
    data: {
      orangtuaId: orangtua.id,
      sppgId: parsed.data.sppgId,
      distribusiId: parsed.data.distribusiId || null,
      isi: parsed.data.isi,
    },
  });

  return NextResponse.json({ pengaduan });
}
