import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadPhoto } from "@/lib/storage";
import { parseMenuItemsField } from "@/lib/menu-item-schema";

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

  const sppg = await prisma.sppg.findUnique({
    where: { userId: session.user.id },
    include: { sekolahList: true },
  });
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
  const sekolahId = String(formData.get("sekolahId") || "");
  const untukWaktu = String(formData.get("untukWaktu") || "");
  const porsiUmum = Number(formData.get("porsiUmum"));
  const porsiKhusus = Number(formData.get("porsiKhusus"));
  const nomorMenu = Number(formData.get("nomorMenu"));
  const waktuKirimRaw = String(formData.get("waktuKirim") || "");
  const foto = formData.get("foto");
  const items = parseMenuItemsField(formData.get("items"));

  const sekolah = sppg.sekolahList.find((s) => s.id === sekolahId);
  if (!sekolah) {
    return NextResponse.json({ error: "Sekolah tujuan tidak valid / tidak dilayani SPPG ini" }, { status: 400 });
  }
  if (untukWaktu !== "pagi" && untukWaktu !== "siang") {
    return NextResponse.json({ error: "Untuk waktu makan wajib diisi (Pagi/Siang)" }, { status: 400 });
  }
  if (!Number.isFinite(porsiUmum) || porsiUmum < 0 || !Number.isFinite(porsiKhusus) || porsiKhusus < 0 || porsiUmum + porsiKhusus <= 0) {
    return NextResponse.json({ error: "Porsi umum & porsi khusus wajib diisi dengan angka valid (total > 0)" }, { status: 400 });
  }
  if (!Number.isFinite(nomorMenu) || nomorMenu <= 0) {
    return NextResponse.json({ error: "Nomor menu wajib diisi" }, { status: 400 });
  }
  const waktuKirim = new Date(waktuKirimRaw);
  if (Number.isNaN(waktuKirim.getTime())) {
    return NextResponse.json({ error: "Waktu kirim wajib diisi dengan tanggal/jam yang valid" }, { status: 400 });
  }
  if (!items) {
    return NextResponse.json({ error: "Minimal 1 item menu, dengan semua nilai gizi terisi angka valid" }, { status: 400 });
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

  const existingDistribusiId = menu.distribusi[0]?.id;

  const updated = await prisma.menuHarian.update({
    where: { id: menu.id },
    data: {
      tanggal: waktuKirim,
      fotoUrl,
      jumlahPorsi: porsiUmum + porsiKhusus,
      porsiUmum,
      porsiKhusus,
      untukWaktu,
      nomorMenu,
      items: { deleteMany: {}, create: items },
      distribusi: existingDistribusiId
        ? { update: { where: { id: existingDistribusiId }, data: { sekolahId: sekolah.id, waktuKirim } } }
        : { create: { sekolahId: sekolah.id, status: "dikirim", waktuKirim } },
    },
    include: { distribusi: { include: { sekolah: true } }, items: true },
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
    prisma.menuItem.deleteMany({ where: { menuId: menu.id } }),
    prisma.distribusi.deleteMany({ where: { menuId: menu.id } }),
    prisma.menuHarian.delete({ where: { id: menu.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
