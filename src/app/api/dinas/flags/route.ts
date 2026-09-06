import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Daftar flag hasil job triangulasi (Fase 5) buat dashboard Dinas/Admin.
export async function GET() {
  const session = await auth();
  if (!session?.user || !["dinas", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const flags = await prisma.flagTriangulasi.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      distribusi: {
        include: {
          sekolah: true,
          menu: { include: { sppg: true } },
        },
      },
    },
  });

  return NextResponse.json({ flags });
}
