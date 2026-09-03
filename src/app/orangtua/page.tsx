import { requireRole } from "@/lib/auth-helpers";
import { OrangtuaDashboard } from "@/components/orangtua-dashboard";

export default async function OrangtuaPage() {
  await requireRole("orangtua");
  return <OrangtuaDashboard />;
}
