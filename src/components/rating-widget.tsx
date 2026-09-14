"use client";

import { useState } from "react";

// Widget rating berkala (Fase 2, Bagian 6.4) -- dipakai di dashboard Sekolah & Orangtua.
// `endpoint` beda per peran (server yang resolve sppgId buat Sekolah; Orangtua kirim
// sppgId eksplisit lewat extraBody karena bisa punya anak di SPPG berbeda-beda).
//
// Backend udah support kirim berkali-kali (gak ada limit/cooldown, lihat komentar di
// route API-nya) -- widget ini sengaja gak nyembunyiin diri permanen abis submit,
// dikasih tombol "Kirim rating lagi" biar keliatan jelas bisa dipakai berulang
// (feedback Teh Lingga: awalnya kelihatan cuma bisa sekali karena UI-nya nyembunyiin
// form abis submit, bukan karena backend-nya beneran ngebatesin).
export function RatingWidget({
  endpoint,
  extraBody,
  label,
}: {
  endpoint: string;
  extraBody?: Record<string, unknown>;
  label?: string;
}) {
  const [skor, setSkor] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [catatan, setCatatan] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!skor) return;
    setBusy(true);
    setError(null);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skor, catatan: catatan.trim() || undefined, ...extraBody }),
    });
    if (res.ok) {
      setDone(true);
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Gagal mengirim rating");
    }
    setBusy(false);
  }

  function kirimLagi() {
    setDone(false);
    setSkor(null);
    setHover(null);
    setCatatan("");
    setError(null);
  }

  if (done) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-green-700">Makasih ratingnya!</p>
        <button
          onClick={kirimLagi}
          className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium"
        >
          Kirim rating lagi
        </button>
      </div>
    );
  }

  const tampil = hover ?? skor ?? 0;

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-neutral-700">{label ?? "Kasih rating"}</div>
      <div className="flex gap-1" onMouseLeave={() => setHover(null)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setSkor(n)}
            onMouseEnter={() => setHover(n)}
            className={"cursor-pointer text-xl leading-none transition-opacity " + (n <= tampil ? "" : "opacity-25")}
            aria-label={`${n} bintang`}
          >
            ⭐
          </button>
        ))}
      </div>
      <textarea
        value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
        placeholder="Catatan (opsional)"
        className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-xs min-h-14"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        disabled={!skor || busy}
        onClick={submit}
        className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {busy ? "Mengirim..." : "Kirim Rating"}
      </button>
    </div>
  );
}
