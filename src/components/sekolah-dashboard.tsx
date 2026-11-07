"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Caption1,
  CounterBadge,
  Divider,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Skeleton,
  SkeletonItem,
  Spinner,
  SpinButton,
  Subtitle2,
  Tab,
  TabList,
  Text,
  Textarea,
  type BadgeProps,
} from "@fluentui/react-components";
import {
  BoxCheckmarkRegular,
  CalendarRegular,
  ChatWarningRegular,
  CheckmarkCircleRegular,
  CheckmarkRegular,
  ClipboardTaskListLtrRegular,
  ClockRegular,
  CopyRegular,
  DismissCircleRegular,
  DismissRegular,
  ErrorCircleRegular,
  FoodRegular,
  PersonCircleRegular,
  SendRegular,
  ShareRegular,
  StarRegular,
  VehicleTruckProfileRegular,
} from "@fluentui/react-icons";
import { DashboardShell } from "@/components/dashboard-shell";
import { LokasiSekolahCard } from "@/components/lokasi-sekolah-card";
import { RatingWidget } from "@/components/rating-widget";
import { PengaduanPanel } from "@/components/pengaduan-panel";
import { SekolahKebutuhanKhususForm } from "@/components/sekolah-kebutuhan-khusus-form";
import { SekolahRefleksiMingguanForm } from "@/components/sekolah-refleksi-mingguan-form";
import { LabeledCheckbox } from "@/components/ui/checkbox";
import { Expandable } from "@/components/ui/expandable";
import { SectionCard } from "@/components/ui/section-card";
import { StatTile } from "@/components/ui/stat-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { useAppToast } from "@/components/ui/toast";
import { RingkasanGiziSiklus } from "@/components/gizi-siklus-summary";
import { CHECKLIST_BGN } from "@/lib/bgn-checklist";
import { TZ_OPSI, TZ_TIMEZONE, type Tz, tanggalJamSekarang, tanggalJamTzKeIso } from "@/lib/waktu";
import { SegmentedRadioGroup } from "@/components/ui/radio-group";
import type { JenjangBgn } from "@/lib/bgn";
import { LABEL_SUMBER_GIZI, type SumberGizi } from "@/lib/sumber-gizi";
import { LABEL_KETEPATAN_WAKTU, type KlasifikasiKetepatanWaktu } from "@/lib/ketepatan-waktu";

type MenuItemData = {
  id: string;
  siklus: number;
  namaMenu: string;
  sumber: SumberGizi | null;
  energi: number;
  karbohidrat: number;
  lemak: number;
  proteinHewani: number;
  proteinNabati: number;
  pakaiPanganLokal: boolean;
  panganLokalRincian: string | null;
};

type Distribusi = {
  id: string;
  status: string;
  waktuKirim: string | null;
  waktuTerima: string | null;
  ketepatanWaktu: KlasifikasiKetepatanWaktu | null;
  porsiDiterima: number | null;
  porsiDiterimaUmum: number | null;
  porsiDiterimaKhusus: number | null;
  layakCount: number | null;
  tidakLayakCount: number | null;
  checklistBgn: Record<string, boolean> | null;
  catatan: string | null;
  menu: {
    tanggal: string;
    deskripsi: string | null;
    jumlahPorsi: number;
    porsiUmum: number | null;
    porsiKhusus: number | null;
    untukWaktu: "pagi" | "siang" | null;
    nomorMenu: number | null;
    fotoUrl: string | null;
    items: MenuItemData[];
    sppg: { namaSppg: string };
  };
};

type KonfirmasiDraft = {
  tanggal: string;
  jam: string;
  tz: Tz;
  porsiDiterimaUmum: string;
  porsiDiterimaKhusus: string;
  layakCount: string;
  tidakLayakCount: string;
  checklist: Record<string, boolean>;
};

