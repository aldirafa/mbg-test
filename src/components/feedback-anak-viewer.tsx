"use client";

import { useEffect, useState } from "react";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
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
  return values
    .map((v) => opsi.find((o) => o.value === v)?.label ?? v)
    .join(", ");
}

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

  // Data lama (sebelum revisi 20 Sep) gak punya `penilaian`/`kondisiHabis` -- fallback
  // ke boolean suka/habis legacy buat hitung ringkasan & tampilan per-baris.
  const totalSuka = list.filter((f) => (f.penilaian ? f.penilaian !== "tidak_suka" : f.suka)).length;
  const totalHabis = list.filter((f) => (f.kondisiHabis ? f.kondisiHabis === "habis" : f.habis)).length;
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
            {list.map((f) => {
              const penilaianLabel = labelDari(OPSI_PENILAIAN, f.penilaian) ?? (f.suka ? "😋 Suka (data lama)" : "😕 Kurang suka (data lama)");
              const kondisiHabisLabel =
                labelDari(OPSI_KONDISI_HABIS, f.kondisiHabis) ?? (f.habis ? "🍽️ Habis (data lama)" : "🥡 Tidak habis (data lama)");
              const kondisiKemasanLabel = labelDari(OPSI_KONDISI_KEMASAN, f.kondisiKemasan);

              return (
                <div key={f.id} className="border-t border-neutral-200 pt-2 first:border-t-0 first:pt-0 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{f.siswa ? `${f.siswa.nama} (${f.siswa.nisNisn})` : f.sekolah.namaSekolah}</span>
                    <span className="text-neutral-400">{!f.lokasiTerverifikasi && "⚠️ lokasi belum terverifikasi"}</span>
                  </div>
                  <p className="text-neutral-600">
                    {penilaianLabel} &middot; {kondisiHabisLabel}
                    {kondisiKemasanLabel && <> &middot; Kemasan: {kondisiKemasanLabel}</>}
                  </p>
                  {f.alasanSuka.length > 0 && (
                    <p className="text-neutral-500">Suka karena: {labelDaftar(OPSI_ALASAN_SUKA, f.alasanSuka)}</p>
                  )}
                  {f.alasanKurangSuka.length > 0 && (
                    <p className="text-neutral-500">
                      Kurang suka karena: {labelDaftar(OPSI_ALASAN_KURANG_SUKA, f.alasanKurangSuka)}
                      {f.alasanKurangSukaLainnya && <> ({f.alasanKurangSukaLainnya})</>}
                    </p>
                  )}
                  {f.alasanTidakHabis.length > 0 && (
                    <p className="text-neutral-500">
                      Gak habis karena: {labelDaftar(OPSI_ALASAN_TIDAK_HABIS, f.alasanTidakHabis)}
                      {f.alasanTidakHabisLainnya && <> ({f.alasanTidakHabisLainnya})</>}
                    </p>
                  )}
                  {f.perbaikanDiinginkan.length > 0 && (
                    <p className="text-neutral-500">Ingin diperbaiki: {labelDaftar(OPSI_PERBAIKAN, f.perbaikanDiinginkan)}</p>
                  )}
                  {f.catatanPerbaikan && f.perbaikanDiinginkan.length === 0 && (
                    <p className="text-neutral-600">{f.catatanPerbaikan}</p>
                  )}
                </div>
              );
            })}
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
