"use client";

import { useEffect, useState } from "react";

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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="SPPG Aktif" value={String(stats.sppgAktif)} />
          <StatCard label="Sekolah Terhubung" value={String(stats.totalSekolah)} />
          <StatCard
            label="Konsistensi Pelaporan Sekolah"
            value={stats.konsistensiPelaporanPersen != null ? `${stats.konsistensiPelaporanPersen}%` : "-"}
          />
          <StatCard
            label="Partisipasi Orangtua"
            value={stats.partisipasiOrangtuaPersen != null ? `${stats.partisipasiOrangtuaPersen}%` : "-"}
          />
          <StatCard
            label="Kepuasan Orangtua"
            value={stats.kepuasanOrangtua != null ? `⭐ ${stats.kepuasanOrangtua.toFixed(1)}` : "-"}
          />
          <StatCard
            label="Kepuasan Keseluruhan"
            value={stats.kepuasanKeseluruhan != null ? `⭐ ${stats.kepuasanKeseluruhan.toFixed(1)}` : "-"}
          />
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-neutral-200 rounded-lg p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-neutral-500 mt-1">{label}</div>
    </div>
  );
}