type RowState = {
  pesanText?: string;
  copied?: boolean;
  komplainOpen?: boolean;
  komplainText?: string;
  busy?: boolean;
  error?: string;
  rincianOpen?: boolean;
  konfirmasi?: KonfirmasiDraft;
};

const STATUS_LABEL: Record<string, string> = {
  dikirim: "Menunggu konfirmasi",
  diterima: "Diterima",
  bermasalah: "Bermasalah",
};

function draftAwal(d: Distribusi): KonfirmasiDraft {
  const { tanggal, jam } = tanggalJamSekarang(TZ_TIMEZONE.WIB);
  return {
    tanggal,
    jam,
    tz: "WIB",
    porsiDiterimaUmum: d.menu.porsiUmum != null ? String(d.menu.porsiUmum) : "",
    porsiDiterimaKhusus: d.menu.porsiKhusus != null ? String(d.menu.porsiKhusus) : "",
    layakCount: "",
    tidakLayakCount: "",
    checklist: {},
  };
}

const STATUS_COLOR: Record<string, BadgeProps["color"]> = {
  dikirim: "warning",
  diterima: "success",
  bermasalah: "danger",
};

const KETEPATAN_COLOR: Record<KlasifikasiKetepatanWaktu, BadgeProps["color"]> = {
  tepat_waktu: "success",
  terlambat_ringan: "warning",
  terlambat_berat: "danger",
};

// Input angka (string state) berbasis Fluent SpinButton.
function AngkaField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <SpinButton
        min={0}
        value={value === "" ? null : Number(value)}
        displayValue={value}
        onChange={(_, d) => {
          const v = d.value ?? (d.displayValue != null && d.displayValue !== "" ? Number(d.displayValue) : NaN);
          onChange(Number.isFinite(v) ? String(Math.max(0, v)) : "");
        }}
        placeholder="0"
      />
    </Field>
  );
}

// Checklist pra-penerimaan BGN penuh (9 item wajib + 2 opsional, teks dari tim) --
// dicentang aktif satu-satu, gak ada yang default tercentang. Item wajib yang gagal
// (atau gak dicentang sama sekali) memblokir "Diterima" & otomatis diarahkan jadi
// "Bermasalah" (lihat POST /api/sekolah/konfirmasi).
function ChecklistBgnForm({
  jawaban,
  onChange,
}: {
  jawaban: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => void;
}) {
  const wajib = CHECKLIST_BGN.filter((i) => i.required);
  const terisi = wajib.filter((i) => jawaban[i.id]).length;
  return (
    <div className="flex flex-col gap-2">
      <Caption1 className="text-fg3">
        {terisi}/{wajib.length} item wajib dicentang
      </Caption1>
      {CHECKLIST_BGN.map((item) => (
        <div key={item.id} className="rounded-fluent-m border border-stroke2 px-2 py-1.5">
          <LabeledCheckbox
            checked={jawaban[item.id] ?? false}
            onChange={(v) => onChange({ ...jawaban, [item.id]: v })}
            label={item.label}
            description={item.required ? undefined : "Opsional"}
          />
          {item.guidance && (
            <Expandable summary="Lihat panduan" className="ml-8">
              <Caption1 className="text-fg3">{item.guidance}</Caption1>
            </Expandable>
          )}
        </div>
      ))}
    </div>
  );
}

