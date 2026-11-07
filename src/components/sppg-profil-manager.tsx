"use client";

import { useEffect, useState } from "react";
import { Skeleton, SkeletonItem } from "@fluentui/react-components";
import { BuildingFactoryRegular } from "@fluentui/react-icons";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { EditableRows, type EditableColumn } from "@/components/ui/editable-rows";

type SppgRow = { id: string; namaSppg: string; provinsi: string | null; kabupatenKota: string | null };
type Key = "provinsi" | "kabupatenKota";

const COLUMNS: EditableColumn<Key>[] = [
  { key: "provinsi", label: "Provinsi" },
  { key: "kabupatenKota", label: "Kabupaten/Kota" },
];

// Mount = panel dibuka -> lazy-fetch.
function SppgProfilContent() {
  const [list, setList] = useState<SppgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Record<string, Record<Key, string>>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dinas/sppg")
      .then((r) => r.json())
      .then((d) => {
        setList(d.sppgList ?? []);
        const nextDraft: Record<string, Record<Key, string>> = {};
        for (const s of d.sppgList ?? []) {
          nextDraft[s.id] = { provinsi: s.provinsi ?? "", kabupatenKota: s.kabupatenKota ?? "" };
        }
        setDraft(nextDraft);
      })
      .finally(() => setLoading(false));
  }, []);

  async function simpan(id: string) {
    setBusyId(id);
    setSavedId(null);
    const res = await fetch(`/api/dinas/sppg/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provinsi: draft[id]?.provinsi ?? "",
        kabupatenKota: draft[id]?.kabupatenKota ?? "",
      }),
    });
    if (res.ok) setSavedId(id);
    setBusyId(null);
  }

  if (loading)
    return (
      <Skeleton aria-label="Memuat SPPG" className="flex flex-col gap-2">
        <SkeletonItem size={32} />
        <SkeletonItem size={32} />
      </Skeleton>
    );

  return (
    <EditableRows
      rows={list.map((s) => ({ id: s.id, nama: s.namaSppg }))}
      columns={COLUMNS}
      draft={draft}
      onDraftChange={(id, key, value) => setDraft((d) => ({ ...d, [id]: { ...d[id], [key]: value } }))}
      onSave={simpan}
      busyId={busyId}
      savedId={savedId}
    />
  );
}

// Kelola profil provinsi/kabupaten-kota tiap SPPG (feedback tim 20 Sep) -- teks bebas
// (bukan dropdown resmi), dipakai sbg filter dashboard statistik Dinas. Polanya sama
// persis kayak SekolahLokasiManager.
export function SppgProfilManager() {
  return (
    <CollapsibleCard
      title="Profil Wilayah SPPG"
      description="Provinsi & kabupaten/kota tiap SPPG, dipakai sebagai filter statistik"
      icon={<BuildingFactoryRegular />}
    >
      <SppgProfilContent />
    </CollapsibleCard>
  );
}
