"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Body1,
  Button,
  Caption1,
  Divider,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  ProgressBar,
  Radio,
  RadioGroup,
  Skeleton,
  SkeletonItem,
  Spinner,
  Subtitle2,
  Text,
  Textarea,
} from "@fluentui/react-components";
import {
  CheckmarkCircleFilled,
  CircleRegular,
  DocumentSignatureRegular,
  PhoneRegular,
  SendRegular,
} from "@fluentui/react-icons";
import { DashboardShell } from "@/components/dashboard-shell";
import { LabeledCheckbox } from "@/components/ui/checkbox";
import { SectionCard } from "@/components/ui/section-card";

// Formulir persetujuan orang tua (feedback tim Prof Elly, 20 Sep, dari screenshot
// "FORMULIR PERSETUJUAN PROGRAM MAKAN BERGIZI GRATIS") -- gate SEBELUM orang tua bisa
// pakai fitur harian aplikasi (menu, konfirmasi terima, rating, pengaduan). Per ANAK
// (keputusan eksplisit user): dashboard diblokir sampai SEMUA anak yang terhubung ke
// akun ini punya record PersetujuanOrangtua. Identitas siswa (Nama Siswa, Kelas) &
// data orang tua (Nama Orang Tua/Wali) ditampilkan read-only dari data yang udah ada
// (Siswa/Orangtua) -- form ini cuma nambahin: No. HP kontak program, kesediaan ikut
// program (+ alasan kalau tidak bersedia), info alergi versi orang tua, & konfirmasi
// tanda tangan digital (checkbox + nama diketik ulang -- lihat catatan di schema.prisma
// soal bagian "D. Tanda Tangan" yang gak kebaca lengkap dari screenshot aslinya).

type ChildPersetujuan = {
  siswa: { id: string; nama: string; kelas: string | null; namaSekolah: string };
  orangtua: { nama: string; noWa: string | null };
  persetujuan: unknown | null;
};

type Step = "loading" | "gate" | "submitting" | "error" | "done";

