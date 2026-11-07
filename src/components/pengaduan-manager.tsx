"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Body1,
  Button,
  Caption1,
  Skeleton,
  SkeletonItem,
  Spinner,
  type BadgeProps,
} from "@fluentui/react-components";
import { ArrowRightRegular, ChatWarningRegular, CheckmarkRegular } from "@fluentui/react-icons";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatTanggalPendek } from "@/lib/format";

type PengaduanItem = {
  id: string;
  isi: string;
  status: string;
  createdAt: string;
  sekolah?: { namaSekolah: string } | null;
  orangtua?: { nama: string } | null;
  sppg?: { namaSppg: string } | null;
};

const STATUS: Record<string, { label: string; color: BadgeProps["color"] }> = {
  diterima: { label: "Diterima", color: "warning" },
  ditindaklanjuti: { label: "Ditindaklanjuti", color: "informative" },
  selesai: { label: "Selesai", color: "success" },
};
const NEXT_LABEL: Record<string, string> = {
  diterima: "Tandai Ditindaklanjuti",
  ditindaklanjuti: "Tandai Selesai",
};

// Mount = panel dibuka (AccordionPanel cuma render isi saat terbuka) -> lazy-fetch.
function PengaduanContent() {
  const [list, setList] = useState<PengaduanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    return fetch("/api/dinas/pengaduan")
      .then((r) => r.json())
      .then((d) => setList(d.pengaduan ?? []));
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function advance(p: PengaduanItem) {
    setBusyId(p.id);
    const res = await fetch(`/api/dinas/pengaduan/${p.id}`, { method: "PATCH" });
    if (res.ok) await load();
    setBusyId(null);
  }

  if (loading)
    return (
      <Skeleton aria-label="Memuat pengaduan" className="flex flex-col gap-2">
        <SkeletonItem size={20} />
        <SkeletonItem size={20} />
        <SkeletonItem size={20} />
      </Skeleton>
    );
  if (list.length === 0) return <EmptyState icon={<ChatWarningRegular />} title="Belum ada pengaduan" />;

  return (
    <ul className="flex flex-col divide-y divide-stroke2">
      {list.map((p) => {
        const st = STATUS[p.status] ?? { label: p.status, color: "informative" as const };
        return (
          <li key={p.id} className="flex flex-col gap-1.5 py-3 first:pt-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Caption1 className="inline-flex items-center gap-1 text-fg3">
                {p.sekolah?.namaSekolah ?? p.orangtua?.nama ?? "?"} <ArrowRightRegular /> {p.sppg?.namaSppg ?? "?"}
                <span aria-hidden> · </span>
                {formatTanggalPendek(p.createdAt)}
              </Caption1>
              <Badge appearance="tint" color={st.color} shape="rounded">
                {st.label}
              </Badge>
            </div>
            <Body1 className="break-words">{p.isi}</Body1>
            {NEXT_LABEL[p.status] && (
              <div>
                <Button
                  size="small"
                  disabled={busyId === p.id}
                  onClick={() => advance(p)}
                  icon={busyId === p.id ? <Spinner size="extra-tiny" /> : <CheckmarkRegular />}
                >
                  {busyId === p.id ? "Menyimpan..." : NEXT_LABEL[p.status]}
                </Button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// Dinas/Admin kelola status semua pengaduan (Fase 2, Bagian 6.5) -- diterima ->
// ditindaklanjuti -> selesai, linear sama kayak flag triangulasi. Lazy-fetch saat dibuka.
export function PengaduanManager() {
  return (
    <CollapsibleCard
      title="Kelola Pengaduan"
      description="Diterima → Ditindaklanjuti → Selesai"
      icon={<ChatWarningRegular />}
    >
      <PengaduanContent />
    </CollapsibleCard>
  );
}
