import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const STATUS_LABEL: Record<string, string> = {
  dikirim: "menunggu konfirmasi",
  diterima: "diterima",
  bermasalah: "ada kendala",
};

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "sekolah") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sekolah = await prisma.sekolah.findUnique({ where: { userId: session.user.id } });
  if (!sekolah) {
    return NextResponse.json({ error: "Data sekolah tidak ditemukan untuk akun ini" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const distribusiId = searchParams.get("distribusiId");
  if (!distribusiId) {
    return NextResponse.json({ error: "distribusiId wajib diisi" }, { status: 400 });
  }

  const distribusi = await prisma.distribusi.findFirst({
    where: { id: distribusiId, sekolahId: sekolah.id },
    include: { menu: true },
  });
  if (!distribusi) {
    return NextResponse.json({ error: "Distribusi tidak ditemukan" }, { status: 404 });
  }

  const tanggal = distribusi.menu.tanggal.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const statusText =
    distribusi.status === "diterima"
      ? `diterima ${distribusi.porsiDiterima ?? "?"}/${distribusi.menu.jumlahPorsi} porsi`
      : STATUS_LABEL[distribusi.status] ?? distribusi.status;

  const text = [
    `Info Menu MBG - ${tanggal}`,
    `Menu: ${distribusi.menu.deskripsi}`,
    `Status: ${statusText}`,
    "",
    `- ${sekolah.namaSekolah}`,
  ].join("\n");

  return NextResponse.json({ text });
}
