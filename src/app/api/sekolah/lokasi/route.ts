import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Titik acuan lokasi sekolah, dipakai buat geo-fence Child Voice Interface (Fase 2,
// radius 10m -- disepakati bareng user). Sekolah bisa set sendiri di sini; Dinas/Admin
// juga bisa nge-set/koreksi lewat /api/dinas/sekolah/[id]/lokasi.
const bodySchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "sekolah") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sekolah = await prisma.sekolah.findUnique({ where: { userId: session.user.id } });
  if (!sekolah) {
    return NextResponse.json({ error: "Data sekolah tidak ditemukan untuk akun ini" }, { status: 404 });
  }

  return NextResponse.json({ lat: sekolah.lat, lng: sekolah.lng });
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
    data: { lat: parsed.data.lat, lng: parsed.data.lng },
  });

  return NextResponse.json({ sekolah: updated });
}
