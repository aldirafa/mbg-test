"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Body1,
  Caption1,
  Field,
  Input,
  ProgressBar,
  Skeleton,
  SkeletonItem,
  Subtitle2,
  Text,
  Tooltip,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  BuildingGovernmentRegular,
  CheckmarkCircleRegular,
  ClipboardTaskListLtrRegular,
  ClockRegular,
  DataPieRegular,
  EmojiMehRegular,
  EmojiRegular,
  EmojiSadRegular,
  ErrorCircleRegular,
  FoodRegular,
  StarRegular,
  WarningRegular,
} from "@fluentui/react-icons";
import { Select, type SelectOption } from "@/components/ui/select";
import { SegmentedRadioGroup } from "@/components/ui/radio-group";
import { Expandable } from "@/components/ui/expandable";
import { SectionCard } from "@/components/ui/section-card";
import { StatTile } from "@/components/ui/stat-tile";

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

const useStyles = makeStyles({
  seg: { height: "12px", minWidth: "4px", transitionProperty: "flex-grow", transitionDuration: tokens.durationSlow },
  segFirst: { borderTopLeftRadius: "4px", borderBottomLeftRadius: "4px" },
  segLast: { borderTopRightRadius: "4px", borderBottomRightRadius: "4px" },
  success: { backgroundColor: tokens.colorStatusSuccessBackground3 },
  warning: { backgroundColor: tokens.colorStatusWarningBackground3 },
  danger: { backgroundColor: tokens.colorStatusDangerBackground3 },
  track: { height: "12px", borderRadius: "4px", backgroundColor: tokens.colorNeutralBackground5 },
});

function Bagian({ judul, children }: { judul: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <Subtitle2 as="h3" className="text-fg2">
        {judul}
      </Subtitle2>
      {children}
    </section>
  );
}

