// Field nilai gizi & nomor menu/siklus -- diminta tim Prof Elly (Teh Lingga) supaya ikut
// tampil di pesan siap-bagi ke sekolah (lihat src/app/api/sekolah/pesan-harian). WAJIB
// diisi di form upload/edit menu SPPG, meski kolomnya sendiri nullable di DB (lihat
// komentar di schema.prisma -- biar data menu lama gak rusak).
export const GIZI_FIELDS = [
  "nomorMenu",
  "siklus",
  "energiKategoriI",
  "proteinKategoriI",
  "lemakKategoriI",
  "karbohidratKategoriI",
  "energiKategoriII",
  "proteinKategoriII",
  "lemakKategoriII",
  "karbohidratKategoriII",
] as const;

export type GiziData = Record<(typeof GIZI_FIELDS)[number], number>;

export function parseGizi(formData: FormData): GiziData | null {
  const out: Partial<GiziData> = {};
  for (const field of GIZI_FIELDS) {
    const value = Number(formData.get(field));
    if (!Number.isFinite(value) || value <= 0) return null;
    out[field] = value;
  }
  return out as GiziData;
}
