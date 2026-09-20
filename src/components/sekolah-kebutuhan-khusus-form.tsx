"use client";

import { useEffect, useState } from "react";
import { Select, type SelectOption } from "@/components/ui/select";
import { Expandable } from "@/components/ui/expandable";
import { KATEGORI_DISABILITAS, KATEGORI_ALERGI, type DataKebutuhanKhusus } from "@/lib/kebutuhan-khusus";
import { IMPLIKASI_DISABILITAS } from "@/lib/kebutuhan-khusus-implikasi";
import { PANDUAN_ALERGI, CATATAN_PANDUAN_KHUSUS } from "@/lib/kebutuhan-khusus-panduan";

type Jenjang = "SD" | "SMP" | "SMA";

const JENJANG_OPSI: SelectOption<Jenjang>[] = [
  { value: "SD", label: "SD" },
  { value: "SMP", label: "SMP" },
  { value: "SMA", label: "SMA" },
];

type EntriDraft = { jumlah: string; catatan: string };
type DraftMap = Record<string, EntriDraft>;

function kosongkanDraft(kategori: { kode: string }[], data: DataKebutuhanKhusus): DraftMap {
  const draft: DraftMap = {};
  for (const k of kategori) {
    const entri = data[k.kode];
    draft[k.kode] = { jumlah: entri?.jumlah ? String(entri.jumlah) : "", catatan: entri?.catatan ?? "" };
  }
  return draft;
}

function draftKeData(draft: DraftMap): DataKebutuhanKhusus {
  const out: DataKebutuhanKhusus = {};
  for (const [kode, entri] of Object.entries(draft)) {
    const jumlah = Number(entri.jumlah) || 0;
    if (jumlah <= 0 && !entri.catatan.trim()) continue;
    out[kode] = { jumlah, catatan: entri.catatan.trim() || undefined };
  }
  return out;
}

function BarisEntri({
  label,
  deskripsi,
  entri,
  onChange,
}: {
  label: string;
  deskripsi?: string;
  entri: EntriDraft;
  onChange: (next: EntriDraft) => void;
}) {
  return (
    <div className="border border-neutral-100 rounded-md p-2.5">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-neutral-800">{label}</p>
          {deskripsi && <p className="text-xs text-neutral-400">{deskripsi}</p>}
        </div>
        <input
          type="number"
          min={0}
          value={entri.jumlah}
          onChange={(e) => onChange({ ...entri, jumlah: e.target.value })}
          placeholder="0"
          className="w-20 rounded-md border border-neutral-300 px-2 py-1.5 text-sm text-right"
        />
        <span className="text-xs text-neutral-400 w-10">siswa</span>
      </div>
      {Number(entri.jumlah) > 0 && (
        <input
          type="text"
          value={entri.catatan}
          onChange={(e) => onChange({ ...entri, catatan: e.target.value })}
          placeholder="Catatan tambahan (opsional)"
          className="mt-2 w-full rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs"
        />
      )}
    </div>
  );
}

