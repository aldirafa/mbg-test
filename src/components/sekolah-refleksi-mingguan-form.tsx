"use client";

import { useEffect, useState } from "react";
import {
  Body1,
  Button,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Skeleton,
  SkeletonItem,
  Spinner,
  Subtitle2,
} from "@fluentui/react-components";
import { CalendarWeekNumbersRegular, DismissRegular, EditRegular, SendRegular } from "@fluentui/react-icons";
import { SegmentedRadioGroup } from "@/components/ui/radio-group";
import { TrafficBadge } from "@/components/ui/expandable";
import { SectionCard } from "@/components/ui/section-card";
import { useAppToast } from "@/components/ui/toast";
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
  const toast = useAppToast();

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
      toast("Refleksi minggu ini tersimpan", { body: "Makasih!" });
      await load();
    } else {
      const data = await res.json().catch(() => ({}));
      setErrorMsg(data.error || "Gagal mengirim, coba lagi.");
    }
  }

  if (loading) {
    return (
      <SectionCard title="Refleksi Mingguan" icon={<CalendarWeekNumbersRegular />}>
        <Skeleton aria-label="Memuat refleksi mingguan">
          <SkeletonItem size={24} />
        </Skeleton>
      </SectionCard>
    );
  }

  const sudahIsi = tersimpan != null;

  return (
    <SectionCard
      title="Refleksi Mingguan"
      icon={<CalendarWeekNumbersRegular />}
      description={periodeMulai ? `Periode ${formatPeriode(new Date(periodeMulai))}` : undefined}
      action={<TrafficBadge status={sudahIsi ? "hijau" : "kuning"}>{sudahIsi ? "Sudah diisi" : "Belum diisi"}</TrafficBadge>}
    >
      {!terbuka && (
        <div>
          <Button appearance={sudahIsi ? "secondary" : "primary"} icon={<EditRegular />} onClick={() => setTerbuka(true)}>
            {sudahIsi ? "Lihat / ubah jawaban" : "Isi sekarang"}
          </Button>
        </div>
      )}

      {terbuka && (
        <div className="flex flex-col gap-6 mbg-rise">
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-2">
              <Subtitle2>Kendala selama seminggu berjalan mengenai pelaksanaan MBG</Subtitle2>
            </legend>
            {KENDALA_ITEMS.map((item, i) => (
              <div key={item.id} className="flex flex-col gap-2 rounded-fluent-m border border-stroke2 p-3">
                <Body1>
                  {i + 1}. {item.pertanyaan}
                </Body1>
                <SegmentedRadioGroup<JawabanKendala>
                  value={kendala[item.id] ?? ("" as JawabanKendala)}
                  onChange={(v) => setKendala((prev) => ({ ...prev, [item.id]: v }))}
                  options={OPSI_JAWABAN_KENDALA}
                />
                {item.punyaTeksLainnya && kendala[item.id] && kendala[item.id] !== "tidak" && (
                  <Field label="Sebutkan">
                    <Input value={kendalaLainnyaTeks} onChange={(_, d) => setKendalaLainnyaTeks(d.value)} placeholder="Sebutkan..." />
                  </Field>
                )}
              </div>
            ))}
          </fieldset>

          <fieldset className="flex flex-col gap-4">
            <legend className="mb-2">
              <Subtitle2>Persepsi sekolah terhadap berjalannya MBG</Subtitle2>
            </legend>
            {PERSEPSI_ITEMS.map((item, i) => (
              <div key={item.id} className="flex flex-col gap-2 rounded-fluent-m border border-stroke2 p-3">
                <Body1>
                  {i + 1}. {item.pertanyaan}
                </Body1>
                <SegmentedRadioGroup<string>
                  value={persepsi[item.id] != null ? String(persepsi[item.id]) : ""}
                  onChange={(v) => setPersepsi((prev) => ({ ...prev, [item.id]: Number(v) as JawabanPersepsi }))}
                  options={OPSI_JAWABAN_PERSEPSI.map((o) => ({ value: String(o.value), label: o.label }))}
                />
              </div>
            ))}
          </fieldset>

          {errorMsg && (
            <MessageBar layout="multiline" intent="error">
              <MessageBarBody>{errorMsg}</MessageBarBody>
            </MessageBar>
          )}
          {sukses && (
            <MessageBar layout="multiline" intent="success">
              <MessageBarBody>Refleksi minggu ini tersimpan. Makasih!</MessageBarBody>
            </MessageBar>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button icon={<DismissRegular />} onClick={() => setTerbuka(false)}>
              Tutup
            </Button>
            <Button
              appearance="primary"
              disabled={!bisaKirim || busy}
              onClick={submit}
              icon={busy ? <Spinner size="tiny" /> : <SendRegular />}
            >
              {busy ? "Mengirim..." : sudahIsi ? "Simpan Perubahan" : "Kirim"}
            </Button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
