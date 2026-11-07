import { SuaraAnakForm } from "@/components/suara-anak-form";

// Publik -- tanpa login, diakses lewat QR di lingkungan sekolah (Child Voice
// Interface, Fase 2). Lokasi jadi lapis verifikasi kedua (radius 10m dari titik
// acuan sekolah), bukan gate akses -- kalau gagal, tetap disimpan buat ditinjau manual.
export default function SuaraAnakPage() {
  return <SuaraAnakForm />;
}
