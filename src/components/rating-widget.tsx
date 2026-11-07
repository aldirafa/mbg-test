"use client";

import { useState } from "react";
import { Button, Field, MessageBar, MessageBarBody, Rating, Textarea } from "@fluentui/react-components";
import { ArrowRepeatAllRegular, CheckmarkCircleRegular, SendRegular } from "@fluentui/react-icons";

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
  const [skor, setSkor] = useState(0);
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
    setSkor(0);
    setCatatan("");
    setError(null);
  }

  if (done) {
    return (
      <div className="flex flex-col items-start gap-2 mbg-rise">
        <MessageBar layout="multiline" intent="success" icon={<CheckmarkCircleRegular />}>
          <MessageBarBody>Makasih ratingnya!</MessageBarBody>
        </MessageBar>
        <Button size="small" icon={<ArrowRepeatAllRegular />} onClick={kirimLagi}>
          Kirim rating lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Field label={label ?? "Kasih rating"}>
        <Rating value={skor} onChange={(_, d) => setSkor(d.value)} size="extra-large" color="marigold" />
      </Field>
      <Field label="Catatan (opsional)">
        <Textarea value={catatan} onChange={(_, d) => setCatatan(d.value)} resize="vertical" rows={2} />
      </Field>
      {error && (
        <MessageBar layout="multiline" intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      <div>
        <Button appearance="primary" icon={<SendRegular />} disabled={!skor || busy} onClick={submit}>
          {busy ? "Mengirim..." : "Kirim Rating"}
        </Button>
      </div>
    </div>
  );
}
