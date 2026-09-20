import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Gate onboarding formulir persetujuan orang tua (feedback tim Prof Elly, 20 Sep) --
// SEBELUM orang tua bisa pakai fitur harian aplikasi (konfirmasi terima, rating,
// pengaduan), tiap anak yang terhubung ke akun ini wajib punya 1 record
// PersetujuanOrangtua (keputusan: per ANAK, bukan per akun -- bersedia & info alergi
// bisa beda per anak, lihat komentar di schema.prisma). GET dipakai buat cek status
// & render identitas siswa read-only; POST buat submit/ubah 1 formulir per anak.

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "orangtua") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orangtua = await prisma.orangtua.findUnique({
    where: { userId: session.user.id },
    include: {
      siswa: {
        include: { sekolah: { select: { namaSekolah: true } }, persetujuanOrangtua: true },
      },
    },
  });
  if (!orangtua) {
    return NextResponse.json({ error: "Data orangtua tidak ditemukan untuk akun ini" }, { status: 404 });
  }

  const children = orangtua.siswa.map((siswa) => ({
    siswa: {
      id: siswa.id,
      nama: siswa.nama,
      kelas: siswa.kelas,
      namaSekolah: siswa.sekolah.namaSekolah,
    },
    orangtua: { nama: orangtua.nama, noWa: orangtua.noWa },
    persetujuan: siswa.persetujuanOrangtua,
  }));

  const semuaSudahMengisi = children.every((c) => c.persetujuan != null);

  return NextResponse.json({ children, semuaSudahMengisi });
}

const bodySchema = z.object({
  siswaId: z.string(),
  noHpOrangTua: z.string().min(1, "Nomor HP wajib diisi"),
  bersedia: z.boolean(),
  alasanTidakBersedia: z.string().optional(),
  adaAlergi: z.boolean(),
  jenisAlergi: z.string().optional(),
  namaTandaTangan: z.string().min(1, "Nama untuk tanda tangan wajib diisi"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "orangtua") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orangtua = await prisma.orangtua.findUnique({ where: { userId: session.user.id } });
  if (!orangtua) {
    return NextResponse.json({ error: "Data orangtua tidak ditemukan untuk akun ini" }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
  }
  const { siswaId, noHpOrangTua, bersedia, alasanTidakBersedia, adaAlergi, jenisAlergi, namaTandaTangan } =
    parsed.data;

  // Pastikan siswa ini beneran anaknya akun yang login.
  const siswa = await prisma.siswa.findFirst({ where: { id: siswaId, orangtuaId: orangtua.id } });
  if (!siswa) {
    return NextResponse.json({ error: "Data siswa tidak ditemukan untuk akun ini" }, { status: 403 });
  }

  const data = {
    noHpOrangTua,
    bersedia,
    alasanTidakBersedia: bersedia ? null : alasanTidakBersedia || null,
    adaAlergi,
    jenisAlergi: adaAlergi ? jenisAlergi || null : null,
    namaTandaTangan,
  };

  const persetujuan = await prisma.persetujuanOrangtua.upsert({
    where: { siswaId },
    create: { siswaId, ...data },
    update: data,
  });

  return NextResponse.json({ persetujuan });
}
