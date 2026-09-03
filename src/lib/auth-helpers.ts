import { redirect } from "next/navigation";
import { auth } from "@/auth";

type AppRole = "sppg" | "sekolah" | "orangtua" | "dinas" | "admin";

// Panggil di awal server component halaman per-peran buat mastiin cuma role
// yang sesuai yang bisa akses. Redirect ke /login kalau belum masuk, atau ke
// dashboard peran dia sendiri kalau salah role.
export async function requireRole(allowed: AppRole | AppRole[]) {
  const session = await auth();
  const allowedList = Array.isArray(allowed) ? allowed : [allowed];

  if (!session?.user) {
    redirect("/login");
  }

  if (!allowedList.includes(session.user.role)) {
    const home: Record<AppRole, string> = {
      sppg: "/sppg",
      sekolah: "/sekolah",
      orangtua: "/orangtua",
      dinas: "/dinas",
      admin: "/dinas",
    };
    redirect(home[session.user.role] ?? "/login");
  }

  return session;
}
