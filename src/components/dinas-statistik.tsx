"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import {
  ClockIcon,
  ChartPieIcon,
  ClipboardDocumentListIcon,
  FaceSmileIcon,
  StarIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/outline";
import { Select, type SelectOption } from "@/components/ui/select";
import { SegmentedRadioGroup } from "@/components/ui/radio-group";
import { Expandable } from "@/components/ui/expandable";

// Dashboard statistik Dinas (feedback tim Prof Elly, 20 Sep, "Dashboard dinas,
// summarised") -- konsumsi GET /api/dinas/analitik. Filter bar + 7 bagian sesuai
// urutan spek asli. Banyak definisi metrik di sini adalah judgment call yang
// didokumentasikan di API route & README (mis. "sekolah terpantau" vs "pelaporan").

type Analitik = {
  periode: { bulan: number; tahun: number };
  totalSekolahCocokFilter: number;
  ketepatanWaktu: {
    rataRataJam: { kirimPagi: string | null; kirimSiang: string | null; terimaPagi: string | null; terimaSiang: string | null };
    distribusi: { tepat_waktu: number; terlambat_ringan: number; terlambat_berat: number };
    totalDiklasifikasi: number;
  };
  porsi: { totalDikirim: number; totalDiterima: number; persenDiterima: number | null };
  refleksiSekolah: {
    persenSekolahMengisi: number | null;
    kendala: { id: string; pertanyaan: string; total: number; sudah_diselesaikan: number | null; belum_diselesaikan: number | null; tidak: number | null }[];
    persepsi: { id: string; pertanyaan: string; total: number; rataRataSkala1to5: number | null }[];
  };
  suaraAnak: {
    totalRespon: number;
    penilaian: { suka: number | null; biasa: number | null; tidak_suka: number | null };
    kondisiHabis: { habis: number | null; sisa_sedikit: number | null; sisa_banyak: number | null };
    topDisukai: { value: string; label: string; jumlah: number }[];
    topPerbaikan: { value: string; label: string; jumlah: number }[];
  };
  ratingOrangtua: { rataRata: number | null; totalRating: number };
  dataDinas: {
    persenPelaporan: number | null;
    persenTerpantau: number | null;
    persenKendalaDitindaklanjuti: number | null;
    persenLaporanDiselesaikan: number | null;
  };
};

const BULAN_OPSI: SelectOption[] = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
].map((label, i) => ({ value: String(i + 1), label }));

const JENJANG_OPSI = [
  { value: "", label: "Semua" },
  { value: "SD", label: "SD" },
  { value: "SMP", label: "SMP" },
  { value: "SMA", label: "SMA" },
];

