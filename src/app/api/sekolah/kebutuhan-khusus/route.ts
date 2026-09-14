import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { KATEGORI_DISABILITAS, KATEGORI_ALERGI } from "@/lib/kebutuhan-khusus";

const KODE_DISABILITAS = KATEGORI_DISABILITAS.map((k) => k.kode);
const KODE_ALERGI = KATEGORI_ALERGI.map((k) => k.kode);

const entriSchema = z.object({
  jumlah: z.number().int().min(0),
  catatan: z.string().trim().max(500).optional(),
});

const bodySchema = z.object({
  jenjang: z.enum(["SD", "SMP", "SMA"]),
  disabilitasData: z.record(z.string(), entriSchema),
  alergiData: z.record(z.string(), entriSchema),
});

function saring(data: Record<string, { jumlah: number; catatan?: string }>, kodeValid: string[]) {
  const out: Record<string, { jumlah: number; catatan?: string }> = {};
  for (const [kode, entri] of Object.entries(data)) {
    if (!kodeValid.includes(kode)) continue;
    if (entri.jumlah <= 0 && !entri.catatan) continue;
    out[kode] = entri;
  }
  return out;
}

// Data disabilitas (kategori A-E) & alergi/pantangan siswa, diisi sekolah -- dipakai SPPG
// buat nyiapin porsi khusus & jadi bahan panel ringkasan kebutuhan khusus (lihat
// src/lib/kebutuhan-khusus.ts).
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "sekolah") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sekolah = await prisma.sekolah.findUnique({ where: { userId: session.user.id } });
  if (!sekolah) {
    return NextResponse.json({ error: "Data sekolah tidak ditemukan untuk akun ini" }, { status: 404 });
  }

  return NextResponse.json({
    jenjang: sekolah.jenjang,
    disabilitasData: sekolah.disabilitasData ?? {},
    alergiData: sekolah.alergiData ?? {},
  });
}

export async function PATCH(req: Request) {
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

  const updated = await prisma.sekolah.update({
    where: { id: sekolah.id },
    data: {
      jenjang: parsed.data.jenjang,
      disabilitasData: saring(parsed.data.disabilitasData, KODE_DISABILITAS),
      alergiData: saring(parsed.data.alergiData, KODE_ALERGI),
    },
  });

  return NextResponse.json({
    jenjang: updated.jenjang,
    disabilitasData: updated.disabilitasData,
    alergiData: updated.alergiData,
  });
}
