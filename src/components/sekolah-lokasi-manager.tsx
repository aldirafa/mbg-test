"use client";

import { useEffect, useState } from "react";
import { Skeleton, SkeletonItem } from "@fluentui/react-components";
import { LocationRegular } from "@fluentui/react-icons";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { EditableRows, type EditableColumn } from "@/components/ui/editable-rows";

type SekolahRow = {
  id: string;
  namaSekolah: string;
  lat: number | null;
  lng: number | null;
  provinsi: string | null;
  kabupatenKota: string | null;
};
type Key = "lat" | "lng" | "provinsi" | "kabupatenKota";

const COLUMNS: EditableColumn<Key>[] = [
  { key: "lat", label: "Latitude", placeholder: "-7.2", inputMode: "decimal" },
  { key: "lng", label: "Longitude", placeholder: "107.9", inputMode: "decimal" },
  { key: "provinsi", label: "Provinsi" },
  { key: "kabupatenKota", label: "Kabupaten/Kota" },
];

// Mount = panel dibuka -> lazy-fetch.
function SekolahLokasiContent() {
  const [list, setList] = useState<SekolahRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Record<string, Record<Key, string>>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dinas/sekolah")
      .then((r) => r.json())
      .then((d) => {
        setList(d.sekolahList ?? []);
        const nextDraft: Record<string, Record<Key, string>> = {};
        for (const s of d.sekolahList ?? []) {
          nextDraft[s.id] = {
            lat: s.lat != null ? String(s.lat) : "",
            lng: s.lng != null ? String(s.lng) : "",
            provinsi: s.provinsi ?? "",
            kabupatenKota: s.kabupatenKota ?? "",
          };
        }
        setDraft(nextDraft);
      })
      .finally(() => setLoading(false));
  }, []);

  async function simpan(id: string) {
    const lat = Number(draft[id]?.lat);
    const lng = Number(draft[id]?.lng);
    const latLngValid = !Number.isNaN(lat) && !Number.isNaN(lng);
    setBusyId(id);
    setSavedId(null);
    const res = await fetch(`/api/dinas/sekolah/${id}/lokasi`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(latLngValid ? { lat, lng } : {}),
        provinsi: draft[id]?.provinsi ?? "",
        kabupatenKota: draft[id]?.kabupatenKota ?? "",
      }),
    });
    if (res.ok) setSavedId(id);
    setBusyId(null);
  }

  if (loading)
    return (
      <Skeleton aria-label="Memuat sekolah" className="flex flex-col gap-2">
        <SkeletonItem size={32} />
        <SkeletonItem size={32} />
      </Skeleton>
    );

  return (
    <EditableRows
      rows={list.map((s) => ({ id: s.id, nama: s.namaSekolah }))}
      columns={COLUMNS}
      draft={draft}
      onDraftChange={(id, key, value) => setDraft((d) => ({ ...d, [id]: { ...d[id], [key]: value } }))}
      onSave={simpan}
      busyId={busyId}
      savedId={savedId}
    />
  );
}

// Buat Dinas/Admin nge-set atau koreksi titik acuan lokasi tiap sekolah (dipakai geo-fence
// Child Voice Interface, radius 10m) -- pelengkap dari sekolah yang set sendiri lewat
// dashboard mereka.
export function SekolahLokasiManager() {
  return (
    <CollapsibleCard
      title="Titik Lokasi Sekolah"
      description="Geo-fence formulir Suara Anak (radius 10m) & wilayah sekolah"
      icon={<LocationRegular />}
    >
      <SekolahLokasiContent />
    </CollapsibleCard>
  );
}
