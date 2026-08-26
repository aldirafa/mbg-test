import { PrismaClient } from "@prisma/client";

// Prisma Client singleton -- mencegah pembuatan koneksi baru di setiap hot-reload saat dev.
// Lihat: https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
