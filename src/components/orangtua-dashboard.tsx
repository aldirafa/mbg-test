"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

type ChildData = {
  siswa: { id: string; nama: string; kelas: string | null };
  sekolah: { namaSekolah: string };
  distribusi: {
    id: string;
    status: string;
    menu: { tanggal: string; deskripsi: string };
  } | null;
  konfirmasi: { statusTerima: string; catatan: string | null } | null;
};

export function OrangtuaDashboard() {
  const [children, setChildren] = useState<ChildData[]>([]);
  const [loading, setLoading] = useState(true);
  const [masalahOpenFor, setMasalahOpenFor] = useState<string | null>(null);
  const [catatan, setCatatan] = useState("");
  const [busy, setBusy] = useState(false);

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
    <main className="max-w-lg mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Dashboard Orangtua</h1>
          <p className="text-sm text-neutral-500">Menu hari ini &amp; konfirmasi anak menerima makan.</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm rounded-md border border-neutral-300 px-3 py-1.5 flex-shrink-0"
        >
          Keluar
        </button>
      </div>

      {loading && <p className="text-sm text-neutral-500">Memuat...</p>}
      {!loading && children.length === 0 && (
        <p className="text-sm text-neutral-500">Belum ada data anak terhubung ke akun ini.</p>
      )}

      <div className="space-y-4">
        {children.map((child) => {
          const menungguSekolah = child.distribusi?.status === "dikirim";
          return (
            <div key={child.siswa.id} className="border border-neutral-200 rounded-lg overflow-hidden">
              <div className="p-4">
                <div className="text-xs uppercase tracking-wide text-neutral-400 font-medium">
                  Menu Hari Ini &middot; {child.sekolah.namaSekolah}
                </div>
                {child.distribusi ? (
                  <>
                    <p className="font-medium mt-1">{child.distribusi.menu.deskripsi}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Untuk: <span className="text-neutral-900 font-medium">{child.siswa.nama}</span>
                      {child.siswa.kelas ? ` · ${child.siswa.kelas}` : ""}
                    </p>
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
                      className="rounded-md bg-neutral-900 text-white text-sm font-medium py-2.5 disabled:opacity-60"
                    >
                      Ya, diterima
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => setMasalahOpenFor(child.siswa.id)}
                      className="rounded-md border border-neutral-300 text-sm font-medium py-2.5"
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
                    className="w-full rounded-md bg-neutral-900 text-white text-sm font-medium py-2.5 disabled:opacity-60"
                  >
                    Kirim Laporan
                  </button>
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
    </main>
  );
}
