import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatAngkaID } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  dikirim: "menunggu konfirmasi",
  diterima: "diterima",
  bermasalah: "ada kendala",
};

// Baris nilai gizi per kategori/siklus, dipakai bareng buat kedua model (lama & baru).
function barisGizi(label: string, energi: number, protein: number, lemak: number, karbohidrat: number) {
  return [
    `*NILAI GIZI ${label}*`,
    `Energi: ${formatAngkaID(energi)} kkal`,
    `Protein: ${formatAngkaID(protein)} g`,
    `Lemak: ${formatAngkaID(lemak)} g`,
    `Karbohidrat: ${formatAngkaID(karbohidrat)} g`,
  ];
}

type MenuItemLike = {
  siklus: number;
  namaMenu: string;
  energi: number;
  karbohidrat: number;
  lemak: number;
  proteinHewani: number;
  proteinNabati: number;
};

// Bangun baris "Menu:" + nilai gizi dari model item-per-item (MenuItem), dikelompokkan
// per siklus -- item boleh beda siklus dalam 1 upload (kesepakatan rapat tim 14 Sep).
// Kalau cuma ada 1 siklus, subheader "Siklus X" disembunyikan biar gak berisik.
function barisDariItems(items: MenuItemLike[]): string[] {
  const siklusList = [...new Set(items.map((i) => i.siklus))].sort((a, b) => a - b);
  const satuSiklus = siklusList.length <= 1;

  const lines: string[] = ["Menu:"];
  for (const siklus of siklusList) {
    const itemSiklus = items.filter((i) => i.siklus === siklus);
    if (!satuSiklus) lines.push(`Siklus ${siklus}:`);
    itemSiklus.forEach((it, i) => lines.push(`${i + 1}. ${it.namaMenu}`));
  }

  for (const siklus of siklusList) {
    const itemSiklus = items.filter((i) => i.siklus === siklus);
    const total = itemSiklus.reduce(
      (acc, it) => ({
        energi: acc.energi + it.energi,
        karbohidrat: acc.karbohidrat + it.karbohidrat,
        lemak: acc.lemak + it.lemak,
        protein: acc.protein + it.proteinHewani + it.proteinNabati,
      }),
      { energi: 0, karbohidrat: 0, lemak: 0, protein: 0 }
    );
    lines.push("", ...barisGizi(satuSiklus ? "" : `SIKLUS ${siklus}`, total.energi, total.protein, total.lemak, total.karbohidrat));
  }

  return lines;
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
    include: { menu: { include: { items: true } } },
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
      ? `diterima ${distribusi.porsiDiterima ?? distribusi.porsiDiterimaUmum ?? "?"}/${menu.jumlahPorsi} porsi`
      : STATUS_LABEL[distribusi.status] ?? distribusi.status;

  // Header: gabung tanggal + nomor menu (+ "SIKLUS n" kalau item2-nya cuma 1 siklus;
  // kalau item lebih dari 1 siklus, siklus ditampilkan per-item di bawah, bukan di header)
  // + waktu makan (pagi/siang, model baru). Data lama (sebelum field2 ini ada) bisa aja
  // null -- ditampilkan tanpa bagian itu, bukan error.
  const headerParts = [tanggal];
  if (menu.nomorMenu != null) {
    if (menu.items.length > 0) {
      const siklusSet = [...new Set(menu.items.map((i) => i.siklus))];
      headerParts.push(siklusSet.length === 1 ? `MENU ${menu.nomorMenu} SIKLUS ${siklusSet[0]}` : `MENU ${menu.nomorMenu}`);
    } else if (menu.siklus != null) {
      headerParts.push(`MENU ${menu.nomorMenu} SIKLUS ${menu.siklus}`);
    } else {
      headerParts.push(`MENU ${menu.nomorMenu}`);
    }
  }
  if (menu.untukWaktu) {
    headerParts.push(menu.untukWaktu === "pagi" ? "MAKAN PAGI" : "MAKAN SIANG");
  }

  const lines = [`*Info Menu MBG*`, headerParts.join(" / "), ""];

  if (menu.items.length > 0) {
    // Model baru (item-per-item).
    lines.push(...barisDariItems(menu.items));
  } else {
    // LEGACY: model lama, deskripsi tunggal + gizi flat Kategori I/II.
    const daftarMenu = (menu.deskripsi ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    lines.push(
      "Menu:",
      ...(daftarMenu.length > 0 ? daftarMenu.map((item, i) => `${i + 1}. ${item}`) : [menu.deskripsi ?? "-"])
    );

    const adaGiziKategoriI =
      menu.energiKategoriI != null && menu.proteinKategoriI != null && menu.lemakKategoriI != null && menu.karbohidratKategoriI != null;
    const adaGiziKategoriII =
      menu.energiKategoriII != null && menu.proteinKategoriII != null && menu.lemakKategoriII != null && menu.karbohidratKategoriII != null;

    if (adaGiziKategoriI) {
      lines.push("", ...barisGizi("KATEGORI I (SD)", menu.energiKategoriI!, menu.proteinKategoriI!, menu.lemakKategoriI!, menu.karbohidratKategoriI!));
    }
    if (adaGiziKategoriII) {
      lines.push("", ...barisGizi("KATEGORI II (SMP ke atas)", menu.energiKategoriII!, menu.proteinKategoriII!, menu.lemakKategoriII!, menu.karbohidratKategoriII!));
    }
  }

  lines.push("", `Status: ${statusText}`, "", `- ${sekolah.namaSekolah}`);

  return NextResponse.json({ text: lines.join("\n") });
}
