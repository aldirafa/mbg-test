import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Dinas lihat feedback anak (CVI) TERANONIMKAN -- nama & NIS/NISN siswa cuma ikut
// dibalikin kalau role-nya "admin" (bukan "dinas" biasa), sesuai kesepakatan konsep:
// NIS/NISN cuma buat cegah submit dobel & investigasi internal, bukan buat operasional
// harian Dinas. Data siswa tetap di-fetch di query (biar Prisma types-nya gak
// tergantung nilai runtime), penyaringannya di response shaping di bawah.
export async function GET() {
  const session = await auth();
  if (!session?.user || !["dinas", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.role === "admin";

  const feedback = await prisma.feedbackAnak.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      distribusi: { include: { menu: true, sekolah: true } },
      siswa: true,
    },
  });

  const data = feedback.map((f) => ({
    id: f.id,
    suka: f.suka,
    habis: f.habis,
    catatanPerbaikan: f.catatanPerbaikan,
    lokasiTerverifikasi: f.lokasiTerverifikasi,
    createdAt: f.createdAt,
    sekolah: { namaSekolah: f.distribusi.sekolah.namaSekolah },
    tanggal: f.distribusi.menu.tanggal,
    siswa: isAdmin ? { nama: f.siswa.nama, nisNisn: f.siswa.nisNisn } : undefined,
  }));

  return NextResponse.json({ feedback: data });
}
