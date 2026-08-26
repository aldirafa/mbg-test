import type { NextAuthConfig } from "next-auth";

// Config yang aman dijalankan di Edge runtime (middleware) -- TIDAK boleh
// mengimpor Prisma/bcrypt di sini. Logic Credentials provider yang butuh
// Prisma ada di src/auth.ts, digabung dengan config ini di sana.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublicRoute =
        nextUrl.pathname === "/login" ||
        nextUrl.pathname.startsWith("/api/auth");

      if (isPublicRoute) return true;
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as typeof session.user.role;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [], // diisi di src/auth.ts
} satisfies NextAuthConfig;
