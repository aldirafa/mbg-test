"use client";

import { useState } from "react";
import {
  INTRO_SUARA_ANAK,
  PERTANYAAN_PENILAIAN,
  OPSI_PENILAIAN,
  PERTANYAAN_ALASAN_SUKA,
  OPSI_ALASAN_SUKA,
  PERTANYAAN_ALASAN_KURANG_SUKA,
  OPSI_ALASAN_KURANG_SUKA,
  tampilkanAlasanSuka,
  tampilkanAlasanKurangSuka,
  PERTANYAAN_KONDISI_HABIS,
  OPSI_KONDISI_HABIS,
  PERTANYAAN_ALASAN_TIDAK_HABIS,
  OPSI_ALASAN_TIDAK_HABIS,
  tampilkanAlasanTidakHabis,
  PERTANYAAN_KONDISI_KEMASAN,
  OPSI_KONDISI_KEMASAN,
  PERTANYAAN_PERBAIKAN,
  OPSI_PERBAIKAN,
  type OpsiSuaraAnak,
} from "@/lib/suara-anak";

type Step = "form" | "submitting" | "sukses" | "error";

// Tombol besar emoji buat pilihan 3-way (penilaian / kondisi habis / kondisi kemasan).
function TombolEmoji<T extends string>({
  opsi,
  value,
  onChange,
}: {
  opsi: OpsiSuaraAnak[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {opsi.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value as T)}
          className={
            "flex-1 rounded-xl border-2 py-3 px-1 text-center " +
            (value === o.value ? "border-neutral-900 bg-neutral-50" : "border-neutral-200")
          }
        >
          <div className="text-2xl leading-none">{o.label.split(" ")[0]}</div>
          <div className="text-[11px] mt-1 leading-tight">{o.label.split(" ").slice(1).join(" ")}</div>
        </button>
      ))}
    </div>
  );
}

