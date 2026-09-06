import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Urutan status tetap linear: terbuka -> ditindaklanjuti -> selesai. Dinas cuma bisa
// majuin, gak ada jalan mundur di MVP ini (kalau salah pencet, cukup langka utk perlu
// fitur "batalkan" sekarang -- bisa ditambah kalau ternyata dibutuhkan di pilot).
const NEXT_STATUS: Record<string, string | undefined> = {
  terbuka: "ditindaklanjuti",
  ditindaklanjuti: "selesai",
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["dinas", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const flag = await prisma.flagTriangulasi.findUnique({ where: { id } });
  if (!flag) {
    return NextResponse.json({ error: "Flag tidak ditemukan" }, { status: 404 });
  }

  const next = NEXT_STATUS[flag.status];
  if (!next) {
    return NextResponse.json({ error: "Flag ini sudah selesai" }, { status: 409 });
  }

  const updated = await prisma.flagTriangulasi.update({
    where: { id },
    data: { status: next as "ditindaklanjuti" | "selesai" },
  });

  return NextResponse.json({ flag: updated });
}
