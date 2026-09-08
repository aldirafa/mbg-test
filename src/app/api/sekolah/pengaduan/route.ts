import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Fase 2, Bagian 6.5 -- kanal pengaduan trackable penuh, beda dari komplain ringkas
// distribusi.catatan (MVP). distribusiId opsional -- gak harus terikat 1 pengiriman.
const bodySchema = z.object({
  isi: z.string().min(1),
  distribusiId: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "sekolah") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sekolah = await prisma.sekolah.findUnique({ where: { userId: session.user.id } });
  if (!sekolah) {
    return NextResponse.json({ error: "Data sekolah tidak ditemukan untuk akun ini" }, { status: 404 });
  }
  const pengaduan = await prisma.pengaduan.findMany({
    where: { sekolahId: sekolah.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ pengaduan });
}

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

  const pengaduan = await prisma.pengaduan.create({
    data: {
      sekolahId: sekolah.id,
      sppgId: sekolah.sppgId,
      distribusiId: parsed.data.distribusiId || null,
      isi: parsed.data.isi,
    },
  });

  return NextResponse.json({ pengaduan });
}
