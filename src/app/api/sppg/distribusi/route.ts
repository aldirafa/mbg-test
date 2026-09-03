import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  menuId: z.string(),
  sekolahId: z.string(),
});

// Tambah distribusi manual dari menu yang sudah ada ke sekolah lain
// (di luar auto-distribusi saat POST /api/sppg/menu). Berguna kalau SPPG
// melayani lebih dari satu sekolah.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "sppg") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sppg = await prisma.sppg.findUnique({ where: { userId: session.user.id } });
  if (!sppg) {
    return NextResponse.json({ error: "Data SPPG tidak ditemukan untuk akun ini" }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
  const { menuId, sekolahId } = parsed.data;

  const menu = await prisma.menuHarian.findFirst({ where: { id: menuId, sppgId: sppg.id } });
  if (!menu) {
    return NextResponse.json({ error: "Menu tidak ditemukan" }, { status: 404 });
  }

  const sekolah = await prisma.sekolah.findFirst({ where: { id: sekolahId, sppgId: sppg.id } });
  if (!sekolah) {
    return NextResponse.json({ error: "Sekolah tidak ditemukan" }, { status: 404 });
  }

  const distribusi = await prisma.distribusi.create({
    data: {
      menuId,
      sekolahId,
      status: "dikirim",
      waktuKirim: new Date(),
    },
  });

  return NextResponse.json({ distribusi }, { status: 201 });
}
