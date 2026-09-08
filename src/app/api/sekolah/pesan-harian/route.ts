import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatAngkaID } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  dikirim: "menunggu konfirmasi",
  diterima: "diterima",
  bermasalah: "ada kendala",
};

// Baris nilai gizi per kategori, dipakai bareng buat Kategori I (SD) & Kategori II (SMP ke atas).
function barisGizi(label: string, energi: number, protein: number, lemak: number, karbohidrat: number) {
  return [
    `*NILAI GIZI ${label}*`,
    `Energi: ${formatAngkaID(energi)} kkal`,
    `Protein: ${formatAngkaID(protein)} g`,
    `Lemak: ${formatAngkaID(lemak)} g`,
    `Karbohidrat: ${formatAngkaID(karbohidrat)} g`,
  ];
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "sekolah") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sekolah = await prisma.sekolah.findUnique({ where: { userId: session.user.id } });
  if (!sekolah) {
    return NextResponse.json({ error: "Data sekolah tidak ditemukan untuk akun ini" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const distribusiId = searchParams.get("distribusiId");
  if (!distribusiId) {
    return NextResponse.json({ error: "distribusiId wajib diisi" }, { status: 400 });
  }

  const distribusi = await prisma.distribusi.findFirst({
    where: { id: distribusiId, sekolahId: sekolah.id },
    include: { menu: true },
  });
  if (!distribusi) {
    return NextResponse.json({ error: "Distribusi tidak ditemukan" }, { status: 404 });
  }

  const menu = distribusi.menu;
  const tanggal = menu.tanggal
    .toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    .toUpperCase();
  const statusText =
    distribusi.status === "diterima"
      ? `diterima ${distribusi.porsiDiterima ?? "?"}/${menu.jumlahPorsi} porsi`
      : STATUS_LABEL[distribusi.status] ?? distribusi.status;

  // Header: gabung tanggal + nomor menu/siklus kalau ada (data lama sebelum field ini
  // wajib bisa aja null -- ditampilkan tanpa bagian itu, bukan error).
  const headerParts = [tanggal];
  if (menu.nomorMenu != null && menu.siklus != null) {
    headerParts.push(`MENU ${menu.nomorMenu} SIKLUS ${menu.siklus}`);
  }

  const daftarMenu = menu.deskripsi
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const lines = [
    `*Info Menu MBG*`,
    headerParts.join(" / "),
    "",
    "Menu:",
    ...(daftarMenu.length > 0
      ? daftarMenu.map((item, i) => `${i + 1}. ${item}`)
      : [menu.deskripsi]),
  ];

  const adaGiziKategoriI =
    menu.energiKategoriI != null &&
    menu.proteinKategoriI != null &&
    menu.lemakKategoriI != null &&
    menu.karbohidratKategoriI != null;
  const adaGiziKategoriII =
    menu.energiKategoriII != null &&
    menu.proteinKategoriII != null &&
    menu.lemakKategoriII != null &&
    menu.karbohidratKategoriII != null;

  if (adaGiziKategoriI) {
    lines.push(
      "",
      ...barisGizi(
        "KATEGORI I (SD)",
        menu.energiKategoriI!,
        menu.proteinKategoriI!,
        menu.lemakKategoriI!,
        menu.karbohidratKategoriI!
      )
    );
  }
  if (adaGiziKategoriII) {
    lines.push(
      "",
      ...barisGizi(
        "KATEGORI II (SMP ke atas)",
        menu.energiKategoriII!,
        menu.proteinKategoriII!,
        menu.lemakKategoriII!,
        menu.karbohidratKategoriII!
      )
    );
  }

  lines.push("", `Status: ${statusText}`, "", `- ${sekolah.namaSekolah}`);

  return NextResponse.json({ text: lines.join("\n") });
}
