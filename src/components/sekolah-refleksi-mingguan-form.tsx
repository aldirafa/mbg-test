"use client";

import { useEffect, useState } from "react";
import { SegmentedRadioGroup } from "@/components/ui/radio-group";
import { badgeClassForStatus } from "@/components/ui/expandable";
import {
  KENDALA_ITEMS,
  OPSI_JAWABAN_KENDALA,
  PERSEPSI_ITEMS,
  OPSI_JAWABAN_PERSEPSI,
  formatPeriode,
  type JawabanKendala,
  type JawabanKendalaData,
  type JawabanPersepsi,
  type JawabanPersepsiData,
} from "@/lib/refleksi-mingguan";

// Survei refleksi mingguan sekolah (feedback tim Prof Elly, 20 Sep) -- 2 bagian:
// kendala pelaksanaan MBG (3-pilihan/item) & persepsi sekolah (skala 5/item). WAJIB
// diisi tiap minggu (upsert per periodeMulai, lihat src/lib/refleksi-mingguan.ts &
// API /api/sekolah/refleksi-mingguan). Ditampilkan sbg status "sudah/belum isi minggu
// ini" -- kalau sudah, tetap bisa dibuka & diubah selama masih minggu yang sama.

type RefleksiData = {
  kendalaJawaban: JawabanKendalaData;
  kendalaLainnyaTeks: string | null;
  persepsiJawaban: JawabanPersepsiData;
} | null;

export function SekolahRefleksiMingguanForm() {
  const [loading, setLoading] = useState(true);
  const [periodeMulai, setPeriodeMulai] = useState<string | null>(null);
  const [tersimpan, setTersimpan] = useState<RefleksiData>(null);
  const [terbuka, setTerbuka] = useState(false);

  const [kendala, setKendala] = useState<JawabanKendalaData>({});
  const [kendalaLainnyaTeks, setKendalaLainnyaTeks] = useState("");
  const [persepsi, setPersepsi] = useState<JawabanPersepsiData>({});
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [sukses, setSukses] = useState(false);

  function load() {
    return fetch("/api/sekolah/refleksi-mingguan")
      .then((r) => r.json())
      .then((d: { periodeMulai: string; refleksi: RefleksiData }) => {
        setPeriodeMulai(d.periodeMulai);
        setTersimpan(d.refleksi);
        if (d.refleksi) {
          setKendala(d.refleksi.kendalaJawaban);
          setKendalaLainnyaTeks(d.refleksi.kendalaLainnyaTeks ?? "");
          setPersepsi(d.refleksi.persepsiJawaban);
        }
      });
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const bisaKirim =
    KENDALA_ITEMS.every((item) => kendala[item.id] != null) &&
    PERSEPSI_ITEMS.every((item) => persepsi[item.id] != null);

  async function submit() {
    setBusy(true);
    setErrorMsg("");
    setSukses(false);
    const res = await fetch("/api/sekolah/refleksi-mingguan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kendalaJawaban: kendala,
        kendalaLainnyaTeks: kendalaLainnyaTeks.trim() || undefined,
        persepsiJawaban: persepsi,
      }),
    });
    setBusy(false);
    if (res.ok) {
      setSukses(true);
      await load();
    } else {
      const data = await res.json().catch(() => ({}));
      setErrorMsg(data.error || "Gagal mengirim, coba lagi.");
    }
  }

  if (loading) {
    return (
      <div className="border border-neutral-200 rounded-lg p-4">
        <p className="text-sm text-neutral-500">Memuat refleksi mingguan...</p>
      </div>
    );
  }

  const sudahIsi = tersimpan != null;

  return (
    <div className="border border-neutral-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-sm">Refleksi Mingguan</p>
          {periodeMulai && (
            <p className="text-xs text-neutral-500">Periode {formatPeriode(new Date(periodeMulai))}</p>
          )}
        </div>
        <span className={badgeClassForStatus(sudahIsi ? "hijau" : "kuning")}>
          {sudahIsi ? "Sudah diisi" : "Belum diisi"}
        </span>
      </div>

      {!terbuka && (
        <button
          onClick={() => setTerbuka(true)}
          className="cursor-pointer text-xs text-neutral-500 underline"
        >
          {sudahIsi ? "Lihat / ubah jawaban" : "Isi sekarang"}
        </button>
      )}

      {terbuka && (
        <div className="space-y-5 pt-1">
          <div className="space-y-3">
            <p className="text-sm font-medium">
              Kendala selama seminggu berjalan mengenai kendala pelaksanaan MBG
            </p>
            {KENDALA_ITEMS.map((item, i) => (
              <div key={item.id} className="space-y-1.5">
                <p className="text-xs text-neutral-600">
                  {i + 1}. {item.pertanyaan}
                </p>
                <SegmentedRadioGroup<JawabanKendala>
                  value={kendala[item.id] ?? ("" as JawabanKendala)}
                  onChange={(v) => setKendala((prev) => ({ ...prev, [item.id]: v }))}
                  options={OPSI_JAWABAN_KENDALA}
                />
                {item.punyaTeksLainnya && kendala[item.id] && kendala[item.id] !== "tidak" && (
                  <input
                    value={kendalaLainnyaTeks}
                    onChange={(e) => setKendalaLainnyaTeks(e.target.value)}
                    placeholder="Sebutkan..."
                    className="w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Persepsi sekolah berjalannya MBG</p>
            {PERSEPSI_ITEMS.map((item, i) => (
              <div key={item.id} className="space-y-1.5">
                <p className="text-xs text-neutral-600">
                  {i + 1}. {item.pertanyaan}
                </p>
                <SegmentedRadioGroup<string>
                  value={persepsi[item.id] != null ? String(persepsi[item.id]) : ""}
                  onChange={(v) =>
                    setPersepsi((prev) => ({ ...prev, [item.id]: Number(v) as JawabanPersepsi }))
                  }
                  options={OPSI_JAWABAN_PERSEPSI.map((o) => ({ value: String(o.value), label: o.label }))}
                />
              </div>
            ))}
          </div>

          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
          {sukses && <p className="text-sm text-green-700">Refleksi minggu ini tersimpan. Makasih!</p>}

          <div className="flex gap-2">
            <button
              onClick={() => setTerbuka(false)}
              className="cursor-pointer flex-1 rounded-md border border-neutral-300 text-sm py-2"
            >
              Tutup
            </button>
            <button
              disabled={!bisaKirim || busy}
              onClick={submit}
              className="cursor-pointer flex-1 rounded-md bg-neutral-900 text-white text-sm font-medium py-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? "Mengirim..." : sudahIsi ? "Simpan Perubahan" : "Kirim"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
