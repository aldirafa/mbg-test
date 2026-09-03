import { requireRole } from "@/lib/auth-helpers";
import { SekolahDashboard } from "@/components/sekolah-dashboard";

export default async function SekolahPage() {
  await requireRole("sekolah");
  return <SekolahDashboard />;
}
