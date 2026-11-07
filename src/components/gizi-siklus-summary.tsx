"use client";

import { Caption1, Text } from "@fluentui/react-components";
import { TrafficBadge } from "@/components/ui/expandable";
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

function Nilai({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="flex flex-col">
      <Caption1 className="text-fg3">{label}</Caption1>
      <Text weight="semibold" className="tabular-nums">
        {formatAngkaID(value)} <Caption1 className="text-fg3">{unit}</Caption1>
      </Text>
    </div>
  );
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
    <div className="flex flex-col gap-2">
      <Caption1 className="font-semibold text-fg2">Ringkasan gizi per siklus</Caption1>
      <div className="grid gap-2 sm:grid-cols-2">
        {perSiklus.map(([siklus, total]) => {
          const hasil =
            jenjang && (untukWaktu === "pagi" || untukWaktu === "siang") ? evaluasiGizi(total, jenjang, untukWaktu) : null;
          return (
            <div key={siklus} className="rounded-fluent-m border border-stroke2 bg-bg2 p-3">
              <div className="flex items-center justify-between gap-2">
                <Text weight="semibold">Siklus {siklus}</Text>
                {hasil ? (
                  <TrafficBadge status={hasil.status}>{LABEL_STATUS_GIZI[hasil.status]}</TrafficBadge>
                ) : (
                  <Caption1 className="text-fg3">Belum ada standar evaluasi</Caption1>
                )}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Nilai label="Energi" value={total.energi} unit="kkal" />
                <Nilai label="Protein" value={total.proteinHewani + total.proteinNabati} unit="g" />
                <Nilai label="Lemak" value={total.lemak} unit="g" />
                <Nilai label="Karbo" value={total.karbohidrat} unit="g" />
              </div>
            </div>
          );
        })}
      </div>
      {jenjang && jenjang !== "SMA" && (
        <Caption1 className="text-fg3">
          Evaluasi BGN baru tersedia utk jenjang SMA. Sekolah ini jenjang {jenjang}, belum ada standar.
        </Caption1>
      )}
    </div>
  );
}
