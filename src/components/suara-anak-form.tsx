"use client";

import { useState, type ReactNode } from "react";
import {
  Body1,
  Button,
  Caption1,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  ProgressBar,
  Spinner,
  Subtitle2,
  Title2,
  ToggleButton,
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components";
import { ArrowRepeatAllRegular, CheckmarkRegular, PersonRegular, SendRegular } from "@fluentui/react-icons";
import { PublicShell } from "@/components/public-shell";
import { SectionCard } from "@/components/ui/section-card";
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

const useStyles = makeStyles({
  emojiBtn: {
    flex: "1 1 0",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: tokens.spacingVerticalXS,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalXS}`,
    borderRadius: tokens.borderRadiusXLarge,
    border: `2px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    cursor: "pointer",
    transitionProperty: "transform, border-color, background-color, box-shadow",
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveDecelerateMid,
    ":hover": { backgroundColor: tokens.colorNeutralBackground1Hover, transform: "translateY(-1px)" },
    ":active": { transform: "scale(0.97)" },
    ":focus-visible": { outline: `2px solid ${tokens.colorStrokeFocus2}`, outlineOffset: "2px" },
    "@media (prefers-reduced-motion: reduce)": { transitionDuration: "0.01ms" },
  },
  emojiBtnOn: {
    borderTopColor: tokens.colorBrandStroke1,
    borderRightColor: tokens.colorBrandStroke1,
    borderBottomColor: tokens.colorBrandStroke1,
    borderLeftColor: tokens.colorBrandStroke1,
    backgroundColor: tokens.colorBrandBackground2,
    boxShadow: tokens.shadow8,
    transform: "scale(1.03)",
    ":hover": { backgroundColor: tokens.colorBrandBackground2Hover, transform: "scale(1.03)" },
  },
  emoji: { fontSize: "32px", lineHeight: 1 },
});

function Pertanyaan({ judul, children }: { judul: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 mbg-rise">
      <Subtitle2>{judul}</Subtitle2>
      {children}
    </div>
  );
}

// Tombol besar emoji buat pilihan 3-way (penilaian / kondisi habis / kondisi kemasan).
function TombolEmoji<T extends string>({
  opsi,
  value,
  onChange,
  label,
}: {
  opsi: OpsiSuaraAnak[];
  value: T | null;
  onChange: (v: T) => void;
  label: string;
}) {
  const s = useStyles();
  return (
    <div className="flex gap-2 sm:gap-3" role="radiogroup" aria-label={label}>
      {opsi.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value as T)}
            className={mergeClasses(s.emojiBtn, on && s.emojiBtnOn)}
          >
            <span className={s.emoji} aria-hidden>
              {o.label.split(" ")[0]}
            </span>
            <Caption1 className="text-center font-semibold leading-tight">
              {o.label.split(" ").slice(1).join(" ")}
            </Caption1>
          </button>
        );
      })}
    </div>
  );
}

