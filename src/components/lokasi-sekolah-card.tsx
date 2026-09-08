"use client";

import { useEffect, useState } from "react";

// Kartu buat sekolah nge-set titik acuan lokasinya sendiri -- dipakai sbg pusat
// geo-fence Child Voice Interface (radius 10m, Fase 2). Sekolah bisa juga dibantu/
// dikoreksi sama Dinas/Admin lewat dashboard Dinas.
export function LokasiSekolahCard() {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/sekolah/lokasi")
      .then((r) => r.json())
      .then((d) => {
        setLat(d.lat ?? null);
        setLng(d.lng ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  function pakaiLokasiSaatIni() {
    setError(null);
    setSaved(false);
    if (!navigator.geolocation) {
      setError("Perangkat/browser ini tidak mendukung deteksi lokasi.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const res = await fetch("/api/sekolah/lokasi", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: latitude, lng: longitude }),
        });
        if (res.ok) {
          setLat(latitude);
          setLng(longitude);
          setSaved(true);
        } else {
          const data = await res.json().catch(() => null);
          setError(data?.error || "Gagal menyimpan lokasi");
        }
        setBusy(false);
      },
      () => {
        setError("Gagal mengambil lokasi -- pastikan izin lokasi diizinkan di browser.");
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="border border-neutral-200 rounded-lg p-4 text-sm space-y-2">
      <h2 className="font-medium text-sm">Titik Lokasi Sekolah</h2>
      <p className="text-xs text-neutral-500">
        Dipakai sebagai acuan verifikasi lokasi untuk formulir{" "}
        <span className="font-medium text-neutral-700">Suara Anak</span> (radius 10m).
        Set ini sambil berada di lokasi sekolah. Link formulirnya:{" "}
        <span className="font-mono">/suara-anak</span> -- pasang di QR area makan siswa.
      </p>
      {loading && <p className="text-xs text-neutral-500">Memuat...</p>}
      {!loading && (
        <p className="text-xs text-neutral-600">
          {lat != null && lng != null
            ? `Titik saat ini: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
            : "Belum diset."}
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {saved && <p className="text-xs text-green-700">Tersimpan.</p>}
      <button
        disabled={busy}
        onClick={pakaiLokasiSaatIni}
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium disabled:opacity-60"
      >
        {busy ? "Mengambil lokasi..." : "Gunakan Lokasi Saat Ini"}
      </button>
    </div>
  );
}
