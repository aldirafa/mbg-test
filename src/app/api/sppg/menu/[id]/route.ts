import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadPhoto } from "@/lib/storage";

async function getOwnedMenu(sppgId: string, id: string) {
  return prisma.menuHarian.findFirst({
    where: { id, sppgId },
    include: { distribusi: true },
  });
}

const BELUM_BOLEH_UBAH =
  "Menu ini sudah dikonfirmasi atau dilaporkan sekolah, jadi tidak bisa diubah/dihapus lagi.";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "sppg") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sppg = await prisma.sppg.findUnique({ where: { userId: session.user.id } });
  if (!sppg) {
    return NextResponse.json({ error: "Data SPPG tidak ditemukan untuk akun ini" }, { status: 404 });
  }

  const { id } = await params;
  const menu = await getOwnedMenu(sppg.id, id);
  if (!menu) {
    return NextResponse.json({ error: "Menu tidak ditemukan" }, { status: 404 });
  }
  if (menu.distribusi.some((d) => d.status !== "dikirim")) {
    return NextResponse.json({ error: BELUM_BOLEH_UBAH }, { status: 409 });
  }

  const formData = await req.formData();
  const deskripsi = String(formData.get("deskripsi") || "").trim();
  const jumlahPorsi = Number(formData.get("jumlahPorsi"));
  const foto = formData.get("foto");

  if (!deskripsi || !Number.isFinite(jumlahPorsi) || jumlahPorsi <= 0) {
    return NextResponse.json({ error: "Deskripsi & jumlah porsi wajib diisi dengan benar" }, { status: 400 });
  }

  let fotoUrl = menu.fotoUrl;
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

  const updated = await prisma.menuHarian.update({
    where: { id: menu.id },
    data: { deskripsi, jumlahPorsi, fotoUrl },
    include: { distribusi: { include: { sekolah: true } } },
  });

  return NextResponse.json({ menu: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "sppg") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sppg = await prisma.sppg.findUnique({ where: { userId: session.user.id } });
  if (!sppg) {
    return NextResponse.json({ error: "Data SPPG tidak ditemukan untuk akun ini" }, { status: 404 });
  }

  const { id } = await params;
  const menu = await getOwnedMenu(sppg.id, id);
  if (!menu) {
    return NextResponse.json({ error: "Menu tidak ditemukan" }, { status: 404 });
  }
  if (menu.distribusi.some((d) => d.status !== "dikirim")) {
    return NextResponse.json({ error: BELUM_BOLEH_UBAH }, { status: 409 });
  }

  const distribusiIds = menu.distribusi.map((d) => d.id);
  await prisma.$transaction([
    prisma.konfirmasiOrangtua.deleteMany({ where: { distribusiId: { in: distribusiIds } } }),
    prisma.distribusi.deleteMany({ where: { menuId: menu.id } }),
    prisma.menuHarian.delete({ where: { id: menu.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
