"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Body1,
  Button,
  Caption1,
  Field,
  Skeleton,
  SkeletonItem,
  Textarea,
  type BadgeProps,
} from "@fluentui/react-components";
import { ChatWarningRegular, SendRegular } from "@fluentui/react-icons";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { useAppToast } from "@/components/ui/toast";
import { formatTanggalPendek } from "@/lib/format";

type PengaduanItem = {
  id: string;
  isi: string;
  status: string;
  createdAt: string;
  sekolah?: { namaSekolah: string } | null;
  orangtua?: { nama: string } | null;
};

const STATUS: Record<string, { label: string; color: BadgeProps["color"] }> = {
  diterima: { label: "Diterima", color: "warning" },
  ditindaklanjuti: { label: "Ditindaklanjuti", color: "informative" },
  selesai: { label: "Selesai", color: "success" },
};

// Fase 2, Bagian 6.5 -- kanal pengaduan trackable, beda dari komplain ringkas per-distribusi
// (MVP). Dipakai di dashboard Sekolah/Orangtua (submit + lihat riwayat sendiri) dan SPPG
// (baca-saja, riwayat yang terkait diri).
export function PengaduanPanel({
  endpoint,
  extraBody,
  title,
  readOnly,
  showSubmitter,
}: {
  endpoint: string;
  extraBody?: Record<string, unknown>;
  title?: string;
  readOnly?: boolean;
  showSubmitter?: boolean;
}) {
  const [list, setList] = useState<PengaduanItem[]>([]);
  const [isi, setIsi] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useAppToast();

  function load() {
    return fetch(endpoint)
      .then((r) => r.json())
      .then((d) => setList(d.pengaduan ?? []));
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- endpoint/extraBody stabil per-mount, sengaja cuma jalan sekali
  }, []);

  async function submit() {
    if (!isi.trim()) return;
    setBusy(true);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isi: isi.trim(), ...extraBody }),
    });
    if (res.ok) {
      setIsi("");
      toast("Pengaduan terkirim", { body: "Status bisa dipantau di daftar di bawah." });
      await load();
    } else {
      toast("Gagal mengirim pengaduan", { intent: "error" });
    }
    setBusy(false);
  }

  return (
    <SectionCard title={title ?? "Pengaduan"} icon={<ChatWarningRegular />}>
      {!readOnly && (
        <div className="flex flex-col gap-2">
          <Field label="Isi pengaduan">
            <Textarea
              value={isi}
              onChange={(_, d) => setIsi(d.value)}
              placeholder="Ceritain masalahnya..."
              resize="vertical"
              rows={3}
            />
          </Field>
          <div>
            <Button
              appearance="primary"
              icon={<SendRegular />}
              disabled={busy || !isi.trim()}
              onClick={submit}
            >
              {busy ? "Mengirim..." : "Kirim Pengaduan"}
            </Button>
          </div>
        </div>
      )}

      {loading && (
        <Skeleton aria-label="Memuat pengaduan" className="flex flex-col gap-2">
          <SkeletonItem size={16} />
          <SkeletonItem size={16} />
        </Skeleton>
      )}
      {!loading && list.length === 0 && <EmptyState icon={<ChatWarningRegular />} title="Belum ada pengaduan" />}
      {!loading && list.length > 0 && (
        <ul className="flex flex-col divide-y divide-stroke2 border-t border-stroke2">
          {list.map((p) => {
            const st = STATUS[p.status] ?? { label: p.status, color: "informative" as const };
            return (
              <li key={p.id} className="flex items-start justify-between gap-3 py-2.5">
                <div className="flex min-w-0 flex-1 flex-col">
                  {showSubmitter && (
                    <Caption1 className="font-semibold text-fg2">
                      {p.sekolah?.namaSekolah ?? p.orangtua?.nama ?? "?"}
                    </Caption1>
                  )}
                  <Body1 className="break-words">{p.isi}</Body1>
                  <Caption1 className="text-fg3">{formatTanggalPendek(p.createdAt)}</Caption1>
                </div>
                <Badge appearance="tint" color={st.color} shape="rounded" className="shrink-0">
                  {st.label}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
