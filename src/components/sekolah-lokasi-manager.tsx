"use client";

import { useEffect, useState } from "react";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

type SekolahRow = {
  id: string;
  namaSekolah: string;
  lat: number | null;
  lng: number | null;
  provinsi: string | null;
  kabupatenKota: string | null;
};

// Buat Dinas/Admin nge-set atau koreksi titik acuan lokasi tiap sekolah (dipakai geo-fence
// Child Voice Interface, radius 10m) -- pelengkap dari sekolah yang set sendiri lewat
// dashboard mereka.
export function SekolahLokasiManager() {
  const [list, setList] = useState<SekolahRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, { lat: string; lng: string; provinsi: string; kabupatenKota: string }>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  function load() {
    return fetch("/api/dinas/sekolah")
      .then((r) => r.json())
      .then((d) => {
        setList(d.sekolahList ?? []);
        const nextDraft: Record<string, { lat: string; lng: string; provinsi: string; kabupatenKota: string }> = {};
        for (const s of d.sekolahList ?? []) {
          nextDraft[s.id] = {
            lat: s.lat != null ? String(s.lat) : "",
            lng: s.lng != null ? String(s.lng) : "",
            provinsi: s.provinsi ?? "",
            kabupatenKota: s.kabupatenKota ?? "",
          };
        }
        setDraft(nextDraft);
      });
  }

  useEffect(() => {
    if (open) load().finally(() => setLoading(false));
  }, [open]);

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

  return (
    <Disclosure as="div" className="border border-neutral-200 rounded-lg p-4 text-sm">
      <DisclosureButton onClick={() => setOpen((o) => !o)} className="cursor-pointer flex items-center gap-1.5 font-medium text-sm">
        <ChevronDownIcon className={`size-4 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} />
        {open ? "Sembunyikan" : "Kelola"} Titik Lokasi Sekolah (geo-fence Suara Anak)
      </DisclosureButton>
      <DisclosurePanel>
        <div className="mt-3 space-y-3">
          {loading && <p className="text-xs text-neutral-500">Memuat...</p>}
          {!loading &&
            list.map((s) => (
              <div key={s.id} className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium w-40 truncate">{s.namaSekolah}</span>
                <input
                  className="w-28 rounded-md border border-neutral-300 px-2 py-1 text-xs"
                  placeholder="lat"
                  value={draft[s.id]?.lat ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [s.id]: { ...d[s.id], lat: e.target.value } }))
                  }
                />
                <input
                  className="w-28 rounded-md border border-neutral-300 px-2 py-1 text-xs"
                  placeholder="lng"
                  value={draft[s.id]?.lng ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [s.id]: { ...d[s.id], lng: e.target.value } }))
                  }
                />
                <input
                  className="w-28 rounded-md border border-neutral-300 px-2 py-1 text-xs"
                  placeholder="Provinsi"
                  value={draft[s.id]?.provinsi ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [s.id]: { ...d[s.id], provinsi: e.target.value } }))
                  }
                />
                <input
                  className="w-32 rounded-md border border-neutral-300 px-2 py-1 text-xs"
                  placeholder="Kabupaten/Kota"
                  value={draft[s.id]?.kabupatenKota ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [s.id]: { ...d[s.id], kabupatenKota: e.target.value } }))
                  }
                />
                <button
                  disabled={busyId === s.id}
                  onClick={() => simpan(s.id)}
                  className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs disabled:opacity-60"
                >
                  {busyId === s.id ? "Menyimpan..." : "Simpan"}
                </button>
                {savedId === s.id && <span className="text-xs text-green-700">Tersimpan.</span>}
              </div>
            ))}
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
