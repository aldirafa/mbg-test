import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Password dev/testing buat semua akun seed -- GANTI sebelum pilot beneran jalan.
const DEV_PASSWORD = "mbgdigital2026";

async function main() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

  // 1. Dinas / Admin
  await prisma.user.upsert({
    where: { email: "dinas@mbgdigital.test" },
    update: {},
    create: {
      nama: "Tim Dinas Garut",
      email: "dinas@mbgdigital.test",
      passwordHash,
      role: "dinas",
    },
  });

  // 2. SPPG
  const sppgUser = await prisma.user.upsert({
    where: { email: "sppg@mbgdigital.test" },
    update: {},
    create: {
      nama: "Admin SPPG Melong Asih",
      email: "sppg@mbgdigital.test",
      passwordHash,
      role: "sppg",
    },
  });
  const sppg = await prisma.sppg.upsert({
    where: { userId: sppgUser.id },
    update: {},
    create: {
      userId: sppgUser.id,
      namaSppg: "SPPG Melong Asih",
      alamat: "Jl. Melong Asih, Garut",
      kontak: "0812-0000-0001",
    },
  });

  // 3. Sekolah
  const sekolahUser = await prisma.user.upsert({
    where: { email: "sekolah@mbgdigital.test" },
    update: {},
    create: {
      nama: "Admin SMAN 1 Garut",
      email: "sekolah@mbgdigital.test",
      passwordHash,
      role: "sekolah",
    },
  });
  const sekolah = await prisma.sekolah.upsert({
    where: { userId: sekolahUser.id },
    update: {},
    create: {
      userId: sekolahUser.id,
      namaSekolah: "SMAN 1 Garut",
      alamat: "Jl. Merdeka, Garut",
      sppgId: sppg.id,
      jumlahSiswa: 900,
    },
  });

  // 4. Orangtua + siswa
  const orangtuaUser = await prisma.user.upsert({
    where: { email: "orangtua@mbgdigital.test" },
    update: {},
    create: {
      nama: "Ibu Siti",
      email: "orangtua@mbgdigital.test",
      passwordHash,
      role: "orangtua",
    },
  });
  const orangtua = await prisma.orangtua.upsert({
    where: { userId: orangtuaUser.id },
    update: {},
    create: {
      userId: orangtuaUser.id,
      nama: "Ibu Siti",
      noWa: "0812-0000-0099",
    },
  });

  await prisma.siswa.upsert({
    where: { nisNisn: "1234567890" },
    update: {},
    create: {
      sekolahId: sekolah.id,
      nama: "Bilqis",
      nisNisn: "1234567890",
      kelas: "XI IPA 2",
      orangtuaId: orangtua.id,
    },
  });

  console.log("Seed selesai. Akun buat login (password sama semua):");
  console.log(`  Password: ${DEV_PASSWORD}`);
  console.log("  dinas@mbgdigital.test     (Dinas/Admin)");
  console.log("  sppg@mbgdigital.test      (SPPG Melong Asih)");
  console.log("  sekolah@mbgdigital.test   (SMAN 1 Garut)");
  console.log("  orangtua@mbgdigital.test  (Ibu Siti, anak: Bilqis)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
