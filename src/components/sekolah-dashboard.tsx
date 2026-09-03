"use client";

import { useEffect, useState } from "react";

type Distribusi = {
  id: string;
  status: string;
  porsiDiterima: number | null;
  catatan: string | null;
  menu: {
    tanggal: string;
    deskripsi: string;
    jumlahPorsi: number;
    sppg: { namaSppg: string };
  };
};

type RowState = {
  porsiInput?: string;
  pesanText?: string;
  copied?: boolean;
  komplainOpen?: boolean;
  komplainText?: string;
  busy?: boolean;
};

const STATUS_LABEL: Record<string, string> = {
  dikirim: "Menunggu konfirmasi",
  diterima: "Diterima",
  bermasalah: "Bermasalah",
};

export function SekolahDashboard() {
  const [list, setList] = useState<Distribusi[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowState, setRowState] = useState<Record<string, RowState>>({});

  function patchRow(id: string, patch: Partial<RowState>) {
    setRowState((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function loadDistribusi() {
    return fetch("/api/sekolah/distribusi")
      .then((r) => r.json())
      .then((d) => setList(d.distribusi ?? []));
  }

  useEffect(() => {
    loadDistribusi().finally(() => setLoading(false));
  }, []);

  async function confirmTerima(d: Distribusi) {
    const porsi = Number(rowState[d.id]?.porsiInput ?? d.menu.jumlahPorsi);
    patchRow(d.id, { busy: true });
    const res = await fetch("/api/sekolah/konfirmasi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ distribusiId: d.id, porsiDiterima: porsi }),
    });
    if (res.ok) await loadDistribusi();
    patchRow(d.id, { busy: false });
  }

  async function generatePesan(d: Distribusi) {
    const res = await fetch(`/api/sekolah/pesan-harian?distribusiId=${d.id}`);
    const data = await res.json();
    if (res.ok) patchRow(d.id, { pesanText: data.text });
  }

  async function copyPesan(id: string) {
    const text = rowState[id]?.pesanText ?? "";
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard permission bisa ditolak browser -- teksnya tetap kelihatan di layar buat di-copy manual.
    }
    patchRow(id, { copied: true });
    setTimeout(() => patchRow(id, { copied: false }), 1600);
  }

  async function submitKomplain(d: Distribusi) {
    const catatan = rowState[d.id]?.komplainText?.trim();
    if (!catatan) return;
    patchRow(d.id, { busy: true });
    const res = await fetch("/api/sekolah/komplain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ distribusiId: d.id, catatan }),
    });
    if (res.ok) {
      await loadDistribusi();
      patchRow(d.id, { komplainOpen: false, komplainText: "" });
    }
    patchRow(d.id, { busy: false });
  }

  return (
    <main className="max-w-lg mx-auto p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Portal Sekolah</h1>
        <p className="text-sm text-neutral-500">Konfirmasi distribusi masuk &amp; bagikan info ke orangtua.</p>
      </div>

      {loading && <p className="text-sm text-neutral-500">Memuat...</p>}
      {!loading && list.length === 0 && (
        <p className="text-sm text-neutral-500">Belum ada distribusi masuk.</p>
      )}

      <div className="space-y-4">
        {list.map((d) => {
          const rs = rowState[d.id] ?? {};
          return (
            <div key={d.id} className="border border-neutral-200 rounded-lg p-4 text-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{d.menu.sppg.namaSppg}</div>
                  <div className="text-neutral-500">{d.menu.deskripsi}</div>
                  <div className="text-neutral-400 text-xs mt-1">
                    {new Date(d.menu.tanggal).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}{" "}
                    &middot; {d.menu.jumlahPorsi} porsi
                  </div>
                </div>
                <span
                  className={
                    "text-xs rounded-full px-2.5 py-1 whitespace-nowrap " +
                    (d.status === "diterima"
                      ? "bg-green-100 text-green-700"
                      : d.status === "bermasalah"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700")
                  }
                >
                  {STATUS_LABEL[d.status] ?? d.status}
                </span>
              </div>

              {d.status === "dikirim" && (
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    className="w-24 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                    placeholder={String(d.menu.jumlahPorsi)}
                    value={rs.porsiInput ?? ""}
                    onChange={(e) => patchRow(d.id, { porsiInput: e.target.value })}
                  />
                  <button
                    disabled={rs.busy}
                    onClick={() => confirmTerima(d)}
                    className="flex-1 rounded-md bg-neutral-900 text-white text-sm font-medium py-2 disabled:opacity-60"
                  >
                    Konfirmasi Terima
                  </button>
                </div>
              )}

              {d.status === "diterima" && (
                <div className="space-y-2">
                  <div className="text-xs text-neutral-500">
                    Dikonfirmasi {d.porsiDiterima ?? "?"}/{d.menu.jumlahPorsi} porsi.
                  </div>
                  {!rs.pesanText && (
                    <button
                      onClick={() => generatePesan(d)}
                      className="w-full rounded-md bg-neutral-900 text-white text-sm font-medium py-2"
                    >
                      Generate Pesan Siap-Bagi
                    </button>
                  )}
                  {rs.pesanText && (
                    <>
                      <pre className="whitespace-pre-wrap bg-neutral-50 border border-dashed border-neutral-300 rounded-md p-3 text-xs">
                        {rs.pesanText}
                      </pre>
                      <button
                        onClick={() => copyPesan(d.id)}
                        className="w-full rounded-md border border-neutral-300 text-sm font-medium py-2"
                      >
                        {rs.copied ? "Tersalin!" : "Salin Teks"}
                      </button>
                    </>
                  )}
                </div>
              )}

              {d.status === "bermasalah" && d.catatan && (
                <p className="text-xs text-red-600">Catatan: {d.catatan}</p>
              )}

              {d.status !== "bermasalah" && (
                <div>
                  {!rs.komplainOpen && (
                    <button
                      onClick={() => patchRow(d.id, { komplainOpen: true })}
                      className="text-xs text-neutral-500 underline"
                    >
                      Ajukan komplain
                    </button>
                  )}
                  {rs.komplainOpen && (
                    <div className="space-y-2 mt-1">
                      <textarea
                        className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm min-h-16"
                        placeholder="Contoh: ayam kurang matang di beberapa porsi..."
                        value={rs.komplainText ?? ""}
                        onChange={(e) => patchRow(d.id, { komplainText: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => patchRow(d.id, { komplainOpen: false })}
                          className="flex-1 rounded-md border border-neutral-300 text-sm py-1.5"
                        >
                          Batal
                        </button>
                        <button
                          disabled={rs.busy}
                          onClick={() => submitKomplain(d)}
                          className="flex-1 rounded-md bg-neutral-900 text-white text-sm py-1.5 disabled:opacity-60"
                        >
                          Kirim
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
