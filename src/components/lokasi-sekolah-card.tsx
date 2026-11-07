"use client";

import { useEffect, useState } from "react";
import {
  Body1,
  Button,
  Caption1,
  MessageBar,
  MessageBarBody,
  SkeletonItem,
  Spinner,
} from "@fluentui/react-components";
import { LocationRegular, MyLocationRegular } from "@fluentui/react-icons";
import { SectionCard } from "@/components/ui/section-card";

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
    <SectionCard
      title="Titik Lokasi Sekolah"
      icon={<LocationRegular />}
      description={
        <>
          Acuan verifikasi lokasi formulir <b>Suara Anak</b> (radius 10m). Set sambil berada di lokasi sekolah. Link
          formulir: <code className="font-mono">/suara-anak</code>, pasang QR-nya di area makan siswa.
        </>
      }
    >
      {loading ? (
        <SkeletonItem size={16} style={{ maxWidth: 240 }} />
      ) : (
        <div className="flex flex-col">
          <Caption1 className="text-fg3">Titik saat ini</Caption1>
          <Body1 className="font-mono tabular-nums">
            {lat != null && lng != null ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : "Belum diset"}
          </Body1>
        </div>
      )}
      {error && (
        <MessageBar layout="multiline" intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      {saved && (
        <MessageBar layout="multiline" intent="success">
          <MessageBarBody>Lokasi tersimpan.</MessageBarBody>
        </MessageBar>
      )}
      <div>
        <Button
          disabled={busy}
          onClick={pakaiLokasiSaatIni}
          icon={busy ? <Spinner size="tiny" /> : <MyLocationRegular />}
        >
          {busy ? "Mengambil lokasi..." : "Gunakan Lokasi Saat Ini"}
        </Button>
      </div>
    </SectionCard>
  );
}
