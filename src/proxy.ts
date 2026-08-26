import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Next.js 16 mengganti convention "middleware.ts" jadi "proxy.ts".
// Instance NextAuth ini dibuat dari authConfig (edge-safe, tanpa Prisma) --
// dipakai untuk redirect ke /login kalau belum authenticated. Instance auth
// lengkap (dengan Credentials provider + Prisma) ada di src/auth.ts.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
