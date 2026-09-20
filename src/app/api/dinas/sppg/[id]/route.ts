import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  provinsi: z.string().optional(),
  kabupatenKota: z.string().optional(),
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

  const sppg = await prisma.sppg.findUnique({ where: { id } });
  if (!sppg) {
    return NextResponse.json({ error: "SPPG tidak ditemukan" }, { status: 404 });
  }

  const { provinsi, kabupatenKota } = parsed.data;

  const updated = await prisma.sppg.update({
    where: { id },
    data: {
      ...(provinsi !== undefined ? { provinsi: provinsi || null } : {}),
      ...(kabupatenKota !== undefined ? { kabupatenKota: kabupatenKota || null } : {}),
    },
  });

  return NextResponse.json({ sppg: updated });
}
