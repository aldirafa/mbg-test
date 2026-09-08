"use client";

import { useState } from "react";

type Step = "form" | "submitting" | "sukses" | "error";

// Formulir publik (tanpa login) Child Voice Interface -- diakses lewat QR di lingkungan
// sekolah. Sengaja simpel & besar tombolnya (emoji), soalnya dipakai anak-anak.
export function SuaraAnakForm() {
  const [nisNisn, setNisNisn] = useState("");
  const [suka, setSuka] = useState<boolean | null>(null);
  const [habis, setHabis] = useState<boolean | null>(null);
  const [catatan, setCatatan] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [errorMsg, setErrorMsg] = useState("");

  const bisaKirim = nisNisn.trim().length > 0 && suka !== null && habis !== null;

  function ambilLokasiLaluKirim() {
    setStep("submitting");
    setErrorMsg("");

    const kirim = (lat: number | null, lng: number | null) => {
      fetch("/api/anak/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nisNisn: nisNisn.trim(),
          suka,
          habis,
          catatanPerbaikan: catatan.trim() || undefined,
          lat,
          lng,
        }),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (res.ok) {
            setStep("sukses");
          } else {
            setErrorMsg(data.error || "Gagal mengirim, coba lagi ya.");
            setStep("error");
          }
        })
        .catch(() => {
          setErrorMsg("Gagal mengirim, coba lagi ya.");
          setStep("error");
        });
    };

    if (!navigator.geolocation) {
      kirim(null, null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => kirim(pos.coords.latitude, pos.coords.longitude),
      () => kirim(null, null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function resetForm() {
    setNisNisn("");
    setSuka(null);
    setHabis(null);
    setCatatan("");
    setStep("form");
    setErrorMsg("");
  }

  if (step === "sukses") {
    return (
      <div className="max-w-sm mx-auto p-6 text-center space-y-3">
        <div className="text-5xl">🎉</div>
        <h1 className="text-lg font-semibold">Makasih udah cerita!</h1>
        <p className="text-sm text-neutral-500">Jawaban kamu udah terkirim.</p>
        <button onClick={resetForm} className="text-sm underline text-neutral-500">
          Isi lagi (buat teman lain)
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto p-6 space-y-6">
      <div className="text-center space-y-1">
        <div className="text-4xl">🍽️</div>
        <h1 className="text-lg font-semibold">Suara Anak MBG</h1>
        <p className="text-sm text-neutral-500">Ceritain menu makan siang kamu hari ini yuk!</p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">NIS / NISN kamu</label>
        <input
          value={nisNisn}
          onChange={(e) => setNisNisn(e.target.value)}
          placeholder="Contoh: 1234567890"
          className="w-full rounded-md border border-neutral-300 px-3 py-2.5 text-sm"
        />
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Suka gak menunya?</div>
        <div className="flex gap-3">
          <button
            onClick={() => setSuka(true)}
            className={
              "flex-1 rounded-xl border-2 py-4 text-3xl " +
              (suka === true ? "border-neutral-900 bg-neutral-50" : "border-neutral-200")
            }
          >
            😋
          </button>
          <button
            onClick={() => setSuka(false)}
            className={
              "flex-1 rounded-xl border-2 py-4 text-3xl " +
              (suka === false ? "border-neutral-900 bg-neutral-50" : "border-neutral-200")
            }
          >
            😕
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Makanannya habis gak?</div>
        <div className="flex gap-3">
          <button
            onClick={() => setHabis(true)}
            className={
              "flex-1 rounded-xl border-2 py-4 text-3xl " +
              (habis === true ? "border-neutral-900 bg-neutral-50" : "border-neutral-200")
            }
          >
            🍽️
          </button>
          <button
            onClick={() => setHabis(false)}
            className={
              "flex-1 rounded-xl border-2 py-4 text-3xl " +
              (habis === false ? "border-neutral-900 bg-neutral-50" : "border-neutral-200")
            }
          >
            🥡
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Ada yang mau diperbaiki? (opsional)</label>
        <textarea
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Contoh: sayurnya kurang asin..."
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm min-h-20"
        />
      </div>

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      <button
        disabled={!bisaKirim || step === "submitting"}
        onClick={ambilLokasiLaluKirim}
        className="w-full rounded-md bg-neutral-900 text-white text-sm font-medium py-3 disabled:opacity-60"
      >
        {step === "submitting" ? "Mengirim..." : "Kirim"}
      </button>
    </div>
  );
}
