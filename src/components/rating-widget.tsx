"use client";

import { useState } from "react";

// Widget rating berkala (Fase 2, Bagian 6.4) -- dipakai di dashboard Sekolah & Orangtua.
// `endpoint` beda per peran (server yang resolve sppgId buat Sekolah; Orangtua kirim
// sppgId eksplisit lewat extraBody karena bisa punya anak di SPPG berbeda-beda).
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

  if (done) {
    return <p className="text-xs text-green-700">Makasih ratingnya!</p>;
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-neutral-700">{label ?? "Kasih rating"}</div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setSkor(n)}
            className={"text-xl leading-none " + (skor && n <= skor ? "" : "opacity-25")}
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
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium disabled:opacity-60"
      >
        {busy ? "Mengirim..." : "Kirim Rating"}
      </button>
    </div>
  );
}
