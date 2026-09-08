import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const NEXT_STATUS: Record<string, string | undefined> = {
  diterima: "ditindaklanjuti",
  ditindaklanjuti: "selesai",
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["dinas", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const pengaduan = await prisma.pengaduan.findUnique({ where: { id } });
  if (!pengaduan) {
    return NextResponse.json({ error: "Pengaduan tidak ditemukan" }, { status: 404 });
  }

  const next = NEXT_STATUS[pengaduan.status];
  if (!next) {
    return NextResponse.json({ error: "Pengaduan ini sudah selesai" }, { status: 409 });
  }

  const updated = await prisma.pengaduan.update({
    where: { id },
    data: { status: next as "ditindaklanjuti" | "selesai" },
  });

  return NextResponse.json({ pengaduan: updated });
}
