"use client";

import { useEffect, useState } from "react";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

type FeedbackItem = {
  id: string;
  suka: boolean;
  habis: boolean;
  catatanPerbaikan: string | null;
  lokasiTerverifikasi: boolean;
  createdAt: string;
  sekolah: { namaSekolah: string };
  tanggal: string;
  siswa?: { nama: string; nisNisn: string };
};

function FeedbackAnakContent({ open }: { open: boolean }) {
  const [list, setList] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetch("/api/dinas/feedback-anak")
        .then((r) => r.json())
        .then((d) => setList(d.feedback ?? []))
        .finally(() => setLoading(false));
    }
  }, [open]);

  const totalSuka = list.filter((f) => f.suka).length;
  const totalHabis = list.filter((f) => f.habis).length;
  const belumTerverifikasi = list.filter((f) => !f.lokasiTerverifikasi).length;

  return (
    <div className="space-y-3">
      {loading && <p className="text-xs text-neutral-500">Memuat...</p>}
      {!loading && list.length === 0 && <p className="text-xs text-neutral-500">Belum ada feedback masuk.</p>}
      {!loading && list.length > 0 && (
        <>
          <p className="text-xs text-neutral-500">
            {totalSuka}/{list.length} suka menunya &middot; {totalHabis}/{list.length} habis
            {belumTerverifikasi > 0 && <> &middot; {belumTerverifikasi} lokasi belum terverifikasi (perlu ditinjau manual)</>}
          </p>
          <div className="space-y-2">
            {list.map((f) => (
              <div key={f.id} className="border-t border-neutral-200 pt-2 first:border-t-0 first:pt-0 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{f.siswa ? `${f.siswa.nama} (${f.siswa.nisNisn})` : f.sekolah.namaSekolah}</span>
                  <span className="text-neutral-400">
                    {f.suka ? "😋" : "😕"} {f.habis ? "🍽️" : "🥡"}
                    {!f.lokasiTerverifikasi && " ⚠️"}
                  </span>
                </div>
                {f.catatanPerbaikan && <p className="text-neutral-600 mt-1">{f.catatanPerbaikan}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Dinas/Admin lihat feedback Suara Anak (CVI, Fase 2). Identitas siswa (nama/NIS-NISN)
// cuma kebawa kalau API-nya ngebalikin (role admin) -- lihat src/app/api/dinas/feedback-anak.
// Pakai Headless UI Disclosure (ganti toggle manual) tapi tetep lazy-fetch cuma pas dibuka.
export function FeedbackAnakViewer() {
  return (
    <Disclosure as="div" className="border border-neutral-200 rounded-lg p-4 text-sm">
      {({ open }) => (
        <>
          <DisclosureButton className="cursor-pointer flex items-center gap-1.5 font-medium text-sm">
            <ChevronDownIcon className={`size-4 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} />
            {open ? "Sembunyikan" : "Lihat"} Feedback Suara Anak (CVI)
          </DisclosureButton>
          <DisclosurePanel className="mt-3">
            <FeedbackAnakContent open={open} />
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}
