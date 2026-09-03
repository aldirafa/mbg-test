import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "orangtua") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orangtua = await prisma.orangtua.findUnique({
    where: { userId: session.user.id },
    include: { siswa: { include: { sekolah: true } } },
  });
  if (!orangtua) {
    return NextResponse.json({ error: "Data orangtua tidak ditemukan untuk akun ini" }, { status: 404 });
  }

  const children = await Promise.all(
    orangtua.siswa.map(async (siswa) => {
      const distribusi = await prisma.distribusi.findFirst({
        where: { sekolahId: siswa.sekolahId },
        orderBy: { waktuKirim: "desc" },
        include: { menu: true },
      });

      const konfirmasi = distribusi
        ? await prisma.konfirmasiOrangtua.findFirst({
            where: { distribusiId: distribusi.id, siswaId: siswa.id },
            orderBy: { createdAt: "desc" },
          })
        : null;

      return {
        siswa: { id: siswa.id, nama: siswa.nama, kelas: siswa.kelas },
        sekolah: { namaSekolah: siswa.sekolah.namaSekolah },
        distribusi,
        konfirmasi,
      };
    })
  );

  return NextResponse.json({ children });
}
