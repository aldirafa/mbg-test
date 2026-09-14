"use client";

import { badgeClassForStatus } from "@/components/ui/expandable";
import { formatAngkaID } from "@/lib/format";
import { evaluasiGizi, LABEL_STATUS_GIZI, type TotalGiziSiklus, type JenjangBgn } from "@/lib/bgn";

type ItemGiziLike = {
  siklus: string | number;
  energi: string | number;
  karbohidrat: string | number;
  lemak: string | number;
  proteinHewani: string | number;
  proteinNabati: string | number;
};

// Jumlahin nilai gizi per siklus (item boleh beda siklus dalam 1 menu) -- dipakai bareng
// utk preview form upload SPPG & rincian riwayat (SPPG & Sekolah).
export function ringkasanPerSiklus(items: ItemGiziLike[]): [number, TotalGiziSiklus][] {
  const map = new Map<number, TotalGiziSiklus>();
  for (const it of items) {
    const s = Number(it.siklus);
    if (!Number.isFinite(s)) continue;
    const cur = map.get(s) ?? { energi: 0, karbohidrat: 0, lemak: 0, proteinHewani: 0, proteinNabati: 0 };
    cur.energi += Number(it.energi) || 0;
    cur.karbohidrat += Number(it.karbohidrat) || 0;
    cur.lemak += Number(it.lemak) || 0;
    cur.proteinHewani += Number(it.proteinHewani) || 0;
    cur.proteinNabati += Number(it.proteinNabati) || 0;
    map.set(s, cur);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
}

// Ringkasan gizi per siklus + badge evaluasi BGN (hijau/kuning/merah, SMA aja utk
// sekarang -- lihat src/lib/bgn.ts).
export function RingkasanGiziSiklus({
  items,
  jenjang,
  untukWaktu,
}: {
  items: ItemGiziLike[];
  jenjang: JenjangBgn | null;
  untukWaktu: "pagi" | "siang" | "";
}) {
  const perSiklus = ringkasanPerSiklus(items);
  if (perSiklus.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-neutral-600">Ringkasan gizi per siklus</p>
      {perSiklus.map(([siklus, total]) => {
        const hasil =
          jenjang && (untukWaktu === "pagi" || untukWaktu === "siang") ? evaluasiGizi(total, jenjang, untukWaktu) : null;
        return (
          <div key={siklus} className="rounded-md border border-neutral-200 p-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium text-neutral-800">Siklus {siklus}</span>
              {hasil ? (
                <span className={badgeClassForStatus(hasil.status)}>{LABEL_STATUS_GIZI[hasil.status]}</span>
              ) : (
                <span className="text-neutral-400">Belum ada standar evaluasi</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-neutral-500 mt-1.5">
              <span>Energi: {formatAngkaID(total.energi)} kkal</span>
              <span>Protein: {formatAngkaID(total.proteinHewani + total.proteinNabati)} g</span>
              <span>Lemak: {formatAngkaID(total.lemak)} g</span>
              <span>Karbohidrat: {formatAngkaID(total.karbohidrat)} g</span>
            </div>
          </div>
        );
      })}
      {jenjang && jenjang !== "SMA" && (
        <p className="text-xs text-neutral-400">
          Evaluasi BGN baru tersedia utk jenjang SMA. Sekolah ini jenjang {jenjang}, belum ada standar.
        </p>
      )}
    </div>
  );
}
