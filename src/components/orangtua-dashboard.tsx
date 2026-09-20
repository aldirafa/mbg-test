"use client";

import { useEffect, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { DashboardShell } from "@/components/dashboard-shell";
import { RatingWidget } from "@/components/rating-widget";
import { PengaduanPanel } from "@/components/pengaduan-panel";
import { PersetujuanOrangtuaGate } from "@/components/formulir-persetujuan-orangtua";
import { formatAngkaID } from "@/lib/format";

type ChildData = {
  siswa: { id: string; nama: string; kelas: string | null };
  sekolah: { namaSekolah: string };
  distribusi: {
    id: string;
    status: string;
    menu: {
      tanggal: string;
      deskripsi: string;
      fotoUrl: string | null;
      jumlahPorsi: number;
      nomorMenu: number | null;
      siklus: number | null;
      energiKategoriI: number | null;
      proteinKategoriI: number | null;
      lemakKategoriI: number | null;
      karbohidratKategoriI: number | null;
      energiKategoriII: number | null;
      proteinKategoriII: number | null;
      lemakKategoriII: number | null;
      karbohidratKategoriII: number | null;
      sppg: { id: string; namaSppg: string };
    };
  } | null;
  konfirmasi: { statusTerima: string; catatan: string | null } | null;
};

// Blok nilai gizi read-only, sama gayanya kayak yang di dashboard SPPG.
function GiziBlock({
  label,
  energi,
  protein,
  lemak,
  karbohidrat,
}: {
  label: string;
  energi: number;
  protein: number;
  lemak: number;
  karbohidrat: number;
}) {
  return (
    <div className="text-xs">
      <p className="font-medium text-neutral-700">{label}</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-neutral-500 mt-1">
        <span>Energi: {formatAngkaID(energi)} kkal</span>
        <span>Protein: {formatAngkaID(protein)} g</span>
        <span>Lemak: {formatAngkaID(lemak)} g</span>
        <span>Karbohidrat: {formatAngkaID(karbohidrat)} g</span>
      </div>
    </div>
  );
}

export function OrangtuaDashboard() {
  const [children, setChildren] = useState<ChildData[]>([]);
  const [loading, setLoading] = useState(true);
  const [masalahOpenFor, setMasalahOpenFor] = useState<string | null>(null);
  const [catatan, setCatatan] = useState("");
  const [busy, setBusy] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function load() {
    return fetch("/api/orangtua/menu-hari-ini")
      .then((r) => r.json())
      .then((d) => setChildren(d.children ?? []));
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function submitKonfirmasi(child: ChildData, statusTerima: "diterima" | "ada_masalah", note?: string) {
    if (!child.distribusi) return;
    setBusy(true);
    await fetch("/api/orangtua/konfirmasi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        distribusiId: child.distribusi.id,
        siswaId: child.siswa.id,
        statusTerima,
        catatan: note,
      }),
    });
    await load();
    setBusy(false);
    setMasalahOpenFor(null);
    setCatatan("");
  }

  return (
    <PersetujuanOrangtuaGate>
    <DashboardShell title="Portal Orang Tua" subtitle="Menu hari ini & konfirmasi anak menerima makan">
      <main className="max-w-lg mx-auto p-6 space-y-6">
        {loading && <p className="text-sm text-neutral-500">Memuat...</p>}
        {!loading && children.length === 0 && (
          <p className="text-sm text-neutral-500">Belum ada data anak terhubung ke akun ini.</p>
        )}

        <div className="space-y-4">
          {children.map((child) => {
            const menungguSekolah = child.distribusi?.status === "dikirim";
            const menu = child.distribusi?.menu;
            const expanded = expandedIds.has(child.siswa.id);
            const adaGiziI =
              menu &&
              menu.energiKategoriI != null &&
              menu.proteinKategoriI != null &&
              menu.lemakKategoriI != null &&
              menu.karbohidratKategoriI != null;
            const adaGiziII =
              menu &&
              menu.energiKategoriII != null &&
              menu.proteinKategoriII != null &&
              menu.lemakKategoriII != null &&
              menu.karbohidratKategoriII != null;

            return (
              <div key={child.siswa.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                <div className="p-4">
                  <div className="text-xs uppercase tracking-wide text-neutral-400 font-medium">
                    Menu Hari Ini &middot; {child.sekolah.namaSekolah}
                  </div>
                  {child.distribusi && menu ? (
                    <>
                      <p className="font-medium mt-1">{menu.deskripsi}</p>
                      {menu.nomorMenu != null && menu.siklus != null && (
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Menu {menu.nomorMenu} Siklus {menu.siklus}
                        </p>
                      )}
                      <p className="text-xs text-neutral-500 mt-1">
                        Untuk: <span className="text-neutral-900 font-medium">{child.siswa.nama}</span>
                        {child.siswa.kelas ? ` · ${child.siswa.kelas}` : ""}
                      </p>

                      <button
                        onClick={() => toggleExpand(child.siswa.id)}
                        className="cursor-pointer mt-2 flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800"
                      >
                        {expanded ? (
                          <>
                            <ChevronUpIcon className="size-3.5" /> Sembunyikan rincian menu
                          </>
                        ) : (
                          <>
                            <ChevronDownIcon className="size-3.5" /> Lihat rincian menu
                          </>
                        )}
                      </button>

                      {expanded && (
                        <div className="mt-2 pt-2 border-t border-neutral-200 space-y-3">
                          {menu.fotoUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={menu.fotoUrl}
                              alt={`Foto menu: ${menu.deskripsi}`}
                              className="w-full max-h-80 object-contain rounded-md border border-neutral-200 bg-neutral-50"
                            />
                          )}
                          {(adaGiziI || adaGiziII) && (
                            <div className="space-y-2">
                              {adaGiziI && (
                                <GiziBlock
                                  label="Nilai Gizi – Kategori I (SD)"
                                  energi={menu.energiKategoriI!}
                                  protein={menu.proteinKategoriI!}
                                  lemak={menu.lemakKategoriI!}
                                  karbohidrat={menu.karbohidratKategoriI!}
                                />
                              )}
                              {adaGiziII && (
                                <GiziBlock
                                  label="Nilai Gizi – Kategori II (SMP ke atas)"
                                  energi={menu.energiKategoriII!}
                                  protein={menu.proteinKategoriII!}
                                  lemak={menu.lemakKategoriII!}
                                  karbohidrat={menu.karbohidratKategoriII!}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-neutral-500 mt-1">Belum ada menu yang tercatat hari ini.</p>
                  )}
                </div>

                {child.distribusi && menungguSekolah && (
                  <div className="p-4 border-t border-neutral-200">
                    <p className="text-sm text-neutral-500">
                      Menunggu konfirmasi sekolah &mdash; belum bisa dikonfirmasi dulu.
                    </p>
                  </div>
                )}

                {child.distribusi && !menungguSekolah && !child.konfirmasi && masalahOpenFor !== child.siswa.id && (
                  <div className="p-4 border-t border-neutral-200 space-y-2">
                    <p className="text-sm font-medium">
                      Apakah {child.siswa.nama} menerima makan hari ini?
                    </p>
                    <div className="flex flex-col gap-2">
                      <button
                        disabled={busy}
                        onClick={() => submitKonfirmasi(child, "diterima")}
                        className="cursor-pointer rounded-md bg-neutral-900 text-white text-sm font-medium py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Ya, diterima
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => setMasalahOpenFor(child.siswa.id)}
                        className="cursor-pointer rounded-md border border-neutral-300 text-sm font-medium py-2.5"
                      >
                        Tidak / ada masalah
                      </button>
                    </div>
                  </div>
                )}

                {masalahOpenFor === child.siswa.id && (
                  <div className="p-4 border-t border-neutral-200 space-y-2">
                    <p className="text-sm font-medium">Ceritain apa yang terjadi</p>
                    <textarea
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder={`Contoh: ${child.siswa.nama} bilang gak kebagian nasi hari ini...`}
                      className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm min-h-20"
                    />
                    <button
                      disabled={busy}
                      onClick={() => submitKonfirmasi(child, "ada_masalah", catatan)}
                      className="cursor-pointer w-full rounded-md bg-neutral-900 text-white text-sm font-medium py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Kirim Laporan
                    </button>
                  </div>
                )}

                {child.distribusi && !menungguSekolah && (
                  <div className="p-4 border-t border-neutral-200">
                    <RatingWidget
                      endpoint="/api/orangtua/rating"
                      extraBody={{ sppgId: child.distribusi.menu.sppg.id }}
                      label={`Kasih rating buat ${child.distribusi.menu.sppg.namaSppg}`}
                    />
                  </div>
                )}

                {child.konfirmasi && (
                  <div className="p-4 border-t border-neutral-200">
                    {child.konfirmasi.statusTerima === "diterima" ? (
                      <p className="text-sm text-green-700">
                        Terima kasih sudah konfirmasi &mdash; {child.siswa.nama} tercatat menerima makan hari ini.
                      </p>
                    ) : (
                      <p className="text-sm text-amber-700">
                        Laporan terkirim &mdash; status: menunggu ditindaklanjuti.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {children.some((c) => c.distribusi) && (
          <PengaduanPanel
            endpoint="/api/orangtua/pengaduan"
            title="Pengaduan ke SPPG"
            extraBody={(() => {
              const withDistribusi = children.find((c) => c.distribusi);
              return withDistribusi
                ? {
                    sppgId: withDistribusi.distribusi!.menu.sppg.id,
                    distribusiId: withDistribusi.distribusi!.id,
                  }
                : {};
            })()}
          />
        )}
      </main>
    </DashboardShell>
    </PersetujuanOrangtuaGate>
  );
}
