import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMingguIni, KENDALA_ITEMS, PERSEPSI_ITEMS } from "@/lib/refleksi-mingguan";

// Refleksi mingguan sekolah (feedback tim Prof Elly, 20 Sep) -- upsert 1 record per
// sekolah per minggu (periodeMulai = Senin minggu ini, WIB), bukan histori tak
// terbatas. GET buat cek udah/belum isi minggu ini + ambil isian kalau ada (biar bisa
// diedit ulang dalam minggu yang sama); POST buat submit/update.
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "sekolah") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sekolah = await prisma.sekolah.findUnique({ where: { userId: session.user.id } });
  if (!sekolah) {
    return NextResponse.json({ error: "Data sekolah tidak ditemukan untuk akun ini" }, { status: 404 });
  }

  const periodeMulai = getMingguIni();
  const refleksi = await prisma.refleksiMingguan.findUnique({
    where: { sekolahId_periodeMulai: { sekolahId: sekolah.id, periodeMulai } },
  });

  return NextResponse.json({ periodeMulai, refleksi });
}

const kendalaJawabanSchema = z.record(z.string(), z.enum(["sudah_diselesaikan", "belum_diselesaikan", "tidak"]));
const persepsiJawabanSchema = z.record(z.string(), z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]));

const bodySchema = z.object({
  kendalaJawaban: kendalaJawabanSchema,
  kendalaLainnyaTeks: z.string().optional(),
  persepsiJawaban: persepsiJawabanSchema,
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
  const { kendalaJawaban, kendalaLainnyaTeks, persepsiJawaban } = parsed.data;

  // Semua item wajib dijawab (kendala 5 item, persepsi 5 item) -- validasi kelengkapan
  // di server, bukan cuma di client, biar rekap Dinas gak bolong.
  const kendalaLengkap = KENDALA_ITEMS.every((item) => kendalaJawaban[item.id] != null);
  const persepsiLengkap = PERSEPSI_ITEMS.every((item) => persepsiJawaban[item.id] != null);
  if (!kendalaLengkap || !persepsiLengkap) {
    return NextResponse.json({ error: "Mohon jawab semua pertanyaan sebelum mengirim" }, { status: 400 });
  }

  const periodeMulai = getMingguIni();

  const refleksi = await prisma.refleksiMingguan.upsert({
    where: { sekolahId_periodeMulai: { sekolahId: sekolah.id, periodeMulai } },
    create: {
      sekolahId: sekolah.id,
      periodeMulai,
      kendalaJawaban,
      kendalaLainnyaTeks: kendalaLainnyaTeks || null,
      persepsiJawaban,
    },
    update: {
      kendalaJawaban,
      kendalaLainnyaTeks: kendalaLainnyaTeks || null,
      persepsiJawaban,
    },
  });

  return NextResponse.json({ refleksi });
}