// Checkbox chip multi-select, dipakai buat semua pertanyaan follow-up "bisa pilih
// lebih dari satu" -- opsi dgn butuhTeksLainnya nampilin input teks tambahan pas dipilih.
function MultiSelectChips({
  opsi,
  value,
  onToggle,
  teksLainnya,
  onTeksLainnyaChange,
}: {
  opsi: OpsiSuaraAnak[];
  value: string[];
  onToggle: (v: string) => void;
  teksLainnya?: string;
  onTeksLainnyaChange?: (v: string) => void;
}) {
  const opsiLainnya = opsi.find((o) => o.butuhTeksLainnya);
  const lainnyaDipilih = opsiLainnya != null && value.includes(opsiLainnya.value);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {opsi.map((o) => (
          <button
            key={o.value}
            onClick={() => onToggle(o.value)}
            className={
              "rounded-full border-2 px-3 py-1.5 text-xs " +
              (value.includes(o.value) ? "border-neutral-900 bg-neutral-50" : "border-neutral-200")
            }
          >
            {o.label}
          </button>
        ))}
      </div>
      {lainnyaDipilih && onTeksLainnyaChange && (
        <input
          value={teksLainnya ?? ""}
          onChange={(e) => onTeksLainnyaChange(e.target.value)}
          placeholder="Sebutkan..."
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}

// Formulir publik (tanpa login) Child Voice Interface -- diakses lewat QR di lingkungan
// sekolah. Sengaja simpel & besar tombolnya (emoji), soalnya dipakai anak-anak.
// Redesign 20 Sep (feedback tim Prof Elly) -- lihat src/lib/suara-anak.ts buat teks &
// opsi verbatim yang dikasih tim.
export function SuaraAnakForm() {
  const [nisNisn, setNisNisn] = useState("");
  const [penilaian, setPenilaian] = useState<string | null>(null);
  const [alasanSuka, setAlasanSuka] = useState<string[]>([]);
  const [alasanKurangSuka, setAlasanKurangSuka] = useState<string[]>([]);
  const [alasanKurangSukaLainnya, setAlasanKurangSukaLainnya] = useState("");
  const [kondisiHabis, setKondisiHabis] = useState<string | null>(null);
  const [alasanTidakHabis, setAlasanTidakHabis] = useState<string[]>([]);
  const [alasanTidakHabisLainnya, setAlasanTidakHabisLainnya] = useState("");
  const [kondisiKemasan, setKondisiKemasan] = useState<string | null>(null);
  const [perbaikanDiinginkan, setPerbaikanDiinginkan] = useState<string[]>([]);
  const [catatanPerbaikan, setCatatanPerbaikan] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [errorMsg, setErrorMsg] = useState("");

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  const bisaKirim = nisNisn.trim().length > 0 && penilaian !== null && kondisiHabis !== null && kondisiKemasan !== null;

  function ambilLokasiLaluKirim() {
    setStep("submitting");
    setErrorMsg("");

    const kirim = (lat: number | null, lng: number | null) => {
      fetch("/api/anak/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nisNisn: nisNisn.trim(),
          penilaian,
          alasanSuka,
          alasanKurangSuka,
          alasanKurangSukaLainnya: alasanKurangSukaLainnya.trim() || undefined,
          kondisiHabis,
          alasanTidakHabis,
          alasanTidakHabisLainnya: alasanTidakHabisLainnya.trim() || undefined,
          kondisiKemasan,
          perbaikanDiinginkan,
          catatanPerbaikan: catatanPerbaikan.trim() || undefined,
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
    setPenilaian(null);
    setAlasanSuka([]);
    setAlasanKurangSuka([]);
    setAlasanKurangSukaLainnya("");
    setKondisiHabis(null);
    setAlasanTidakHabis([]);
    setAlasanTidakHabisLainnya("");
    setKondisiKemasan(null);
    setPerbaikanDiinginkan([]);
    setCatatanPerbaikan("");
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
        <p className="text-sm text-neutral-500">{INTRO_SUARA_ANAK}</p>
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
        <div className="text-sm font-medium">{PERTANYAAN_PENILAIAN}</div>
        <TombolEmoji opsi={OPSI_PENILAIAN} value={penilaian} onChange={setPenilaian} />
      </div>

      {tampilkanAlasanSuka(penilaian) && (
        <div className="space-y-2">
          <div className="text-sm font-medium">{PERTANYAAN_ALASAN_SUKA}</div>
          <MultiSelectChips
            opsi={OPSI_ALASAN_SUKA}
            value={alasanSuka}
            onToggle={(v) => toggle(alasanSuka, setAlasanSuka, v)}
          />
        </div>
      )}

      {tampilkanAlasanKurangSuka(penilaian) && (
        <div className="space-y-2">
          <div className="text-sm font-medium">{PERTANYAAN_ALASAN_KURANG_SUKA}</div>
          <MultiSelectChips
            opsi={OPSI_ALASAN_KURANG_SUKA}
            value={alasanKurangSuka}
            onToggle={(v) => toggle(alasanKurangSuka, setAlasanKurangSuka, v)}
            teksLainnya={alasanKurangSukaLainnya}
            onTeksLainnyaChange={setAlasanKurangSukaLainnya}
          />
        </div>
      )}

      <div className="space-y-2">
        <div className="text-sm font-medium">{PERTANYAAN_KONDISI_HABIS}</div>
        <TombolEmoji opsi={OPSI_KONDISI_HABIS} value={kondisiHabis} onChange={setKondisiHabis} />
      </div>

      {tampilkanAlasanTidakHabis(kondisiHabis) && (
        <div className="space-y-2">
          <div className="text-sm font-medium">{PERTANYAAN_ALASAN_TIDAK_HABIS}</div>
          <MultiSelectChips
            opsi={OPSI_ALASAN_TIDAK_HABIS}
            value={alasanTidakHabis}
            onToggle={(v) => toggle(alasanTidakHabis, setAlasanTidakHabis, v)}
            teksLainnya={alasanTidakHabisLainnya}
            onTeksLainnyaChange={setAlasanTidakHabisLainnya}
          />
        </div>
      )}

      <div className="space-y-2">
        <div className="text-sm font-medium">{PERTANYAAN_KONDISI_KEMASAN}</div>
        <TombolEmoji opsi={OPSI_KONDISI_KEMASAN} value={kondisiKemasan} onChange={setKondisiKemasan} />
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">{PERTANYAAN_PERBAIKAN}</div>
        <MultiSelectChips
          opsi={OPSI_PERBAIKAN}
          value={perbaikanDiinginkan}
          onToggle={(v) => toggle(perbaikanDiinginkan, setPerbaikanDiinginkan, v)}
          teksLainnya={catatanPerbaikan}
          onTeksLainnyaChange={setCatatanPerbaikan}
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
