"use client";

import { useEffect, useState } from "react";

type PengaduanItem = {
  id: string;
  isi: string;
  status: string;
  createdAt: string;
  sekolah?: { namaSekolah: string } | null;
  orangtua?: { nama: string } | null;
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
      await load();
    }
    setBusy(false);
  }

  return (
    <div className="border border-neutral-200 rounded-lg p-4 text-sm space-y-3">
      <h2 className="font-medium text-sm">{title ?? "Pengaduan"}</h2>

      {!readOnly && (
        <div className="space-y-2">
          <textarea
            value={isi}
            onChange={(e) => setIsi(e.target.value)}
            placeholder="Ceritain masalahnya..."
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm min-h-16"
          />
          <button
            disabled={busy || !isi.trim()}
            onClick={submit}
            className="rounded-md bg-neutral-900 text-white text-xs font-medium px-3 py-1.5 disabled:opacity-60"
          >
            {busy ? "Mengirim..." : "Kirim Pengaduan"}
          </button>
        </div>
      )}

      {loading && <p className="text-xs text-neutral-500">Memuat...</p>}
      {!loading && list.length === 0 && (
        <p className="text-xs text-neutral-500">Belum ada pengaduan.</p>
      )}
      {!loading && list.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-neutral-200">
          {list.map((p) => (
            <div key={p.id} className="flex items-start justify-between gap-2 text-xs">
              <span className="text-neutral-600 flex-1">
                {showSubmitter && (
                  <span className="font-medium text-neutral-800">
                    {p.sekolah?.namaSekolah ?? p.orangtua?.nama ?? "?"}:{" "}
                  </span>
                )}
                {p.isi}
              </span>
              <span
                className={"rounded-full px-2 py-0.5 flex-shrink-0 " + (STATUS_BADGE[p.status] ?? "")}
              >
                {STATUS_LABEL[p.status] ?? p.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