function KonfirmasiForm({
  draft,
  onChange,
  onSubmit,
  busy,
  error,
}: {
  draft: KonfirmasiDraft;
  onChange: (patch: Partial<KonfirmasiDraft>) => void;
  onSubmit: () => void;
  busy?: boolean;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Divider />
      <Subtitle2 className="inline-flex items-center gap-1.5">
        <BoxCheckmarkRegular /> Konfirmasi penerimaan
      </Subtitle2>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Tanggal terima">
            <Input type="date" value={draft.tanggal} onChange={(_, d) => onChange({ tanggal: d.value })} />
          </Field>
          <Field label="Jam terima">
            <Input type="time" value={draft.jam} onChange={(_, d) => onChange({ jam: d.value })} />
          </Field>
        </div>
        <SegmentedRadioGroup value={draft.tz} onChange={(v) => onChange({ tz: v })} options={[...TZ_OPSI]} />
        <Caption1 className="inline-flex items-center gap-1 text-fg3">
          <ClockRegular /> Wajib maksimal 4 jam sejak dikirim, kalau lewat otomatis ditandai bermasalah.
        </Caption1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <AngkaField label="Porsi diterima (umum)" value={draft.porsiDiterimaUmum} onChange={(v) => onChange({ porsiDiterimaUmum: v })} />
        <AngkaField label="Porsi diterima (khusus)" value={draft.porsiDiterimaKhusus} onChange={(v) => onChange({ porsiDiterimaKhusus: v })} />
        <AngkaField label="Jumlah layak" value={draft.layakCount} onChange={(v) => onChange({ layakCount: v })} />
        <AngkaField label="Jumlah tidak layak" value={draft.tidakLayakCount} onChange={(v) => onChange({ tidakLayakCount: v })} />
      </div>

      <Field label="Checklist pra-penerimaan BGN">
        <ChecklistBgnForm jawaban={draft.checklist} onChange={(v) => onChange({ checklist: v })} />
      </Field>

      {error && (
        <MessageBar layout="multiline" intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      <Button
        appearance="primary"
        size="large"
        disabled={busy}
        onClick={onSubmit}
        icon={busy ? <Spinner size="tiny" /> : <CheckmarkRegular />}
      >
        {busy ? "Memproses..." : "Konfirmasi Terima"}
      </Button>
    </div>
  );
}

function RincianDistribusi({ d, sekolahJenjang }: { d: Distribusi; sekolahJenjang: JenjangBgn | null }) {
  const punyaItems = d.menu.items.length > 0;
  return (
    <div className="flex flex-col gap-3">
      {d.menu.fotoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={d.menu.fotoUrl}
          alt={`Foto menu ${d.menu.nomorMenu ?? ""}`}
          className="max-h-80 w-full rounded-fluent-m border border-stroke2 bg-bg3 object-contain"
        />
      )}
      {punyaItems ? (
        <>
          <ul className="flex flex-col gap-1.5">
            {d.menu.items.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-2 rounded-fluent-m border border-stroke2 px-3 py-2">
                <div className="flex min-w-0 flex-col">
                  <Text weight="semibold" className="block! truncate">
                    {it.namaMenu}
                  </Text>
                  {it.sumber && <Caption1 className="text-fg3">Sumber: {LABEL_SUMBER_GIZI[it.sumber]}</Caption1>}
                </div>
                <Badge appearance="outline" color="informative" shape="rounded">
                  Siklus {it.siklus}
                </Badge>
              </li>
            ))}
          </ul>
          <RingkasanGiziSiklus items={d.menu.items} jenjang={sekolahJenjang} untukWaktu={d.menu.untukWaktu ?? ""} />
        </>
      ) : (
        d.menu.deskripsi && <Caption1 className="italic text-fg3">{d.menu.deskripsi} (menu lama)</Caption1>
      )}
      {d.checklistBgn && (
        <Expandable summary="Lihat jawaban checklist BGN">
          <ul className="flex flex-col gap-1">
            {CHECKLIST_BGN.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-2">
                <Caption1 className="text-fg2">{item.label}</Caption1>
                {d.checklistBgn?.[item.id] ? (
                  <Caption1 className="inline-flex shrink-0 items-center gap-1 font-semibold text-success">
                    <CheckmarkCircleRegular /> Layak
                  </Caption1>
                ) : (
                  <Caption1 className="inline-flex shrink-0 items-center gap-1 font-semibold text-danger">
                    <DismissCircleRegular /> Tidak layak
                  </Caption1>
                )}
              </li>
            ))}
          </ul>
        </Expandable>
      )}
    </div>
  );
}

