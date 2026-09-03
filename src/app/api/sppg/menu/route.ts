import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadPhoto } from "@/lib/storage";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "sppg") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sppg = await prisma.sppg.findUnique({ where: { userId: session.user.id } });
  if (!sppg) {
    return NextResponse.json({ error: "Data SPPG tidak ditemukan untuk akun ini" }, { status: 404 });
  }

  const menu = await prisma.menuHarian.findMany({
    where: { sppgId: sppg.id },
    orderBy: { tanggal: "desc" },
    include: { distribusi: { include: { sekolah: true } } },
    take: 20,
  });

  return NextResponse.json({ menu });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "sppg") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sppg = await prisma.sppg.findUnique({
    where: { userId: session.user.id },
    include: { sekolahList: true },
  });
  if (!sppg) {
    return NextResponse.json({ error: "Data SPPG tidak ditemukan untuk akun ini" }, { status: 404 });
  }

  const formData = await req.formData();
  const deskripsi = String(formData.get("deskripsi") || "").trim();
  const jumlahPorsi = Number(formData.get("jumlahPorsi"));
  const foto = formData.get("foto");

  if (!deskripsi || !Number.isFinite(jumlahPorsi) || jumlahPorsi <= 0) {
    return NextResponse.json({ error: "Deskripsi & jumlah porsi wajib diisi dengan benar" }, { status: 400 });
  }

  let fotoUrl: string | undefined;
  if (foto instanceof File && foto.size > 0) {
    try {
      fotoUrl = await uploadPhoto(foto, "menu-harian");
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Upload foto gagal" },
        { status: 500 }
      );
    }
  }

  const now = new Date();
  const menu = await prisma.menuHarian.create({
    data: {
      sppgId: sppg.id,
      tanggal: now,
      deskripsi,
      fotoUrl,
      jumlahPorsi,
    },
  });

  // Otomatis distribusikan ke semua sekolah yang terhubung ke SPPG ini.
  if (sppg.sekolahList.length > 0) {
    await prisma.distribusi.createMany({
      data: sppg.sekolahList.map((sekolah) => ({
        menuId: menu.id,
        sekolahId: sekolah.id,
        status: "dikirim" as const,
        waktuKirim: now,
      })),
    });
  }

  const fullMenu = await prisma.menuHarian.findUnique({
    where: { id: menu.id },
    include: { distribusi: { include: { sekolah: true } } },
  });

  return NextResponse.json({ menu: fullMenu }, { status: 201 });
}