// Form data disabilitas & alergi/pantangan siswa, diisi sekolah -- dipakai SPPG buat
// nyiapin porsi khusus (lihat panel ringkasan di dashboard SPPG). Digabung dgn jenjang
// krn keduanya sama-sama "profil sekolah" & jenjang nentuin ambang evaluasi gizi BGN.
export function SekolahKebutuhanKhususForm() {
  const [loading, setLoading] = useState(true);
  const [jenjang, setJenjang] = useState<Jenjang>("SMA");
  const [disabilitas, setDisabilitas] = useState<DraftMap>(() => kosongkanDraft(KATEGORI_DISABILITAS, {}));
  const [alergi, setAlergi] = useState<DraftMap>(() => kosongkanDraft(KATEGORI_ALERGI, {}));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sekolah/kebutuhan-khusus")
      .then((r) => r.json())
      .then((d) => {
        setJenjang(d.jenjang ?? "SMA");
        setDisabilitas(kosongkanDraft(KATEGORI_DISABILITAS, d.disabilitasData ?? {}));
        setAlergi(kosongkanDraft(KATEGORI_ALERGI, d.alergiData ?? {}));
      })
      .finally(() => setLoading(false));
  }, []);

  async function simpan() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const res = await fetch("/api/sekolah/kebutuhan-khusus", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jenjang,
        disabilitasData: draftKeData(disabilitas),
        alergiData: draftKeData(alergi),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Gagal menyimpan data");
      setSaving(false);
      return;
    }
    setSaved(true);
    setSaving(false);
  }

  if (loading) {
    return <p className="text-sm text-neutral-500">Memuat data kebutuhan khusus...</p>;
  }

  return (
    <div className="border border-neutral-200 rounded-lg p-4 space-y-4 text-sm">
      <div>
        <h2 className="font-medium text-sm">Jenjang & Kebutuhan Khusus Siswa</h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Dipakai SPPG buat nyiapin porsi khusus & menghitung standar gizi yang sesuai.
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Jenjang pendidikan</label>
        <Select value={jenjang} onChange={setJenjang} options={JENJANG_OPSI} className="max-w-40" />
      </div>

      <Expandable summary="Data disabilitas (kategori A-E)" defaultOpen>
        <div className="space-y-2">
          {KATEGORI_DISABILITAS.map((k) => (
            <BarisEntri
              key={k.kode}
              label={`${k.kode} · ${k.label}`}
              deskripsi={k.deskripsi}
              entri={disabilitas[k.kode]}
              onChange={(next) => setDisabilitas((d) => ({ ...d, [k.kode]: next }))}
            />
          ))}
        </div>
      </Expandable>

      <Expandable summary="Data alergi / pantangan makanan">
        <div className="space-y-2">
          {KATEGORI_ALERGI.map((k) => (
            <BarisEntri
              key={k.kode}
              label={k.label}
              entri={alergi[k.kode]}
              onChange={(next) => setAlergi((a) => ({ ...a, [k.kode]: next }))}
            />
          ))}
        </div>
      </Expandable>

      {(() => {
        const disabilitasAda = KATEGORI_DISABILITAS.filter((k) => Number(disabilitas[k.kode]?.jumlah) > 0);
        const alergiAda = KATEGORI_ALERGI.filter((k) => Number(alergi[k.kode]?.jumlah) > 0);
        if (disabilitasAda.length === 0 && alergiAda.length === 0) return null;
        return (
          <div className="space-y-3 border-t border-neutral-100 pt-3">
            <p className="text-xs font-medium text-neutral-600">
              Panduan penyajian &amp; komposisi (berdasarkan data di atas)
            </p>
            {disabilitasAda.length > 0 && (
              <div className="space-y-2">
                {disabilitasAda.map((k) => {
                  const panduan = IMPLIKASI_DISABILITAS.find((p) => p.kode === k.kode);
                  if (!panduan) return null;
                  return (
                    <Expandable key={k.kode} summary={`${k.kode} · ${k.label}`}>
                      <div className="text-xs text-neutral-600 pl-4.5 space-y-1">
                        <p>
                          <span className="font-medium text-neutral-700">Perhatian mikronutrien &amp; komposisi: </span>
                          {panduan.perhatianMikronutrien}
                        </p>
                        <p>
                          <span className="font-medium text-neutral-700">Implikasi penyajian: </span>
                          {panduan.implikasiPenyajian}
                        </p>
                      </div>
                    </Expandable>
                  );
                })}
              </div>
            )}
            {alergiAda.length > 0 && (
              <div className="space-y-2">
                {alergiAda.map((k) => {
                  const panduan = PANDUAN_ALERGI.find((p) => p.kode === k.kode);
                  if (!panduan) return null;
                  return (
                    <Expandable key={k.kode} summary={k.label}>
                      <div className="text-xs text-neutral-600 pl-4.5 space-y-1">
                        <p>
                          <span className="font-medium text-neutral-700">Perhatian komposisi makanan: </span>
                          {panduan.perhatianKomposisi}
                        </p>
                        <p>
                          <span className="font-medium text-neutral-700">Pengganti: </span>
                          {panduan.pengganti}
                        </p>
                      </div>
                    </Expandable>
                  );
                })}
              </div>
            )}
            <p className="text-[11px] text-neutral-400 italic">{CATATAN_PANDUAN_KHUSUS}</p>
          </div>
        );
      })()}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        onClick={simpan}
        disabled={saving}
        className="cursor-pointer rounded-md bg-neutral-900 text-white text-sm font-medium py-2 px-4 disabled:opacity-60"
      >
        {saving ? "Menyimpan..." : "Simpan"}
      </button>
      {saved && <span className="ml-3 text-xs text-green-700">Tersimpan.</span>}
    </div>
  );
}
