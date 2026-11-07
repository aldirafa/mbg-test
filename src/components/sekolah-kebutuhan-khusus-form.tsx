"use client";

import { useEffect, useState } from "react";
import {
  Body1,
  Button,
  Caption1,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Skeleton,
  SkeletonItem,
  Spinner,
  SpinButton,
  Text,
} from "@fluentui/react-components";
import { AccessibilityRegular, CheckmarkCircleRegular, InfoRegular, SaveRegular } from "@fluentui/react-icons";
import { Select, type SelectOption } from "@/components/ui/select";
import { SectionCard } from "@/components/ui/section-card";
import { useAppToast } from "@/components/ui/toast";
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
    <div className="flex flex-col gap-2 rounded-fluent-m border border-stroke2 p-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <Text weight="semibold" className="block!">
            {label}
          </Text>
          {deskripsi && <Caption1 className="text-fg3">{deskripsi}</Caption1>}
        </div>
        <SpinButton
          aria-label={`Jumlah siswa ${label}`}
          min={0}
          value={entri.jumlah === "" ? null : Number(entri.jumlah)}
          displayValue={entri.jumlah}
          onChange={(_, d) => {
            const v = d.value ?? (d.displayValue != null ? Number(d.displayValue) : NaN);
            onChange({ ...entri, jumlah: Number.isFinite(v) && v > 0 ? String(v) : "" });
          }}
          placeholder="0"
          style={{ width: 96 }}
        />
        <Caption1 className="w-10 text-fg3">siswa</Caption1>
      </div>
      {Number(entri.jumlah) > 0 && (
        <Input
          size="small"
          value={entri.catatan}
          onChange={(_, d) => onChange({ ...entri, catatan: d.value })}
          placeholder="Catatan tambahan (opsional)"
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
  const toast = useAppToast();

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
    toast("Data kebutuhan khusus tersimpan");
    setSaving(false);
  }

  if (loading) {
    return (
      <SectionCard title="Jenjang & Kebutuhan Khusus Siswa" icon={<AccessibilityRegular />}>
        <Skeleton aria-label="Memuat data kebutuhan khusus" className="flex flex-col gap-2">
          <SkeletonItem size={32} />
          <SkeletonItem size={48} />
          <SkeletonItem size={48} />
        </Skeleton>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Jenjang & Kebutuhan Khusus Siswa"
      icon={<AccessibilityRegular />}
      description="Dipakai SPPG buat nyiapin porsi khusus & menghitung standar gizi yang sesuai."
    >
      <Field label="Jenjang pendidikan" className="max-w-56">
        <Select value={jenjang} onChange={setJenjang} options={JENJANG_OPSI} aria-label="Jenjang pendidikan" />
      </Field>

      <Expandable summary="Data disabilitas (kategori A-E)" defaultOpen>
        <div className="flex flex-col gap-2">
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
        <div className="flex flex-col gap-2">
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
          <div className="flex flex-col gap-3 rounded-fluent-l bg-info-bg p-3">
            <Text weight="semibold" className="inline-flex items-center gap-1.5 text-info">
              <InfoRegular /> Panduan penyajian &amp; komposisi (berdasarkan data di atas)
            </Text>
            {disabilitasAda.length > 0 && (
              <div className="flex flex-col gap-2">
                {disabilitasAda.map((k) => {
                  const panduan = IMPLIKASI_DISABILITAS.find((p) => p.kode === k.kode);
                  if (!panduan) return null;
                  return (
                    <Expandable key={k.kode} summary={`${k.kode} · ${k.label}`}>
                      <div className="flex flex-col gap-1 text-fg2">
                        <Body1>
                          <span className="font-semibold">Perhatian mikronutrien &amp; komposisi: </span>
                          {panduan.perhatianMikronutrien}
                        </Body1>
                        <Body1>
                          <span className="font-semibold">Implikasi penyajian: </span>
                          {panduan.implikasiPenyajian}
                        </Body1>
                      </div>
                    </Expandable>
                  );
                })}
              </div>
            )}
            {alergiAda.length > 0 && (
              <div className="flex flex-col gap-2">
                {alergiAda.map((k) => {
                  const panduan = PANDUAN_ALERGI.find((p) => p.kode === k.kode);
                  if (!panduan) return null;
                  return (
                    <Expandable key={k.kode} summary={k.label}>
                      <div className="flex flex-col gap-1 text-fg2">
                        <Body1>
                          <span className="font-semibold">Perhatian komposisi makanan: </span>
                          {panduan.perhatianKomposisi}
                        </Body1>
                        <Body1>
                          <span className="font-semibold">Pengganti: </span>
                          {panduan.pengganti}
                        </Body1>
                      </div>
                    </Expandable>
                  );
                })}
              </div>
            )}
            <Caption1 className="italic text-fg3">{CATATAN_PANDUAN_KHUSUS}</Caption1>
          </div>
        );
      })()}

      {error && (
        <MessageBar layout="multiline" intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      <div className="flex items-center gap-3">
        <Button
          appearance="primary"
          onClick={simpan}
          disabled={saving}
          icon={saving ? <Spinner size="tiny" /> : <SaveRegular />}
        >
          {saving ? "Menyimpan..." : "Simpan"}
        </Button>
        {saved && (
          <Caption1 className="inline-flex items-center gap-1 text-success">
            <CheckmarkCircleRegular /> Tersimpan
          </Caption1>
        )}
      </div>
    </SectionCard>
  );
}
