"use client";

import { useEffect, useState } from "react";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

type SppgRow = { id: string; namaSppg: string; provinsi: string | null; kabupatenKota: string | null };

// Kelola profil provinsi/kabupaten-kota tiap SPPG (feedback tim 20 Sep) -- teks bebas
// (bukan dropdown resmi), dipakai sbg filter dashboard statistik Dinas. Polanya sama
// persis kayak SekolahLokasiManager, dipisah jadi komponen sendiri krn Sppg gak punya
// manager lain yang bisa digabung (beda dgn Sekolah yang udah ada buat lokasi geo-fence).
export function SppgProfilManager() {
  const [list, setList] = useState<SppgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, { provinsi: string; kabupatenKota: string }>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  function load() {
    return fetch("/api/dinas/sppg")
      .then((r) => r.json())
      .then((d) => {
        setList(d.sppgList ?? []);
        const nextDraft: Record<string, { provinsi: string; kabupatenKota: string }> = {};
        for (const s of d.sppgList ?? []) {
          nextDraft[s.id] = { provinsi: s.provinsi ?? "", kabupatenKota: s.kabupatenKota ?? "" };
        }
        setDraft(nextDraft);
      });
  }

  useEffect(() => {
    if (open) load().finally(() => setLoading(false));
  }, [open]);

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

  return (
    <Disclosure as="div" className="border border-neutral-200 rounded-lg p-4 text-sm">
      <DisclosureButton onClick={() => setOpen((o) => !o)} className="cursor-pointer flex items-center gap-1.5 font-medium text-sm">
        <ChevronDownIcon className={`size-4 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} />
        {open ? "Sembunyikan" : "Kelola"} Profil Provinsi/Kabupaten-Kota SPPG
      </DisclosureButton>
      <DisclosurePanel>
        <div className="mt-3 space-y-3">
          {loading && <p className="text-xs text-neutral-500">Memuat...</p>}
          {!loading &&
            list.map((s) => (
              <div key={s.id} className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium w-40 truncate">{s.namaSppg}</span>
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
