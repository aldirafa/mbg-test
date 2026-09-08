// Haversine -- jarak antar 2 titik koordinat dalam meter. Dipakai buat geo-fence
// Child Voice Interface (Fase 2): radius toleransi 10m dari titik acuan sekolah,
// disepakati bareng user (bukan ±100-150m di draf dokumen awal).
export function jarakMeter(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // radius bumi, meter
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const RADIUS_GEOFENCE_METER = 10;
