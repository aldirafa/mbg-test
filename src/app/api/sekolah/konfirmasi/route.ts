import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  distribusiId: z.string(),
  porsiDiterima: z.number().int().positive(),
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
  const { distribusiId, porsiDiterima } = parsed.data;

  const existing = await prisma.distribusi.findFirst({
    where: { id: distribusiId, sekolahId: sekolah.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Distribusi tidak ditemukan" }, { status: 404 });
  }

  const distribusi = await prisma.distribusi.update({
    where: { id: distribusiId },
    data: {
      status: "diterima",
      waktuTerima: new Date(),
      porsiDiterima,
    },
    include: { menu: { include: { sppg: true } } },
  });

  return NextResponse.json({ distribusi });
}
