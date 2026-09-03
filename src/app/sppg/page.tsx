import { requireRole } from "@/lib/auth-helpers";
import { SppgDashboard } from "@/components/sppg-dashboard";

export default async function SppgPage() {
  await requireRole("sppg");
  return <SppgDashboard />;
}
