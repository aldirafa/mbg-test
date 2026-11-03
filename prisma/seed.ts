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

  // 5. Akun dummy orangtua tambahan buat testing tim peneliti (permintaan Teh Lingga,
  // 3 Nov) -- masing-masing 1 anak di SMAN 1 Garut.
  const orangtuaDummy = [
    { email: "orangtua1@mbgdigital.test", nama: "Ibu Rina", noWa: "0812-0000-0101", anak: "Aisyah", nisNisn: "1234567891", kelas: "X IPA 1" },
    { email: "orangtua2@mbgdigital.test", nama: "Bapak Dedi", noWa: "0812-0000-0102", anak: "Rizky", nisNisn: "1234567892", kelas: "X IPS 2" },
    { email: "orangtua3@mbgdigital.test", nama: "Ibu Yuni", noWa: "0812-0000-0103", anak: "Nayla", nisNisn: "1234567893", kelas: "XI IPA 1" },
    { email: "orangtua4@mbgdigital.test", nama: "Bapak Asep", noWa: "0812-0000-0104", anak: "Fajar", nisNisn: "1234567894", kelas: "XI IPS 1" },
    { email: "orangtua5@mbgdigital.test", nama: "Ibu Lilis", noWa: "0812-0000-0105", anak: "Salsa", nisNisn: "1234567895", kelas: "XII IPA 3" },
    { email: "orangtua6@mbgdigital.test", nama: "Bapak Hendra", noWa: "0812-0000-0106", anak: "Dimas", nisNisn: "1234567896", kelas: "XII IPS 2" },
  ];

  for (const d of orangtuaDummy) {
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: { nama: d.nama, email: d.email, passwordHash, role: "orangtua" },
    });
    const ortu = await prisma.orangtua.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, nama: d.nama, noWa: d.noWa },
    });
    await prisma.siswa.upsert({
      where: { nisNisn: d.nisNisn },
      update: {},
      create: {
        sekolahId: sekolah.id,
        nama: d.anak,
        nisNisn: d.nisNisn,
        kelas: d.kelas,
        orangtuaId: ortu.id,
      },
    });
  }

  // 6. Siswa tambahan tanpa akun orangtua -- buat uji coba Suara Anak ke ~8 anak
  // (7 siswa di atas + 1 ini).
  await prisma.siswa.upsert({
    where: { nisNisn: "1234567897" },
    update: {},
    create: {
      sekolahId: sekolah.id,
      nama: "Putri",
      nisNisn: "1234567897",
      kelas: "X IPA 2",
    },
  });

  console.log("Seed selesai. Akun buat login (password sama semua):");
  console.log(`  Password: ${DEV_PASSWORD}`);
  console.log("  dinas@mbgdigital.test     (Dinas/Admin)");
  console.log("  sppg@mbgdigital.test      (SPPG Melong Asih)");
  console.log("  sekolah@mbgdigital.test   (SMAN 1 Garut)");
  console.log("  orangtua@mbgdigital.test  (Ibu Siti, anak: Bilqis)");
  for (const d of orangtuaDummy) {
    console.log(`  ${d.email.padEnd(26)}(${d.nama}, anak: ${d.anak})`);
  }
  console.log("NIS/NISN buat Suara Anak: 1234567890 s.d. 1234567897");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
