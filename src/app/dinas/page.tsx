import { requireRole } from "@/lib/auth-helpers";
import { DinasDashboard } from "@/components/dinas-dashboard";

// Dashboard Dinas/Admin: notifikasi flag triangulasi otomatis
// (Bagian 4 & 5.4 Concept Note - inti pembeda dari sistem existing Sumedang).
export default async function DinasPage() {
  await requireRole(["dinas", "admin"]);

  return <DinasDashboard />;
}
