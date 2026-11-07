"use client";

import { useEffect, useState } from "react";
import { Caption1, Skeleton, SkeletonItem } from "@fluentui/react-components";
import {
  BuildingFactoryRegular,
  ClipboardTaskListLtrRegular,
  HatGraduationRegular,
  HeartRegular,
  PeopleCommunityRegular,
  ShieldCheckmarkRegular,
  StarRegular,
} from "@fluentui/react-icons";
import { PublicShell } from "@/components/public-shell";
import { StatTile } from "@/components/ui/stat-tile";

type Stats = {
  sppgAktif: number;
  totalSekolah: number;
  konsistensiPelaporanPersen: number | null;
  partisipasiOrangtuaPersen: number | null;
  kepuasanOrangtua: number | null;
  kepuasanKeseluruhan: number | null;
};

// Snapshot kondisi sekarang (belum ada data historis buat indikator naik/turun).
export function TransparansiDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/publik/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  return (
    <PublicShell
      title="Transparansi MBG Digital"
      subtitle="Data agregat program Makan Bergizi Gratis, diperbarui otomatis, tanpa data pribadi."
    >
      {!stats && (
        <Skeleton aria-label="Memuat statistik" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonItem key={i} size={96} shape="rectangle" />
          ))}
        </Skeleton>
      )}

      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatTile icon={<BuildingFactoryRegular />} label="SPPG Aktif" value={stats.sppgAktif} />
          <StatTile icon={<HatGraduationRegular />} label="Sekolah Terhubung" value={stats.totalSekolah} />
          <StatTile
            icon={<ClipboardTaskListLtrRegular />}
            label="Konsistensi Pelaporan Sekolah"
            value={stats.konsistensiPelaporanPersen != null ? `${stats.konsistensiPelaporanPersen}%` : "-"}
          />
          <StatTile
            icon={<PeopleCommunityRegular />}
            label="Partisipasi Orang Tua"
            value={stats.partisipasiOrangtuaPersen != null ? `${stats.partisipasiOrangtuaPersen}%` : "-"}
          />
          <StatTile
            icon={<HeartRegular />}
            tone="warning"
            label="Kepuasan Orang Tua"
            value={stats.kepuasanOrangtua != null ? `${stats.kepuasanOrangtua.toFixed(1)} / 5` : "-"}
          />
          <StatTile
            icon={<StarRegular />}
            tone="warning"
            label="Kepuasan Keseluruhan"
            value={stats.kepuasanKeseluruhan != null ? `${stats.kepuasanKeseluruhan.toFixed(1)} / 5` : "-"}
          />
        </div>
      )}
      <Caption1 className="inline-flex items-center gap-1.5 text-fg3">
        <ShieldCheckmarkRegular /> Tidak ada data pribadi siswa, orang tua, atau sekolah yang ditampilkan di halaman ini.
      </Caption1>
    </PublicShell>
  );
}