function pct(v: number | null): string {
  return v != null ? `${v}%` : "-";
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-neutral-200 px-4 pt-5 pb-4">
      <div className="absolute rounded-md bg-neutral-900 p-2.5">
        <Icon className="size-5 text-white" />
      </div>
      <p className="ml-14 truncate text-xs font-medium text-neutral-500">{label}</p>
      <p className="ml-14 mt-1 text-xl font-semibold text-neutral-900">{value}</p>
      {sub && <p className="ml-14 text-xs text-neutral-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export function DinasStatistik() {
  const now = new Date();
  const [bulan, setBulan] = useState(String(now.getMonth() + 1));
  const [tahun, setTahun] = useState(String(now.getFullYear()));
  const [provinsi, setProvinsi] = useState("");
  const [kabupatenKota, setKabupatenKota] = useState("");
  const [jenjang, setJenjang] = useState("");
  const [data, setData] = useState<Analitik | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    const params = new URLSearchParams({ bulan, tahun });
    if (provinsi.trim()) params.set("provinsi", provinsi.trim());
    if (kabupatenKota.trim()) params.set("kabupatenKota", kabupatenKota.trim());
    if (jenjang) params.set("jenjang", jenjang);
    return fetch(`/api/dinas/analitik?${params.toString()}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulan, tahun, jenjang]);

  return (
    <div className="border border-neutral-200 rounded-lg p-4 space-y-5">
      <div>
        <h2 className="font-medium text-sm">Statistik Program</h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          {data ? `${data.totalSekolahCocokFilter} sekolah cocok dengan filter` : "Memuat..."}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <Select value={bulan} onChange={setBulan} options={BULAN_OPSI} className="text-sm" />
        <input
          value={tahun}
          onChange={(e) => setTahun(e.target.value)}
          onBlur={load}
          className="rounded-md border border-neutral-300 px-2 py-2 text-sm"
          placeholder="Tahun"
        />
        <input
          value={provinsi}
          onChange={(e) => setProvinsi(e.target.value)}
          onBlur={load}
          className="rounded-md border border-neutral-300 px-2 py-2 text-sm"
          placeholder="Provinsi"
        />
        <input
          value={kabupatenKota}
          onChange={(e) => setKabupatenKota(e.target.value)}
          onBlur={load}
          className="rounded-md border border-neutral-300 px-2 py-2 text-sm"
          placeholder="Kabupaten/Kota"
        />
        <SegmentedRadioGroup value={jenjang} onChange={setJenjang} options={JENJANG_OPSI} className="col-span-2 sm:col-span-1 flex items-center" />
      </div>

      {loading && <p className="text-sm text-neutral-500">Memuat statistik...</p>}

      {!loading && data && (
        <div className="space-y-5">
          {/* 1. Ketepatan waktu */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
              Ketepatan Waktu Distribusi Makanan
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard
                icon={ClockIcon}
                label="Rata-rata kirim"
                value={`Pagi ${data.ketepatanWaktu.rataRataJam.kirimPagi ?? "-"}`}
                sub={`Siang ${data.ketepatanWaktu.rataRataJam.kirimSiang ?? "-"}`}
              />
              <StatCard
                icon={ClockIcon}
                label="Rata-rata terima"
                value={`Pagi ${data.ketepatanWaktu.rataRataJam.terimaPagi ?? "-"}`}
                sub={`Siang ${data.ketepatanWaktu.rataRataJam.terimaSiang ?? "-"}`}
              />
              <StatCard
                icon={ChartPieIcon}
                label="Tepat waktu"
                value={pct(
                  data.ketepatanWaktu.totalDiklasifikasi > 0
                    ? Math.round((data.ketepatanWaktu.distribusi.tepat_waktu / data.ketepatanWaktu.totalDiklasifikasi) * 1000) / 10
                    : null
                )}
                sub={`${data.ketepatanWaktu.distribusi.tepat_waktu} dari ${data.ketepatanWaktu.totalDiklasifikasi} distribusi`}
              />
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-neutral-600">
              <span>Tepat waktu: {data.ketepatanWaktu.distribusi.tepat_waktu}x</span>
              <span>Terlambat 15–30 menit: {data.ketepatanWaktu.distribusi.terlambat_ringan}x</span>
              <span>Terlambat &gt; 30 menit: {data.ketepatanWaktu.distribusi.terlambat_berat}x</span>
            </div>
          </div>

          {/* 2. Porsi bulanan */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">Jumlah Porsi (Bulanan)</p>
            <StatCard
              icon={ChartPieIcon}
              label="Porsi diterima vs dikirim"
              value={pct(data.porsi.persenDiterima)}
              sub={`${data.porsi.totalDiterima} dari ${data.porsi.totalDikirim} porsi`}
            />
          </div>

          {/* 3. Refleksi sekolah */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
              Refleksi Mingguan Sekolah
            </p>
            <StatCard
              icon={ClipboardDocumentListIcon}
              label="Sekolah mengisi refleksi bulan ini"
              value={pct(data.refleksiSekolah.persenSekolahMengisi)}
            />
            <Expandable summary="Rincian kendala pelaksanaan MBG" className="mt-2">
              <div className="space-y-2">
                {data.refleksiSekolah.kendala.map((k) => (
                  <div key={k.id} className="text-xs border border-neutral-100 rounded-md p-2">
                    <p className="text-neutral-700">{k.pertanyaan}</p>
                    <p className="text-neutral-500 mt-0.5">
                      Sudah selesai: {pct(k.sudah_diselesaikan)} &middot; Belum selesai: {pct(k.belum_diselesaikan)} &middot;
                      Tidak: {pct(k.tidak)} ({k.total} respon)
                    </p>
                  </div>
                ))}
              </div>
            </Expandable>
            <Expandable summary="Rincian persepsi sekolah" className="mt-2">
              <div className="space-y-2">
                {data.refleksiSekolah.persepsi.map((p) => (
                  <div key={p.id} className="text-xs border border-neutral-100 rounded-md p-2">
                    <p className="text-neutral-700">{p.pertanyaan}</p>
                    <p className="text-neutral-500 mt-0.5">
                      Rata-rata skala 1 (sangat setuju) – 5 (sangat tidak setuju): {p.rataRataSkala1to5 ?? "-"} ({p.total} respon)
                    </p>
                  </div>
                ))}
              </div>
            </Expandable>
          </div>

          {/* 4. Data anak (Suara Anak) */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
              Data Anak (Suara Anak) &middot; {data.suaraAnak.totalRespon} respon
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon={FaceSmileIcon} label="Suka menunya" value={pct(data.suaraAnak.penilaian.suka)} />
              <StatCard icon={FaceSmileIcon} label="Biasa saja" value={pct(data.suaraAnak.penilaian.biasa)} />
              <StatCard icon={FaceSmileIcon} label="Tidak suka" value={pct(data.suaraAnak.penilaian.tidak_suka)} />
              <StatCard icon={ChartPieIcon} label="Makanan habis" value={pct(data.suaraAnak.kondisiHabis.habis)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="text-xs">
                <p className="font-medium text-neutral-600 mb-1">Paling sering disukai</p>
                {data.suaraAnak.topDisukai.length === 0 && <p className="text-neutral-400">Belum ada data.</p>}
                {data.suaraAnak.topDisukai.map((d) => (
                  <p key={d.value} className="text-neutral-500">
                    {d.label} &middot; {d.jumlah}x
                  </p>
                ))}
              </div>
              <div className="text-xs">
                <p className="font-medium text-neutral-600 mb-1">Paling sering ingin diperbaiki</p>
                {data.suaraAnak.topPerbaikan.length === 0 && <p className="text-neutral-400">Belum ada data.</p>}
                {data.suaraAnak.topPerbaikan.map((d) => (
                  <p key={d.value} className="text-neutral-500">
                    {d.label} &middot; {d.jumlah}x
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Data orangtua */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">Data Orangtua</p>
            <StatCard
              icon={StarIcon}
              label="Rata-rata rating dari orangtua"
              value={data.ratingOrangtua.rataRata != null ? `⭐ ${data.ratingOrangtua.rataRata.toFixed(1)}` : "-"}
              sub={`${data.ratingOrangtua.totalRating} rating masuk`}
            />
          </div>

          {/* 6. Data Dinas */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">Data Dinas</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon={BuildingLibraryIcon} label="Sekolah melakukan pelaporan" value={pct(data.dataDinas.persenPelaporan)} />
              <StatCard icon={BuildingLibraryIcon} label="Sekolah terpantau" value={pct(data.dataDinas.persenTerpantau)} />
              <StatCard icon={ClipboardDocumentListIcon} label="Kendala ditindaklanjuti" value={pct(data.dataDinas.persenKendalaDitindaklanjuti)} />
              <StatCard icon={ClipboardDocumentListIcon} label="Laporan diselesaikan" value={pct(data.dataDinas.persenLaporanDiselesaikan)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
