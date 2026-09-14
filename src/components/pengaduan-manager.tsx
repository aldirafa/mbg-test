"use client";

import { useEffect, useState } from "react";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

type PengaduanItem = {
  id: string;
  isi: string;
  status: string;
  createdAt: string;
  sekolah?: { namaSekolah: string } | null;
  orangtua?: { nama: string } | null;
  sppg?: { namaSppg: string } | null;
};

const STATUS_BADGE: Record<string, string> = {
  diterima: "bg-amber-100 text-amber-700",
  ditindaklanjuti: "bg-blue-100 text-blue-700",
  selesai: "bg-green-100 text-green-700",
};
const STATUS_LABEL: Record<string, string> = {
  diterima: "Diterima",
  ditindaklanjuti: "Ditindaklanjuti",
  selesai: "Selesai",
};
const NEXT_LABEL: Record<string, string> = {
  diterima: "Tandai Ditindaklanjuti",
  ditindaklanjuti: "Tandai Selesai",
};

function PengaduanContent({ open }: { open: boolean }) {
  const [list, setList] = useState<PengaduanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    return fetch("/api/dinas/pengaduan")
      .then((r) => r.json())
      .then((d) => setList(d.pengaduan ?? []));
  }

  useEffect(() => {
    if (open) load().finally(() => setLoading(false));
  }, [open]);

  async function advance(p: PengaduanItem) {
    setBusyId(p.id);
    const res = await fetch(`/api/dinas/pengaduan/${p.id}`, { method: "PATCH" });
    if (res.ok) await load();
    setBusyId(null);
  }

  return (
    <div className="space-y-3">
      {loading && <p className="text-xs text-neutral-500">Memuat...</p>}
      {!loading && list.length === 0 && <p className="text-xs text-neutral-500">Belum ada pengaduan.</p>}
      {list.map((p) => (
        <div key={p.id} className="border-t border-neutral-200 pt-3 first:border-t-0 first:pt-0">
          <div className="flex items-start justify-between gap-2">
            <div className="text-xs text-neutral-500">
              {p.sekolah?.namaSekolah ?? p.orangtua?.nama ?? "?"} &rarr; {p.sppg?.namaSppg ?? "?"}
            </div>
            <span className={"text-xs rounded-full px-2 py-0.5 " + (STATUS_BADGE[p.status] ?? "")}>
              {STATUS_LABEL[p.status] ?? p.status}
            </span>
          </div>
          <p className="text-sm mt-1">{p.isi}</p>
          {NEXT_LABEL[p.status] && (
            <button
              disabled={busyId === p.id}
              onClick={() => advance(p)}
              className="cursor-pointer mt-2 rounded-md border border-neutral-300 px-3 py-1.5 text-xs disabled:opacity-60"
            >
              {busyId === p.id ? "Menyimpan..." : NEXT_LABEL[p.status]}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// Dinas/Admin kelola status semua pengaduan (Fase 2, Bagian 6.5) -- diterima ->
// ditindaklanjuti -> selesai, linear sama kayak flag triangulasi. Pakai Headless UI
// Disclosure (ganti toggle manual) tapi tetep lazy-fetch cuma pas dibuka.
export function PengaduanManager() {
  return (
    <Disclosure as="div" className="border border-neutral-200 rounded-lg p-4 text-sm">
      {({ open }) => (
        <>
          <DisclosureButton className="cursor-pointer flex items-center gap-1.5 font-medium text-sm">
            <ChevronDownIcon className={`size-4 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} />
            {open ? "Sembunyikan" : "Kelola"} Pengaduan
          </DisclosureButton>
          <DisclosurePanel className="mt-3">
            <PengaduanContent open={open} />
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}