// Chip multi-select, dipakai buat semua pertanyaan follow-up "bisa pilih lebih dari
// satu" -- opsi dgn butuhTeksLainnya nampilin input teks tambahan pas dipilih.
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
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {opsi.map((o) => {
          const on = value.includes(o.value);
          return (
            <ToggleButton
              key={o.value}
              shape="circular"
              checked={on}
              appearance={on ? "primary" : "secondary"}
              icon={on ? <CheckmarkRegular /> : undefined}
              onClick={() => onToggle(o.value)}
            >
              {o.label}
            </ToggleButton>
          );
        })}
      </div>
      {lainnyaDipilih && onTeksLainnyaChange && (
        <Input
          value={teksLainnya ?? ""}
          onChange={(_, d) => onTeksLainnyaChange(d.value)}
          placeholder="Sebutkan..."
          aria-label="Sebutkan lainnya"
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

  const terjawab = [nisNisn.trim().length > 0, penilaian !== null, kondisiHabis !== null, kondisiKemasan !== null].filter(
    Boolean,
  ).length;

  if (step === "sukses") {
    return (
      <PublicShell title="Suara Anak MBG" maxWidth="max-w-2xl">
        <SectionCard>
          <div className="flex flex-col items-center gap-3 py-6 text-center mbg-rise">
            <div className="text-6xl" aria-hidden>
              🎉
            </div>
            <Title2 as="h2">Makasih udah cerita!</Title2>
            <Body1 className="text-fg3">Jawaban kamu udah terkirim.</Body1>
            <Button appearance="primary" size="large" icon={<ArrowRepeatAllRegular />} onClick={resetForm}>
              Isi lagi (buat teman lain)
            </Button>
          </div>
        </SectionCard>
      </PublicShell>
    );
  }

  return (
    <PublicShell title="Suara Anak MBG 🍽️" subtitle="Ceritain pendapatmu soal makan hari ini" maxWidth="max-w-2xl">
      <SectionCard>
        <Body1 className="text-fg2">{INTRO_SUARA_ANAK}</Body1>
        <div className="sticky top-0 z-[1] -mx-1 flex flex-col gap-1 bg-bg1 px-1 py-2">
          <div className="flex justify-between">
            <Caption1 className="text-fg3">Pertanyaan wajib</Caption1>
            <Caption1 className="tabular-nums text-fg3">{terjawab}/4</Caption1>
          </div>
          <ProgressBar value={terjawab / 4} thickness="large" color={terjawab === 4 ? "success" : "brand"} />
        </div>
      </SectionCard>

      <SectionCard>
        <div className="flex flex-col gap-7">
          <Field label={<Subtitle2>NIS / NISN kamu</Subtitle2>} required>
            <Input
              size="large"
              inputMode="numeric"
              value={nisNisn}
              onChange={(_, d) => setNisNisn(d.value)}
              placeholder="Contoh: 1234567890"
              contentBefore={<PersonRegular />}
            />
          </Field>

          <Pertanyaan judul={PERTANYAAN_PENILAIAN}>
            <TombolEmoji opsi={OPSI_PENILAIAN} value={penilaian} onChange={setPenilaian} label={PERTANYAAN_PENILAIAN} />
          </Pertanyaan>

          {tampilkanAlasanSuka(penilaian) && (
            <Pertanyaan judul={PERTANYAAN_ALASAN_SUKA}>
              <MultiSelectChips
                opsi={OPSI_ALASAN_SUKA}
                value={alasanSuka}
                onToggle={(v) => toggle(alasanSuka, setAlasanSuka, v)}
              />
            </Pertanyaan>
          )}

          {tampilkanAlasanKurangSuka(penilaian) && (
            <Pertanyaan judul={PERTANYAAN_ALASAN_KURANG_SUKA}>
              <MultiSelectChips
                opsi={OPSI_ALASAN_KURANG_SUKA}
                value={alasanKurangSuka}
                onToggle={(v) => toggle(alasanKurangSuka, setAlasanKurangSuka, v)}
                teksLainnya={alasanKurangSukaLainnya}
                onTeksLainnyaChange={setAlasanKurangSukaLainnya}
              />
            </Pertanyaan>
          )}

          <Pertanyaan judul={PERTANYAAN_KONDISI_HABIS}>
            <TombolEmoji
              opsi={OPSI_KONDISI_HABIS}
              value={kondisiHabis}
              onChange={setKondisiHabis}
              label={PERTANYAAN_KONDISI_HABIS}
            />
          </Pertanyaan>

          {tampilkanAlasanTidakHabis(kondisiHabis) && (
            <Pertanyaan judul={PERTANYAAN_ALASAN_TIDAK_HABIS}>
              <MultiSelectChips
                opsi={OPSI_ALASAN_TIDAK_HABIS}
                value={alasanTidakHabis}
                onToggle={(v) => toggle(alasanTidakHabis, setAlasanTidakHabis, v)}
                teksLainnya={alasanTidakHabisLainnya}
                onTeksLainnyaChange={setAlasanTidakHabisLainnya}
              />
            </Pertanyaan>
          )}

          <Pertanyaan judul={PERTANYAAN_KONDISI_KEMASAN}>
            <TombolEmoji
              opsi={OPSI_KONDISI_KEMASAN}
              value={kondisiKemasan}
              onChange={setKondisiKemasan}
              label={PERTANYAAN_KONDISI_KEMASAN}
            />
          </Pertanyaan>

          <Pertanyaan judul={PERTANYAAN_PERBAIKAN}>
            <MultiSelectChips
              opsi={OPSI_PERBAIKAN}
              value={perbaikanDiinginkan}
              onToggle={(v) => toggle(perbaikanDiinginkan, setPerbaikanDiinginkan, v)}
              teksLainnya={catatanPerbaikan}
              onTeksLainnyaChange={setCatatanPerbaikan}
            />
          </Pertanyaan>

          {errorMsg && (
            <MessageBar layout="multiline" intent="error">
              <MessageBarBody>{errorMsg}</MessageBarBody>
            </MessageBar>
          )}

          <Button
            appearance="primary"
            size="large"
            disabled={!bisaKirim || step === "submitting"}
            onClick={ambilLokasiLaluKirim}
            icon={step === "submitting" ? <Spinner size="tiny" /> : <SendRegular />}
          >
            {step === "submitting" ? "Mengirim..." : "Kirim"}
          </Button>
          {!bisaKirim && (
            <Caption1 className="-mt-5 text-center text-fg3">
              Isi NIS/NISN dan jawab 3 pertanyaan bergambar dulu ya.
            </Caption1>
          )}
        </div>
      </SectionCard>
    </PublicShell>
  );
}
