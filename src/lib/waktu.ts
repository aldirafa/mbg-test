// Util zona waktu Indonesia (WIB/WITA/WIT) buat form yang minta input tanggal+jam manual
// (waktu kirim SPPG, waktu terima Sekolah) -- dipisah dari auto-Date.now() krn sekarang
// jam matang/kirim/terima dicatat manual sesuai kejadian sebenarnya, bukan waktu submit
// form (revisi rapat tim 14 Sep).

export const TZ_OPSI = [
  { value: "WIB", label: "WIB" },
  { value: "WITA", label: "WITA" },
  { value: "WIT", label: "WIT" },
] as const;

export type Tz = (typeof TZ_OPSI)[number]["value"];

export const TZ_OFFSET: Record<Tz, string> = { WIB: "+07:00", WITA: "+08:00", WIT: "+09:00" };
export const TZ_TIMEZONE: Record<Tz, string> = {
  WIB: "Asia/Jakarta",
  WITA: "Asia/Makassar",
  WIT: "Asia/Jayapura",
};

export function isoKeTanggalJam(iso: string, timeZone: string) {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { tanggal: `${get("year")}-${get("month")}-${get("day")}`, jam: `${get("hour")}:${get("minute")}` };
}

export function tanggalJamSekarang(timeZone: string = TZ_TIMEZONE.WIB) {
  return isoKeTanggalJam(new Date().toISOString(), timeZone);
}

export function tanggalJamTzKeIso(tanggal: string, jam: string, tz: Tz): string {
  return `${tanggal}T${jam}:00${TZ_OFFSET[tz]}`;
}