export function PersetujuanOrangtuaGate({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<Step>("loading");
  const [items, setItems] = useState<ChildPersetujuan[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  function load() {
    return fetch("/api/orangtua/persetujuan")
      .then((r) => r.json())
      .then((d: { children?: ChildPersetujuan[]; semuaSudahMengisi?: boolean }) => {
        setItems(d.children ?? []);
        setStep(d.semuaSudahMengisi ? "done" : "gate");
      })
      .catch(() => {
        setErrorMsg("Gagal memuat status persetujuan.");
        setStep("error");
      });
  }

  useEffect(() => {
    load();
  }, []);

  if (step === "loading") {
    return (
      <DashboardShell title="Portal Orang Tua">
        <SectionCard>
          <Skeleton aria-label="Memuat" className="flex flex-col gap-3">
            <SkeletonItem size={24} />
            <SkeletonItem size={64} />
            <SkeletonItem size={64} />
          </Skeleton>
        </SectionCard>
      </DashboardShell>
    );
  }

  if (step === "error") {
    return (
      <DashboardShell title="Portal Orang Tua">
        <MessageBar layout="multiline" intent="error">
          <MessageBarBody>{errorMsg}</MessageBarBody>
        </MessageBar>
      </DashboardShell>
    );
  }

  if (step === "done") {
    return <>{children}</>;
  }

  // step === "gate": ambil anak pertama yang belum punya persetujuan.
  const anakBerikutnya = items.find((it) => it.persetujuan == null);
  if (!anakBerikutnya) {
    // Semua kebetulan udah keisi (race dgn load ulang) -- lolos ke dashboard.
    return <>{children}</>;
  }

  const totalBelum = items.filter((it) => it.persetujuan == null).length;
  const totalAnak = items.length;

  return (
    <DashboardShell title="Portal Orang Tua" subtitle="Formulir Persetujuan Program Makan Bergizi Gratis">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        {totalAnak > 1 && (
          <SectionCard>
            <div className="flex flex-col gap-2">
              <Text weight="semibold">
                Anak {totalAnak - totalBelum + 1} dari {totalAnak}
              </Text>
              <ProgressBar value={(totalAnak - totalBelum) / totalAnak} thickness="large" />
              <Caption1 className="text-fg3">Isi formulir untuk tiap anak sebelum bisa mengakses dashboard.</Caption1>
            </div>
          </SectionCard>
        )}
        <SatuFormulirAnak key={anakBerikutnya.siswa.id} child={anakBerikutnya} onSelesai={() => load()} />
      </div>
    </DashboardShell>
  );
}

function Bagian({ huruf, judul, selesai, children }: { huruf: string; judul: string; selesai: boolean; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {selesai ? (
          <CheckmarkCircleFilled className="text-[20px] text-success" aria-label="Lengkap" />
        ) : (
          <CircleRegular className="text-[20px] text-fg4" aria-label="Belum lengkap" />
        )}
        <Subtitle2 as="h3">
          {huruf}. {judul}
        </Subtitle2>
      </div>
      <div className="flex flex-col gap-3 sm:pl-7">{children}</div>
    </section>
  );
}

function SatuFormulirAnak({ child, onSelesai }: { child: ChildPersetujuan; onSelesai: () => void }) {
  const [noHpOrangTua, setNoHpOrangTua] = useState(child.orangtua.noWa ?? "");
  const [bersedia, setBersedia] = useState<boolean | null>(null);
  const [alasanTidakBersedia, setAlasanTidakBersedia] = useState("");
  const [adaAlergi, setAdaAlergi] = useState<boolean | null>(null);
  const [jenisAlergi, setJenisAlergi] = useState("");
  const [setujuTandaTangan, setSetujuTandaTangan] = useState(false);
  const [namaTandaTangan, setNamaTandaTangan] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const bisaKirim =
    noHpOrangTua.trim().length > 0 &&
    bersedia !== null &&
    (bersedia || alasanTidakBersedia.trim().length > 0) &&
    adaAlergi !== null &&
    (!adaAlergi || jenisAlergi.trim().length > 0) &&
    setujuTandaTangan &&
    namaTandaTangan.trim().length > 0;

  async function submit() {
    setBusy(true);
    setErrorMsg("");
    const res = await fetch("/api/orangtua/persetujuan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siswaId: child.siswa.id,
        noHpOrangTua: noHpOrangTua.trim(),
        bersedia,
        alasanTidakBersedia: alasanTidakBersedia.trim() || undefined,
        adaAlergi,
        jenisAlergi: jenisAlergi.trim() || undefined,
        namaTandaTangan: namaTandaTangan.trim(),
      }),
    });
    setBusy(false);
    if (res.ok) {
      onSelesai();
    } else {
      const data = await res.json().catch(() => ({}));
      setErrorMsg(data.error || "Gagal mengirim formulir, coba lagi.");
    }
  }

  const bagianA = noHpOrangTua.trim().length > 0;
  const bagianB = bersedia !== null && (bersedia || alasanTidakBersedia.trim().length > 0);
  const bagianC = adaAlergi !== null && (!adaAlergi || jenisAlergi.trim().length > 0);
  const bagianD = setujuTandaTangan && namaTandaTangan.trim().length > 0;

  return (
    <SectionCard
      icon={<DocumentSignatureRegular />}
      title="Formulir Persetujuan Program Makan Bergizi Gratis"
      description="Mohon diisi sebelum bisa menggunakan fitur harian aplikasi untuk anak ini."
    >
      <div className="flex flex-col gap-6">
        {/* A. Identitas Siswa */}
        <Bagian huruf="A" judul="Identitas Siswa" selesai={bagianA}>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-fluent-m bg-bg2 p-3 sm:grid-cols-[auto_1fr]">
            {[
              ["Nama Siswa", child.siswa.nama],
              ["Kelas", child.siswa.kelas || "-"],
              ["Sekolah", child.siswa.namaSekolah],
              ["Nama Orang Tua/Wali", child.orangtua.nama],
            ].map(([k, v]) => (
              <div key={k} className="contents">
                <dt>
                  <Caption1 className="text-fg3">{k}</Caption1>
                </dt>
                <dd>
                  <Body1 className="font-semibold">{v}</Body1>
                </dd>
              </div>
            ))}
          </dl>
          <Field label="Nomor HP Orang Tua" required>
            <Input
              type="tel"
              inputMode="tel"
              value={noHpOrangTua}
              onChange={(_, d) => setNoHpOrangTua(d.value)}
              placeholder="08xxxxxxxxxx"
              contentBefore={<PhoneRegular />}
            />
          </Field>
        </Bagian>

        <Divider />

        {/* B. Kesediaan Mengikuti Program */}
        <Bagian huruf="B" judul="Kesediaan Mengikuti Program" selesai={bagianB}>
          <RadioGroup
            value={bersedia === null ? "" : bersedia ? "ya" : "tidak"}
            onChange={(_, d) => setBersedia(d.value === "ya")}
            aria-label="Kesediaan mengikuti program"
          >
            <Radio value="ya" label="Bersedia mengikutsertakan anak dalam Program Makan Bergizi Gratis" />
            <Radio value="tidak" label="Tidak bersedia" />
          </RadioGroup>
          {bersedia === false && (
            <Field label="Alasan tidak bersedia" required>
              <Textarea
                resize="vertical"
                value={alasanTidakBersedia}
                onChange={(_, d) => setAlasanTidakBersedia(d.value)}
                placeholder="Alasan tidak bersedia..."
              />
            </Field>
          )}
        </Bagian>

        <Divider />

        {/* C. Informasi Alergi Makanan */}
        <Bagian huruf="C" judul="Informasi Alergi Makanan" selesai={bagianC}>
          <RadioGroup
            value={adaAlergi === null ? "" : adaAlergi ? "ya" : "tidak"}
            onChange={(_, d) => setAdaAlergi(d.value === "ya")}
            aria-label="Informasi alergi makanan"
          >
            <Radio value="ya" label="Ya, ada alergi/pantangan makanan" />
            <Radio value="tidak" label="Tidak ada" />
          </RadioGroup>
          {adaAlergi === true && (
            <Field label="Jenis alergi/pantangan" required>
              <Textarea
                resize="vertical"
                value={jenisAlergi}
                onChange={(_, d) => setJenisAlergi(d.value)}
                placeholder="Sebutkan jenis alergi/pantangannya..."
              />
            </Field>
          )}
        </Bagian>

        <Divider />

        {/* D. Tanda Tangan Persetujuan */}
        <Bagian huruf="D" judul="Tanda Tangan Persetujuan" selesai={bagianD}>
          <LabeledCheckbox
            checked={setujuTandaTangan}
            onChange={setSetujuTandaTangan}
            label="Saya menyatakan data di atas benar dan menyetujui formulir ini sebagai pengganti tanda tangan basah."
          />
          <Field label="Nama Lengkap (sebagai tanda tangan digital)" required>
            <Input
              value={namaTandaTangan}
              onChange={(_, d) => setNamaTandaTangan(d.value)}
              placeholder="Ketik nama lengkap Anda"
            />
          </Field>
        </Bagian>

        {errorMsg && (
          <MessageBar layout="multiline" intent="error">
            <MessageBarBody>{errorMsg}</MessageBarBody>
          </MessageBar>
        )}

        <Button
          appearance="primary"
          size="large"
          disabled={!bisaKirim || busy}
          onClick={submit}
          icon={busy ? <Spinner size="tiny" /> : <SendRegular />}
        >
          {busy ? "Mengirim..." : "Kirim Persetujuan"}
        </Button>
      </div>
    </SectionCard>
  );
}