export function SekolahDashboard() {
  const [list, setList] = useState<Distribusi[]>([]);
  const [jenjang, setJenjang] = useState<JenjangBgn | null>(null);
  const [loading, setLoading] = useState(true);
  const [rowState, setRowState] = useState<Record<string, RowState>>({});
  const [tab, setTab] = useState<"distribusi" | "profil" | "umpan">("distribusi");
  const [filter, setFilter] = useState<"menunggu" | "bermasalah" | "diterima">("menunggu");
  const toast = useAppToast();

  function patchRow(id: string, patch: Partial<RowState>) {
    setRowState((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function patchDraft(d: Distribusi, patch: Partial<KonfirmasiDraft>) {
    setRowState((prev) => {
      const current = prev[d.id]?.konfirmasi ?? draftAwal(d);
      return { ...prev, [d.id]: { ...prev[d.id], konfirmasi: { ...current, ...patch } } };
    });
  }

  function loadDistribusi() {
    return fetch("/api/sekolah/distribusi")
      .then((r) => r.json())
      .then((d) => setList(d.distribusi ?? []));
  }

  useEffect(() => {
    loadDistribusi().finally(() => setLoading(false));
    fetch("/api/sekolah/kebutuhan-khusus")
      .then((r) => r.json())
      .then((d) => setJenjang(d.jenjang ?? null));
  }, []);

  async function submitKonfirmasi(d: Distribusi) {
    const draft = rowState[d.id]?.konfirmasi ?? draftAwal(d);
    const porsiUmum = Number(draft.porsiDiterimaUmum);
    const porsiKhusus = Number(draft.porsiDiterimaKhusus);
    const layak = Number(draft.layakCount);
    const tidakLayak = Number(draft.tidakLayakCount);
    if (![porsiUmum, porsiKhusus, layak, tidakLayak].every(Number.isFinite)) {
      patchRow(d.id, { error: "Semua kolom porsi & hasil pemeriksaan wajib diisi angka" });
      return;
    }
    patchRow(d.id, { busy: true, error: undefined });
    const res = await fetch("/api/sekolah/konfirmasi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        distribusiId: d.id,
        waktuTerima: tanggalJamTzKeIso(draft.tanggal, draft.jam, draft.tz),
        porsiDiterimaUmum: porsiUmum,
        porsiDiterimaKhusus: porsiKhusus,
        layakCount: layak,
        tidakLayakCount: tidakLayak,
        checklistBgn: draft.checklist,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      patchRow(d.id, { error: data.error || "Gagal konfirmasi", busy: false });
      return;
    }
    await loadDistribusi();
    patchRow(d.id, { busy: false });
    toast("Konfirmasi tersimpan", { body: `Status: ${STATUS_LABEL[data.distribusi?.status] ?? "diperbarui"}` });
  }

  async function generatePesan(d: Distribusi) {
    const res = await fetch(`/api/sekolah/pesan-harian?distribusiId=${d.id}`);
    const data = await res.json();
    if (res.ok) patchRow(d.id, { pesanText: data.text });
  }

  async function copyPesan(id: string) {
    const text = rowState[id]?.pesanText ?? "";
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard permission bisa ditolak browser -- teksnya tetap kelihatan di layar buat di-copy manual.
    }
    patchRow(id, { copied: true });
    setTimeout(() => patchRow(id, { copied: false }), 1600);
  }

  async function submitKomplain(d: Distribusi) {
    const catatan = rowState[d.id]?.komplainText?.trim();
    if (!catatan) return;
    patchRow(d.id, { busy: true });
    const res = await fetch("/api/sekolah/komplain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ distribusiId: d.id, catatan }),
    });
    if (res.ok) {
      await loadDistribusi();
      patchRow(d.id, { komplainOpen: false, komplainText: "" });
      toast("Komplain terkirim");
    } else {
      toast("Gagal mengirim komplain", { intent: "error" });
    }
    patchRow(d.id, { busy: false });
  }

  function kartuDistribusi(d: Distribusi) {
    const rs = rowState[d.id] ?? {};
    const draft = rs.konfirmasi ?? draftAwal(d);

    return (
      <SectionCard
        key={d.id}
        icon={<VehicleTruckProfileRegular />}
        title={d.menu.sppg.namaSppg}
        description={
          <span className="flex flex-col">
            <span>
              {d.menu.nomorMenu != null && `Menu ${d.menu.nomorMenu}`}
              {d.menu.untukWaktu && ` · ${d.menu.untukWaktu === "pagi" ? "Makan Pagi" : "Makan Siang"}`}
              {!d.menu.nomorMenu && !d.menu.untukWaktu && (d.menu.deskripsi ?? "")}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarRegular />
              {new Date(d.menu.tanggal).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}{" "}
              · {d.menu.jumlahPorsi} porsi
            </span>
          </span>
        }
        action={
          <>
            {d.ketepatanWaktu && (
              <Badge appearance="outline" color={KETEPATAN_COLOR[d.ketepatanWaktu]} icon={<ClockRegular />} shape="rounded">
                {LABEL_KETEPATAN_WAKTU[d.ketepatanWaktu]}
              </Badge>
            )}
            <Badge appearance="tint" color={STATUS_COLOR[d.status] ?? "informative"} shape="rounded">
              {STATUS_LABEL[d.status] ?? d.status}
            </Badge>
          </>
        }
      >
        <Expandable summary="Lihat rincian menu">
          <RincianDistribusi d={d} sekolahJenjang={jenjang} />
        </Expandable>

        {d.status === "dikirim" && (
          <KonfirmasiForm
            draft={draft}
            onChange={(patch) => patchDraft(d, patch)}
            onSubmit={() => submitKonfirmasi(d)}
            busy={rs.busy}
            error={rs.error}
          />
        )}

        {d.status === "diterima" && (
          <div className="flex flex-col gap-2">
            <MessageBar layout="multiline" intent="success">
              <MessageBarBody>
                Dikonfirmasi {(d.porsiDiterimaUmum ?? 0) + (d.porsiDiterimaKhusus ?? 0)}/{d.menu.jumlahPorsi} porsi (
                {d.porsiDiterimaUmum ?? 0} umum, {d.porsiDiterimaKhusus ?? 0} khusus).
              </MessageBarBody>
            </MessageBar>
            {!rs.pesanText && (
              <Button appearance="primary" icon={<ShareRegular />} onClick={() => generatePesan(d)}>
                Generate Pesan Siap-Bagi
              </Button>
            )}
            {rs.pesanText && (
              <>
                <pre className="whitespace-pre-wrap rounded-fluent-m border border-dashed border-stroke1 bg-bg2 p-3 font-mono text-xs">
                  {rs.pesanText}
                </pre>
                <Button
                  icon={rs.copied ? <CheckmarkRegular /> : <CopyRegular />}
                  appearance={rs.copied ? "primary" : "secondary"}
                  onClick={() => copyPesan(d.id)}
                >
                  {rs.copied ? "Tersalin!" : "Salin Teks"}
                </Button>
              </>
            )}
          </div>
        )}

        {d.status === "bermasalah" && d.catatan && (
          <MessageBar layout="multiline" intent="error">
            <MessageBarBody>Catatan: {d.catatan}</MessageBarBody>
          </MessageBar>
        )}

        {d.status === "dikirim" && (
          <div>
            {!rs.komplainOpen && (
              <Button appearance="subtle" icon={<ChatWarningRegular />} onClick={() => patchRow(d.id, { komplainOpen: true })}>
                Ajukan komplain
              </Button>
            )}
            {rs.komplainOpen && (
              <div className="flex flex-col gap-2 mbg-rise">
                <Field label="Isi komplain">
                  <Textarea
                    resize="vertical"
                    placeholder="Contoh: ayam kurang matang di beberapa porsi..."
                    value={rs.komplainText ?? ""}
                    onChange={(_, v) => patchRow(d.id, { komplainText: v.value })}
                  />
                </Field>
                <div className="flex justify-end gap-2">
                  <Button icon={<DismissRegular />} onClick={() => patchRow(d.id, { komplainOpen: false })}>
                    Batal
                  </Button>
                  <Button appearance="primary" icon={<SendRegular />} disabled={rs.busy} onClick={() => submitKomplain(d)}>
                    Kirim
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>
    );
  }

  const menunggu = list.filter((d) => d.status === "dikirim");
  const diterima = list.filter((d) => d.status === "diterima");
  const bermasalah = list.filter((d) => d.status === "bermasalah");
  const tampil = filter === "menunggu" ? menunggu : filter === "bermasalah" ? bermasalah : diterima;

  return (
    <DashboardShell title="Portal Sekolah" subtitle="Konfirmasi distribusi & bagikan info ke orang tua">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatTile label="Menunggu konfirmasi" value={menunggu.length} icon={<ClockRegular />} tone="warning" />
        <StatTile label="Bermasalah" value={bermasalah.length} icon={<ErrorCircleRegular />} tone="danger" />
        <StatTile label="Diterima" value={diterima.length} icon={<CheckmarkCircleRegular />} tone="success" />
      </div>

      <div className="-mx-1 overflow-x-auto">
        <TabList selectedValue={tab} onTabSelect={(_, d) => setTab(d.value as typeof tab)} size="large">
          <Tab value="distribusi" icon={<FoodRegular />}>
            Distribusi
          </Tab>
          <Tab value="profil" icon={<PersonCircleRegular />}>
            Profil & Refleksi
          </Tab>
          <Tab value="umpan" icon={<StarRegular />}>
            Rating & Pengaduan
          </Tab>
        </TabList>
      </div>

      {tab === "distribusi" && (
        <div className="flex flex-col gap-4">
          <div className="-mx-1 overflow-x-auto">
            <TabList
              appearance="subtle"
              selectedValue={filter}
              onTabSelect={(_, d) => setFilter(d.value as typeof filter)}
            >
              <Tab value="menunggu">
                <span className="inline-flex items-center gap-1.5">
                  Menunggu <CounterBadge count={menunggu.length} size="small" color="informative" showZero />
                </span>
              </Tab>
              <Tab value="bermasalah">
                <span className="inline-flex items-center gap-1.5">
                  Bermasalah <CounterBadge count={bermasalah.length} size="small" color="danger" />
                </span>
              </Tab>
              <Tab value="diterima">Diterima</Tab>
            </TabList>
          </div>
          {loading && (
            <Skeleton aria-label="Memuat distribusi" className="grid gap-4 lg:grid-cols-2">
              <SkeletonItem size={128} shape="rectangle" />
              <SkeletonItem size={128} shape="rectangle" />
            </Skeleton>
          )}
          {!loading && tampil.length === 0 && (
            <EmptyState
              icon={<ClipboardTaskListLtrRegular />}
              title={list.length === 0 ? "Belum ada distribusi masuk" : "Tidak ada distribusi di kategori ini"}
            />
          )}
          {!loading && tampil.length > 0 && (
            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">{tampil.map((d) => kartuDistribusi(d))}</div>
          )}
        </div>
      )}

      {tab === "profil" && (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <SekolahRefleksiMingguanForm />
            <LokasiSekolahCard />
          </div>
          <SekolahKebutuhanKhususForm />
        </div>
      )}

      {tab === "umpan" && (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <SectionCard title="Rating SPPG" icon={<StarRegular />}>
            <RatingWidget endpoint="/api/sekolah/rating" label="Kasih rating buat SPPG" />
          </SectionCard>
          <PengaduanPanel endpoint="/api/sekolah/pengaduan" title="Pengaduan ke SPPG" />
        </div>
      )}
    </DashboardShell>
  );
}
