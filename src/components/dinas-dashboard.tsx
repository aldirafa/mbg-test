"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { SekolahLokasiManager } from "@/components/sekolah-lokasi-manager";
import { SppgProfilManager } from "@/components/sppg-profil-manager";
import { PengaduanManager } from "@/components/pengaduan-manager";
import { FeedbackAnakViewer } from "@/components/feedback-anak-viewer";
import { SegmentedRadioGroup } from "@/components/ui/radio-group";
import { DinasStatistik } from "@/components/dinas-statistik";

type Flag = {
  id: string;
  jenisKetidaksesuaian: string;
  detail: string;
  status: string;
  createdAt: string;
  distribusi: {
    sekolah: { namaSekolah: string };
    menu: { tanggal: string; sppg: { namaSppg: string } };
  };
};

type FilterValue = "semua" | "terbuka" | "ditindaklanjuti" | "selesai";

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "semua", label: "Semua" },
  { value: "terbuka", label: "Terbuka" },
  { value: "ditindaklanjuti", label: "Ditindaklanjuti" },
  { value: "selesai", label: "Selesai" },
];

const STATUS_BADGE: Record<string, string> = {
  terbuka: "bg-red-100 text-red-700",
  ditindaklanjuti: "bg-amber-100 text-amber-700",
  selesai: "bg-green-100 text-green-700",
};

const STATUS_LABEL: Record<string, string> = {
  terbuka: "Terbuka",
  ditindaklanjuti: "Ditindaklanjuti",
  selesai: "Selesai",
};

const NEXT_LABEL: Record<string, string> = {
  terbuka: "Tandai Ditindaklanjuti",
  ditindaklanjuti: "Tandai Selesai",
};

export function DinasDashboard() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterValue>("semua");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function loadFlags() {
    return fetch("/api/dinas/flags")
      .then((r) => r.json())
      .then((d) => setFlags(d.flags ?? []));
  }

  useEffect(() => {
    loadFlags().finally(() => setLoading(false));
  }, []);

  const counts = useMemo(
    () => ({
      terbuka: flags.filter((f) => f.status === "terbuka").length,
      ditindaklanjuti: flags.filter((f) => f.status === "ditindaklanjuti").length,
      selesai: flags.filter((f) => f.status === "selesai").length,
    }),
    [flags]
  );

  const visible = filter === "semua" ? flags : flags.filter((f) => f.status === filter);
  const selected = flags.find((f) => f.id === selectedId) ?? null;

  async function advanceStatus(flag: Flag) {
    setBusy(true);
    const res = await fetch(`/api/dinas/flags/${flag.id}`, { method: "PATCH" });
    if (res.ok) await loadFlags();
    setBusy(false);
  }

  return (
    <DashboardShell title="Dashboard Dinas" subtitle="Flag triangulasi otomatis dari SPPG, sekolah & orangtua">
      <main className="max-w-5xl mx-auto p-6 space-y-5">
        <DinasStatistik />

        <div className="grid grid-cols-3 gap-3">
          <div className="border border-neutral-200 rounded-lg p-4">
            <div className="text-2xl font-semibold">{counts.terbuka}</div>
            <div className="text-xs text-neutral-500 mt-0.5">Terbuka</div>
          </div>
          <div className="border border-neutral-200 rounded-lg p-4">
            <div className="text-2xl font-semibold">{counts.ditindaklanjuti}</div>
            <div className="text-xs text-neutral-500 mt-0.5">Ditindaklanjuti</div>
          </div>
          <div className="border border-neutral-200 rounded-lg p-4">
            <div className="text-2xl font-semibold">{counts.selesai}</div>
            <div className="text-xs text-neutral-500 mt-0.5">Selesai</div>
          </div>
        </div>

        <SegmentedRadioGroup value={filter} onChange={setFilter} options={FILTERS} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
          <div className="border border-neutral-200 rounded-lg divide-y divide-neutral-200 overflow-hidden">
            {loading && <p className="text-sm text-neutral-500 p-4">Memuat...</p>}
            {!loading && visible.length === 0 && (
              <p className="text-sm text-neutral-500 p-4">Belum ada flag untuk filter ini.</p>
            )}
            {visible.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedId(f.id)}
                className={
                  "w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 " +
                  (selectedId === f.id ? "bg-neutral-50" : "")
                }
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{f.distribusi.sekolah.namaSekolah}</div>
                  <div className="text-xs text-neutral-500 truncate mt-0.5">{f.jenisKetidaksesuaian}</div>
                </div>
                <div className="text-xs text-neutral-400 flex-shrink-0">
                  {new Date(f.distribusi.menu.tanggal).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
                <span
                  className={
                    "text-xs rounded-full px-2.5 py-1 flex-shrink-0 " + (STATUS_BADGE[f.status] ?? "")
                  }
                >
                  {STATUS_LABEL[f.status] ?? f.status}
                </span>
              </button>
            ))}
          </div>

          <div className="border border-neutral-200 rounded-lg p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">
              Detail
            </div>
            {!selected && (
              <p className="text-sm text-neutral-500">
                Pilih salah satu flag di kiri buat lihat detail & tindak lanjuti.
              </p>
            )}
            {selected && (
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-semibold">{selected.distribusi.sekolah.namaSekolah}</div>
                  <div className="text-neutral-600 mt-1">{selected.jenisKetidaksesuaian}</div>
                  <div className="text-neutral-400 text-xs mt-1">
                    SPPG {selected.distribusi.menu.sppg.namaSppg} &middot;{" "}
                    {new Date(selected.distribusi.menu.tanggal).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </div>
                  <span
                    className={
                      "inline-block mt-2 text-xs rounded-full px-2.5 py-1 " +
                      (STATUS_BADGE[selected.status] ?? "")
                    }
                  >
                    {STATUS_LABEL[selected.status] ?? selected.status}
                  </span>
                </div>
                <p className="text-neutral-700 leading-relaxed border-t border-neutral-200 pt-3">
                  {selected.detail}
                </p>
                {NEXT_LABEL[selected.status] && (
                  <button
                    disabled={busy}
                    onClick={() => advanceStatus(selected)}
                    className="w-full rounded-md bg-neutral-900 text-white text-sm font-medium py-2 disabled:opacity-60"
                  >
                    {NEXT_LABEL[selected.status]}
                  </button>
                )}
                {selected.status === "selesai" && (
                  <p className="text-xs text-green-700 font-medium">Sudah ditindaklanjuti tuntas.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <SekolahLokasiManager />
        <SppgProfilManager />
        <PengaduanManager />
        <FeedbackAnakViewer />
      </main>
    </DashboardShell>
  );
}
