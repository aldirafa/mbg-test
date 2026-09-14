import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadPhoto } from "@/lib/storage";
import { parseMenuItemsField } from "@/lib/menu-item-schema";

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
    include: { distribusi: { include: { sekolah: true } }, items: true },
    take: 20,
  });

  return NextResponse.json({ menu });
}

// Menu sekarang ditarget ke SATU sekolah + SATU waktu makan (pagi/siang) per upload --
// ganti total dari perilaku lama yang broadcast otomatis ke semua sekolah di
// sppg.sekolahList (revisi rapat tim 14 Sep). TODO produk final: mekanisme assign
// SPPG<->sekolah masih prototype -- sekarang semua sekolah test dianggap dilayani SPPG
// yang sama, dropdown-nya diisi dari sppg.sekolahList apa adanya. Perlu didesain ulang
// bareng tim sebelum rilis (user secara eksplisit minta ini dicatat sbg TODO).
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

  const menu = await prisma.menuHarian.create({
    data: {
      sppgId: sppg.id,
      tanggal: waktuKirim,
      fotoUrl,
      jumlahPorsi: porsiUmum + porsiKhusus,
      porsiUmum,
      porsiKhusus,
      untukWaktu,
      nomorMenu,
      items: { create: items },
      distribusi: {
        create: {
          sekolahId: sekolah.id,
          status: "dikirim",
          waktuKirim,
        },
      },
    },
    include: { distribusi: { include: { sekolah: true } }, items: true },
  });

  return NextResponse.json({ menu }, { status: 201 });
}
