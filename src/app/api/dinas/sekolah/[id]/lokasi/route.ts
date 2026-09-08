import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["dinas", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const sekolah = await prisma.sekolah.findUnique({ where: { id } });
  if (!sekolah) {
    return NextResponse.json({ error: "Sekolah tidak ditemukan" }, { status: 404 });
  }

  const updated = await prisma.sekolah.update({
    where: { id },
    data: { lat: parsed.data.lat, lng: parsed.data.lng },
  });

  return NextResponse.json({ sekolah: updated });
}