// Bar bertumpuk distribusi ketepatan waktu (status: tepat / terlambat ringan / berat).
// Warna status + ikon + label di legend, jadi identitas tidak bergantung warna saja.
function BarKetepatan({ d }: { d: Analitik["ketepatanWaktu"]["distribusi"] }) {
  const s = useStyles();
  const segs = [
    { key: "tepat", label: "Tepat waktu", n: d.tepat_waktu, cls: s.success, icon: <CheckmarkCircleRegular className="text-success" /> },
    { key: "ringan", label: "Terlambat 15–30 menit", n: d.terlambat_ringan, cls: s.warning, icon: <WarningRegular className="text-warning" /> },
    { key: "berat", label: "Terlambat > 30 menit", n: d.terlambat_berat, cls: s.danger, icon: <ErrorCircleRegular className="text-danger" /> },
  ];
  const total = segs.reduce((a, b) => a + b.n, 0);
  const visible = segs.filter((x) => x.n > 0);
  return (
    <div className="flex flex-col gap-2">
      {total === 0 ? (
        <div className={s.track} />
      ) : (
        <div className="flex gap-[2px]" role="img" aria-label={segs.map((x) => `${x.label}: ${x.n}`).join(", ")}>
          {visible.map((x, i) => (
            <Tooltip
              key={x.key}
              relationship="description"
              content={`${x.label}: ${x.n}x (${Math.round((x.n / total) * 1000) / 10}%)`}
            >
              <div
                className={`${s.seg} ${x.cls} ${i === 0 ? s.segFirst : ""} ${i === visible.length - 1 ? s.segLast : ""}`}
                style={{ flexGrow: x.n }}
                tabIndex={0}
              />
            </Tooltip>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segs.map((x) => (
          <Caption1 key={x.key} className="inline-flex items-center gap-1 text-fg2">
            {x.icon} {x.label}: <b className="tabular-nums">{x.n}x</b>
          </Caption1>
        ))}
      </div>
    </div>
  );
}

function DaftarTop({ judul, items }: { judul: string; items: { value: string; label: string; jumlah: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.jumlah));
  return (
    <div className="flex flex-col gap-2 rounded-fluent-m border border-stroke2 p-3">
      <Text weight="semibold">{judul}</Text>
      {items.length === 0 && <Caption1 className="text-fg3">Belum ada data.</Caption1>}
      {items.map((d) => (
        <div key={d.value} className="flex flex-col gap-1">
          <div className="flex justify-between gap-2">
            <Caption1 className="text-fg2">{d.label}</Caption1>
            <Caption1 className="tabular-nums text-fg3">{d.jumlah}x</Caption1>
          </div>
          <ProgressBar value={d.jumlah / max} thickness="medium" />
        </div>
      ))}
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

  const kw = data?.ketepatanWaktu;
  const persenTepat =
    kw && kw.totalDiklasifikasi > 0 ? Math.round((kw.distribusi.tepat_waktu / kw.totalDiklasifikasi) * 1000) / 10 : null;

  return (
    <SectionCard
      title="Statistik Program"
      icon={<DataPieRegular />}
      description={data ? `${data.totalSekolahCocokFilter} sekolah cocok dengan filter` : "Memuat..."}
    >
      <div className="grid grid-cols-1 gap-3 rounded-fluent-l bg-bg2 p-3 sm:grid-cols-2 lg:grid-cols-[1fr_0.6fr_1fr_1fr_auto]">
        <Field label="Bulan">
          <Select value={bulan} onChange={setBulan} options={BULAN_OPSI} aria-label="Bulan" />
        </Field>
        <Field label="Tahun">
          <Input type="number" value={tahun} onChange={(_, d) => setTahun(d.value)} onBlur={load} />
        </Field>
        <Field label="Provinsi">
          <Input value={provinsi} onChange={(_, d) => setProvinsi(d.value)} onBlur={load} placeholder="Semua" />
        </Field>
        <Field label="Kabupaten/Kota">
          <Input value={kabupatenKota} onChange={(_, d) => setKabupatenKota(d.value)} onBlur={load} placeholder="Semua" />
        </Field>
        <SegmentedRadioGroup label="Jenjang" value={jenjang} onChange={setJenjang} options={JENJANG_OPSI} className="sm:col-span-2 lg:col-span-1" />
      </div>

      {loading && (
        <Skeleton aria-label="Memuat statistik" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonItem key={i} size={96} shape="rectangle" />
          ))}
        </Skeleton>
      )}

      {!loading && data && kw && (
        <div className="flex flex-col gap-6">
          {/* 1. Ketepatan waktu */}
          <Bagian judul="Ketepatan Waktu Distribusi Makanan">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatTile
                icon={<ClockRegular />}
                label="Rata-rata kirim"
                value={`Pagi ${kw.rataRataJam.kirimPagi ?? "-"}`}
                hint={`Siang ${kw.rataRataJam.kirimSiang ?? "-"}`}
              />
              <StatTile
                icon={<ClockRegular />}
                label="Rata-rata terima"
                value={`Pagi ${kw.rataRataJam.terimaPagi ?? "-"}`}
                hint={`Siang ${kw.rataRataJam.terimaSiang ?? "-"}`}
              />
              <StatTile
                icon={<CheckmarkCircleRegular />}
                tone="success"
                label="Tepat waktu"
                value={pct(persenTepat)}
                hint={`${kw.distribusi.tepat_waktu} dari ${kw.totalDiklasifikasi} distribusi`}
              />
            </div>
            <BarKetepatan d={kw.distribusi} />
          </Bagian>

          {/* 2. Porsi bulanan + 3. Refleksi + 5. Orangtua */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatTile
              icon={<FoodRegular />}
              label="Porsi diterima vs dikirim (bulanan)"
              value={pct(data.porsi.persenDiterima)}
              hint={`${data.porsi.totalDiterima} dari ${data.porsi.totalDikirim} porsi`}
            />
            <StatTile
              icon={<ClipboardTaskListLtrRegular />}
              label="Sekolah mengisi refleksi bulan ini"
              value={pct(data.refleksiSekolah.persenSekolahMengisi)}
            />
            <StatTile
              icon={<StarRegular />}
              tone="warning"
              label="Rata-rata rating orang tua"
              value={data.ratingOrangtua.rataRata != null ? `${data.ratingOrangtua.rataRata.toFixed(1)} / 5` : "-"}
              hint={`${data.ratingOrangtua.totalRating} rating masuk`}
            />
          </div>

          {/* 3. Refleksi sekolah (rincian) */}
          <Bagian judul="Refleksi Mingguan Sekolah">
            <Expandable summary="Rincian kendala pelaksanaan MBG">
              <ul className="flex flex-col gap-2">
                {data.refleksiSekolah.kendala.map((k) => (
                  <li key={k.id} className="rounded-fluent-m border border-stroke2 p-3">
                    <Body1>{k.pertanyaan}</Body1>
                    <Caption1 className="block! mt-1 text-fg3">
                      Sudah selesai: {pct(k.sudah_diselesaikan)} · Belum selesai: {pct(k.belum_diselesaikan)} · Tidak:{" "}
                      {pct(k.tidak)} ({k.total} respon)
                    </Caption1>
                  </li>
                ))}
              </ul>
            </Expandable>
            <Expandable summary="Rincian persepsi sekolah">
              <ul className="flex flex-col gap-2">
                {data.refleksiSekolah.persepsi.map((p) => (
                  <li key={p.id} className="rounded-fluent-m border border-stroke2 p-3">
                    <Body1>{p.pertanyaan}</Body1>
                    <Caption1 className="block! mt-1 text-fg3">
                      Rata-rata skala 1 (sangat setuju) – 5 (sangat tidak setuju): {p.rataRataSkala1to5 ?? "-"} ({p.total}{" "}
                      respon)
                    </Caption1>
                  </li>
                ))}
              </ul>
            </Expandable>
          </Bagian>

          {/* 4. Data anak (Suara Anak) */}
          <Bagian judul={`Data Anak (Suara Anak) · ${data.suaraAnak.totalRespon} respon`}>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile icon={<EmojiRegular />} tone="success" label="Suka menunya" value={pct(data.suaraAnak.penilaian.suka)} />
              <StatTile icon={<EmojiMehRegular />} tone="neutral" label="Biasa saja" value={pct(data.suaraAnak.penilaian.biasa)} />
              <StatTile icon={<EmojiSadRegular />} tone="danger" label="Tidak suka" value={pct(data.suaraAnak.penilaian.tidak_suka)} />
              <StatTile icon={<FoodRegular />} label="Makanan habis" value={pct(data.suaraAnak.kondisiHabis.habis)} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DaftarTop judul="Paling sering disukai" items={data.suaraAnak.topDisukai} />
              <DaftarTop judul="Paling sering ingin diperbaiki" items={data.suaraAnak.topPerbaikan} />
            </div>
          </Bagian>

          {/* 6. Data Dinas */}
          <Bagian judul="Data Dinas">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile icon={<BuildingGovernmentRegular />} label="Sekolah melakukan pelaporan" value={pct(data.dataDinas.persenPelaporan)} />
              <StatTile icon={<BuildingGovernmentRegular />} label="Sekolah terpantau" value={pct(data.dataDinas.persenTerpantau)} />
              <StatTile icon={<ClipboardTaskListLtrRegular />} label="Kendala ditindaklanjuti" value={pct(data.dataDinas.persenKendalaDitindaklanjuti)} />
              <StatTile icon={<ClipboardTaskListLtrRegular />} label="Laporan diselesaikan" value={pct(data.dataDinas.persenLaporanDiselesaikan)} />
            </div>
          </Bagian>
        </div>
      )}
    </SectionCard>
  );
}
