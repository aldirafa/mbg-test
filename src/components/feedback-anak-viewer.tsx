"use client";

import { useEffect, useState } from "react";
import { Badge, Body1, Caption1, Skeleton, SkeletonItem, Text } from "@fluentui/react-components";
import {
  ChatBubblesQuestionRegular,
  EmojiRegular,
  FoodRegular,
  LocationRegular,
  WarningRegular,
} from "@fluentui/react-icons";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatTile } from "@/components/ui/stat-tile";
import { formatTanggalPendek } from "@/lib/format";
import {
  OPSI_PENILAIAN,
  OPSI_ALASAN_SUKA,
  OPSI_ALASAN_KURANG_SUKA,
  OPSI_KONDISI_HABIS,
  OPSI_ALASAN_TIDAK_HABIS,
  OPSI_KONDISI_KEMASAN,
  OPSI_PERBAIKAN,
  type OpsiSuaraAnak,
} from "@/lib/suara-anak";

type FeedbackItem = {
  id: string;
  suka: boolean;
  habis: boolean;
  penilaian: string | null;
  alasanSuka: string[];
  alasanKurangSuka: string[];
  alasanKurangSukaLainnya: string | null;
  kondisiHabis: string | null;
  alasanTidakHabis: string[];
  alasanTidakHabisLainnya: string | null;
  kondisiKemasan: string | null;
  perbaikanDiinginkan: string[];
  catatanPerbaikan: string | null;
  lokasiTerverifikasi: boolean;
  createdAt: string;
  sekolah: { namaSekolah: string };
  tanggal: string;
  siswa?: { nama: string; nisNisn: string };
};

function labelDari(opsi: OpsiSuaraAnak[], value: string | null): string | null {
  return opsi.find((o) => o.value === value)?.label ?? null;
}

function labelDaftar(opsi: OpsiSuaraAnak[], values: string[]): string {
  return values.map((v) => opsi.find((o) => o.value === v)?.label ?? v).join(", ");
}

function Baris({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-2">
      <Caption1 className="shrink-0 text-fg3 sm:w-36">{label}</Caption1>
      <Caption1 className="text-fg2">{children}</Caption1>
    </div>
  );
}

// Mount = panel dibuka -> lazy-fetch.
function FeedbackAnakContent() {
  const [list, setList] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dinas/feedback-anak")
      .then((r) => r.json())
      .then((d) => setList(d.feedback ?? []))
      .finally(() => setLoading(false));
  }, []);

  // Data lama (sebelum revisi 20 Sep) gak punya `penilaian`/`kondisiHabis` -- fallback
  // ke boolean suka/habis legacy buat hitung ringkasan & tampilan per-baris.
  const totalSuka = list.filter((f) => (f.penilaian ? f.penilaian !== "tidak_suka" : f.suka)).length;
  const totalHabis = list.filter((f) => (f.kondisiHabis ? f.kondisiHabis === "habis" : f.habis)).length;
  const belumTerverifikasi = list.filter((f) => !f.lokasiTerverifikasi).length;

  if (loading)
    return (
      <Skeleton aria-label="Memuat feedback" className="flex flex-col gap-2">
        <SkeletonItem size={48} />
        <SkeletonItem size={20} />
        <SkeletonItem size={20} />
      </Skeleton>
    );
  if (list.length === 0) return <EmptyState icon={<ChatBubblesQuestionRegular />} title="Belum ada feedback masuk" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Suka menunya" value={`${totalSuka}/${list.length}`} icon={<EmojiRegular />} tone="success" />
        <StatTile label="Makanan habis" value={`${totalHabis}/${list.length}`} icon={<FoodRegular />} tone="brand" />
        <StatTile
          label="Lokasi belum terverifikasi"
          value={belumTerverifikasi}
          hint={belumTerverifikasi > 0 ? "Perlu ditinjau manual" : undefined}
          icon={<LocationRegular />}
          tone={belumTerverifikasi > 0 ? "warning" : "neutral"}
        />
      </div>
      <ul className="flex flex-col divide-y divide-stroke2">
        {list.map((f) => {
          const penilaianLabel =
            labelDari(OPSI_PENILAIAN, f.penilaian) ?? (f.suka ? "😋 Suka (data lama)" : "😕 Kurang suka (data lama)");
          const kondisiHabisLabel =
            labelDari(OPSI_KONDISI_HABIS, f.kondisiHabis) ??
            (f.habis ? "🍽️ Habis (data lama)" : "🥡 Tidak habis (data lama)");
          const kondisiKemasanLabel = labelDari(OPSI_KONDISI_KEMASAN, f.kondisiKemasan);

          return (
            <li key={f.id} className="flex flex-col gap-1.5 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  <Text weight="semibold" className="block! truncate">
                    {f.siswa ? `${f.siswa.nama} (${f.siswa.nisNisn})` : f.sekolah.namaSekolah}
                  </Text>
                  <Caption1 className="text-fg3">{formatTanggalPendek(f.createdAt)}</Caption1>
                </div>
                {!f.lokasiTerverifikasi && (
                  <Badge appearance="tint" color="warning" icon={<WarningRegular />}>
                    Lokasi belum terverifikasi
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge appearance="outline" color="brand">
                  {penilaianLabel}
                </Badge>
                <Badge appearance="outline" color="informative">
                  {kondisiHabisLabel}
                </Badge>
                {kondisiKemasanLabel && (
                  <Badge appearance="outline" color="subtle">
                    Kemasan: {kondisiKemasanLabel}
                  </Badge>
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                {f.alasanSuka.length > 0 && <Baris label="Suka karena">{labelDaftar(OPSI_ALASAN_SUKA, f.alasanSuka)}</Baris>}
                {f.alasanKurangSuka.length > 0 && (
                  <Baris label="Kurang suka karena">
                    {labelDaftar(OPSI_ALASAN_KURANG_SUKA, f.alasanKurangSuka)}
                    {f.alasanKurangSukaLainnya && <> ({f.alasanKurangSukaLainnya})</>}
                  </Baris>
                )}
                {f.alasanTidakHabis.length > 0 && (
                  <Baris label="Gak habis karena">
                    {labelDaftar(OPSI_ALASAN_TIDAK_HABIS, f.alasanTidakHabis)}
                    {f.alasanTidakHabisLainnya && <> ({f.alasanTidakHabisLainnya})</>}
                  </Baris>
                )}
                {f.perbaikanDiinginkan.length > 0 && (
                  <Baris label="Ingin diperbaiki">{labelDaftar(OPSI_PERBAIKAN, f.perbaikanDiinginkan)}</Baris>
                )}
              </div>
              {f.catatanPerbaikan && f.perbaikanDiinginkan.length === 0 && <Body1>{f.catatanPerbaikan}</Body1>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Dinas/Admin lihat feedback Suara Anak (CVI, Fase 2). Identitas siswa (nama/NIS-NISN)
// cuma kebawa kalau API-nya ngebalikin (role admin) -- lihat src/app/api/dinas/feedback-anak.
// Lazy-fetch cuma pas dibuka.
export function FeedbackAnakViewer() {
  return (
    <CollapsibleCard
      title="Feedback Suara Anak (CVI)"
      description="Masukan langsung siswa dari formulir Suara Anak"
      icon={<ChatBubblesQuestionRegular />}
    >
      <FeedbackAnakContent />
    </CollapsibleCard>
  );
}
