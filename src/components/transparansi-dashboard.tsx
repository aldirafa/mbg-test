"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import {
  BuildingOffice2Icon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  HeartIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

type Stats = {
  sppgAktif: number;
  totalSekolah: number;
  konsistensiPelaporanPersen: number | null;
  partisipasiOrangtuaPersen: number | null;
  kepuasanOrangtua: number | null;
  kepuasanKeseluruhan: number | null;
};

export function TransparansiDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/publik/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Transparansi MBG Digital</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Data agregat program Makan Bergizi Gratis -- diperbarui otomatis, tanpa data pribadi.
        </p>
      </div>

      {!stats && <p className="text-sm text-neutral-500">Memuat...</p>}

      {stats && (
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard icon={BuildingOffice2Icon} label="SPPG Aktif" value={String(stats.sppgAktif)} />
          <StatCard icon={AcademicCapIcon} label="Sekolah Terhubung" value={String(stats.totalSekolah)} />
          <StatCard
            icon={ClipboardDocumentCheckIcon}
            label="Konsistensi Pelaporan Sekolah"
            value={stats.konsistensiPelaporanPersen != null ? `${stats.konsistensiPelaporanPersen}%` : "-"}
          />
          <StatCard
            icon={UserGroupIcon}
            label="Partisipasi Orangtua"
            value={stats.partisipasiOrangtuaPersen != null ? `${stats.partisipasiOrangtuaPersen}%` : "-"}
          />
          <StatCard
            icon={HeartIcon}
            label="Kepuasan Orangtua"
            value={stats.kepuasanOrangtua != null ? `⭐ ${stats.kepuasanOrangtua.toFixed(1)}` : "-"}
          />
          <StatCard
            icon={StarIcon}
            label="Kepuasan Keseluruhan"
            value={stats.kepuasanKeseluruhan != null ? `⭐ ${stats.kepuasanKeseluruhan.toFixed(1)}` : "-"}
          />
        </dl>
      )}
    </main>
  );
}

// Kartu statistik gaya "icon badge" (terinspirasi contoh Tailwind Plus yang dikasih user),
// diadaptasi ke tema neutral/hitam aplikasi ini -- gak pakai indikator naik/turun karena
// belum ada data historis buat dibandingin (cuma snapshot kondisi sekarang).
function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-neutral-200 px-4 pt-5 pb-4 sm:px-6 sm:pt-6">
      <div>
        <div className="absolute rounded-md bg-neutral-900 p-3">
          <Icon className="size-6 text-white" />
        </div>
        <p className="ml-16 truncate text-sm font-medium text-neutral-500">{label}</p>
      </div>
      <p className="ml-16 mt-1 text-2xl font-semibold text-neutral-900">{value}</p>
    </div>
  );
}
