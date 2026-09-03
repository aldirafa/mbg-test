import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  distribusiId: z.string(),
  siswaId: z.string(),
  statusTerima: z.enum(["diterima", "tidak_diterima", "ada_masalah"]),
  catatan: z.string().optional(),
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
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
  const { distribusiId, siswaId, statusTerima, catatan } = parsed.data;

  // Pastikan siswa ini beneran anaknya akun yang login.
  const siswa = await prisma.siswa.findFirst({ where: { id: siswaId, orangtuaId: orangtua.id } });
  if (!siswa) {
    return NextResponse.json({ error: "Data siswa tidak ditemukan untuk akun ini" }, { status: 403 });
  }

  const existing = await prisma.konfirmasiOrangtua.findFirst({
    where: { distribusiId, siswaId },
    orderBy: { createdAt: "desc" },
  });

  const konfirmasi = existing
    ? await prisma.konfirmasiOrangtua.update({
        where: { id: existing.id },
        data: { statusTerima, catatan },
      })
    : await prisma.konfirmasiOrangtua.create({
        data: { distribusiId, siswaId, statusTerima, catatan },
      });

  return NextResponse.json({ konfirmasi });
}
