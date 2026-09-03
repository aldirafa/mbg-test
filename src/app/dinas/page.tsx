import { requireRole } from "@/lib/auth-helpers";

// Dashboard Dinas/Admin: notifikasi flag triangulasi otomatis
// (Bagian 4 & 5.4 Concept Note - inti pembeda dari sistem existing Sumedang).
// TODO: job triangulasi otomatis & tabel flag_triangulasi belum dibangun --
// lihat README bagian "Belum dikerjakan".
export default async function DinasPage() {
  await requireRole(["dinas", "admin"]);

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Dashboard Dinas / Admin</h1>
      <p className="text-sm text-neutral-500">
        Daftar flag ketidaksesuaian data hasil triangulasi (Fase 5 roadmap teknis) -- menyusul.
      </p>
    </main>
  );
}
