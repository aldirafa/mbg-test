"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Badge,
  Body1,
  Button,
  Caption1,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Divider,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  OverlayDrawer,
  Skeleton,
  SkeletonItem,
  Spinner,
  Subtitle2,
  Tab,
  TabList,
  Text,
  Tooltip,
  type BadgeProps,
} from "@fluentui/react-components";
import {
  AccessibilityRegular,
  AddRegular,
  BuildingRegular,
  CalendarRegular,
  ChatWarningRegular,
  CheckmarkCircleRegular,
  ClockRegular,
  DeleteRegular,
  DismissRegular,
  EditRegular,
  ErrorCircleRegular,
  FoodRegular,
  HistoryRegular,
  LeafOneRegular,
  SaveRegular,
  SendRegular,
  StarRegular,
  VehicleTruckProfileRegular,
} from "@fluentui/react-icons";
import { DashboardShell } from "@/components/dashboard-shell";
import { PengaduanPanel } from "@/components/pengaduan-panel";
import { Select, type SelectOption } from "@/components/ui/select";
import { SegmentedRadioGroup } from "@/components/ui/radio-group";
import { CreatableCombobox } from "@/components/ui/combobox";
import { LabeledCheckbox } from "@/components/ui/checkbox";
import { FileInput } from "@/components/ui/file-input";
import { Expandable } from "@/components/ui/expandable";
import { SectionCard } from "@/components/ui/section-card";
import { StatTile } from "@/components/ui/stat-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { useAppToast } from "@/components/ui/toast";
import { RingkasanGiziSiklus } from "@/components/gizi-siklus-summary";
import { formatAngkaID } from "@/lib/format";
import { TZ_OPSI as TZ_OPSI_BASE, TZ_TIMEZONE, isoKeTanggalJam, tanggalJamSekarang, tanggalJamTzKeIso, type Tz } from "@/lib/waktu";
import { OPSI_MENU_ITEM } from "@/lib/menu-item-opsi";
import { SUMBER_GIZI_OPSI, LABEL_SUMBER_GIZI, type SumberGizi } from "@/lib/sumber-gizi";
import type { JenjangBgn } from "@/lib/bgn";
import {
  KATEGORI_DISABILITAS,
  KATEGORI_ALERGI,
  type DataKebutuhanKhusus,
} from "@/lib/kebutuhan-khusus";
import { PANDUAN_DISABILITAS, PANDUAN_ALERGI, CATATAN_PANDUAN_KHUSUS } from "@/lib/kebutuhan-khusus-panduan";

// --- Tipe data dari server ---------------------------------------------------------

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

type DistribusiData = {
  id: string;
  status: string;
  porsiDiterima: number | null;
  porsiDiterimaUmum: number | null;
  porsiDiterimaKhusus: number | null;
  layakCount: number | null;
  tidakLayakCount: number | null;
  catatan: string | null;
  sekolah: { id: string; namaSekolah: string; jenjang: JenjangBgn };
};

type Menu = {
  id: string;
  tanggal: string;
  fotoUrl: string | null;
  jumlahPorsi: number;
  porsiUmum: number | null;
  porsiKhusus: number | null;
  untukWaktu: "pagi" | "siang" | null;
  nomorMenu: number | null;
  items: MenuItemData[];
  distribusi: DistribusiData[];
  // Legacy (menu dari sebelum model item-per-item ada)
  deskripsi: string | null;
  siklus: number | null;
  energiKategoriI: number | null;
  proteinKategoriI: number | null;
  lemakKategoriI: number | null;
  karbohidratKategoriI: number | null;
  energiKategoriII: number | null;
  proteinKategoriII: number | null;
  lemakKategoriII: number | null;
  karbohidratKategoriII: number | null;
};

type SekolahRingkas = {
  id: string;
  namaSekolah: string;
  jenjang: JenjangBgn;
  jumlahSiswa: number | null;
  disabilitasData: DataKebutuhanKhusus | null;
  alergiData: DataKebutuhanKhusus | null;
};

const STATUS_LABEL: Record<string, string> = {
  dikirim: "Dikirim",
  diterima: "Diterima",
  bermasalah: "Bermasalah",
};

const WAKTU_OPSI: SelectOption<"pagi" | "siang">[] = [
  { value: "pagi", label: "Makan Pagi" },
  { value: "siang", label: "Makan Siang" },
];

const TZ_OPSI = TZ_OPSI_BASE;

// --- Form item menu (state lokal, semua nilai numerik disimpan sbg string) ---------

type NutrisiKey = "energi" | "karbohidrat" | "lemak" | "proteinHewani" | "proteinNabati";

type ItemForm = {
  key: string;
  siklus: string;
  namaMenu: string;
  sumber: SumberGizi | "";
  energi: string;
  karbohidrat: string;
  lemak: string;
  proteinHewani: string;
  proteinNabati: string;
  pakaiPanganLokal: boolean;
  panganLokalRincian: string;
};

function buatKey() {
  return Math.random().toString(36).slice(2);
}

function itemKosong(siklus = "1"): ItemForm {
  return {
    key: buatKey(),
    siklus,
    namaMenu: "",
    sumber: "",
    energi: "",
    karbohidrat: "",
    lemak: "",
    proteinHewani: "",
    proteinNabati: "",
    pakaiPanganLokal: false,
    panganLokalRincian: "",
  };
}

function itemFormDariData(items: MenuItemData[]): ItemForm[] {
  if (items.length === 0) return [itemKosong()];
  return items.map((it) => ({
    key: buatKey(),
    siklus: String(it.siklus),
    namaMenu: it.namaMenu,
    sumber: it.sumber ?? "",
    energi: String(it.energi),
    karbohidrat: String(it.karbohidrat),
    lemak: String(it.lemak),
    proteinHewani: String(it.proteinHewani),
    proteinNabati: String(it.proteinNabati),
    pakaiPanganLokal: it.pakaiPanganLokal,
    panganLokalRincian: it.panganLokalRincian ?? "",
  }));
}


// --- Form value gabungan (dipakai buat form upload baru MAUPUN edit riwayat) -------

type MenuFormValue = {
  sekolahId: string;
  untukWaktu: "pagi" | "siang" | "";
  porsiUmum: string;
  porsiKhusus: string;
  nomorMenu: string;
  tanggal: string;
  jam: string;
  tz: Tz;
  foto: File | null;
  items: ItemForm[];
};

function nilaiFormKosong(sekolahDefault = ""): MenuFormValue {
  const { tanggal, jam } = tanggalJamSekarang(TZ_TIMEZONE.WIB);
  return {
    sekolahId: sekolahDefault,
    untukWaktu: "",
    porsiUmum: "",
    porsiKhusus: "",
    nomorMenu: "",
    tanggal,
    jam,
    tz: "WIB",
    foto: null,
    items: [itemKosong()],
  };
}

function nilaiFormDariMenu(menu: Menu): MenuFormValue {
  const d = menu.distribusi[0];
  const { tanggal, jam } = isoKeTanggalJam(menu.tanggal, TZ_TIMEZONE.WIB);
  return {
    sekolahId: d?.sekolah.id ?? "",
    untukWaktu: menu.untukWaktu ?? "",
    porsiUmum: menu.porsiUmum != null ? String(menu.porsiUmum) : "",
    porsiKhusus: menu.porsiKhusus != null ? String(menu.porsiKhusus) : "",
    nomorMenu: menu.nomorMenu != null ? String(menu.nomorMenu) : "",
    tanggal,
    jam,
    tz: "WIB",
    foto: null,
    items: itemFormDariData(menu.items),
  };
}

function buildFormData(v: MenuFormValue): FormData {
  const fd = new FormData();
  fd.set("sekolahId", v.sekolahId);
  fd.set("untukWaktu", v.untukWaktu);
  fd.set("porsiUmum", v.porsiUmum);
  fd.set("porsiKhusus", v.porsiKhusus);
  fd.set("nomorMenu", v.nomorMenu);
  fd.set("waktuKirim", tanggalJamTzKeIso(v.tanggal, v.jam, v.tz));
  if (v.foto) fd.set("foto", v.foto);
  fd.set(
    "items",
    JSON.stringify(
      v.items.map((it) => ({
        siklus: Number(it.siklus),
        namaMenu: it.namaMenu.trim(),
        sumber: it.sumber,
        energi: Number(it.energi),
        karbohidrat: Number(it.karbohidrat),
        lemak: Number(it.lemak),
        proteinHewani: Number(it.proteinHewani),
        proteinNabati: Number(it.proteinNabati),
        pakaiPanganLokal: it.pakaiPanganLokal,
        panganLokalRincian: it.panganLokalRincian.trim() || null,
      }))
    )
  );
  return fd;
}

const STATUS_COLOR: Record<string, BadgeProps["color"]> = {
  dikirim: "informative",
  diterima: "success",
  bermasalah: "danger",
};

function formatTanggalPanjang(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
}

// Judul kelompok field di dalam form.
function GrupForm({ judul, deskripsi, children }: { judul: string; deskripsi?: ReactNode; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 flex flex-col">
        <Subtitle2>{judul}</Subtitle2>
        {deskripsi && <Caption1 className="text-fg3">{deskripsi}</Caption1>}
      </legend>
      {children}
    </fieldset>
  );
}

// --- Editor baris item menu ---------------------------------------------------------

const NUTRISI: [NutrisiKey, string, string][] = [
  ["energi", "Energi", "kkal"],
  ["karbohidrat", "Karbohidrat", "g"],
  ["lemak", "Lemak", "g"],
  ["proteinHewani", "Protein hewani", "g"],
  ["proteinNabati", "Protein nabati", "g"],
];

function ItemEditor({
  items,
  onChange,
}: {
  items: ItemForm[];
  onChange: (items: ItemForm[]) => void;
}) {
  function update(key: string, patch: Partial<ItemForm>) {
    onChange(items.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }
  function remove(key: string) {
    if (items.length <= 1) return;
    onChange(items.filter((it) => it.key !== key));
  }
  function tambah() {
    const siklusTerakhir = items[items.length - 1]?.siklus || "1";
    onChange([...items, itemKosong(siklusTerakhir)]);
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, idx) => (
        <div key={item.key} className="flex flex-col gap-3 rounded-fluent-l border border-stroke2 bg-bg2 p-3 mbg-rise">
          <div className="flex items-center justify-between">
            <Badge appearance="filled" color="brand" shape="rounded">
              Item #{idx + 1}
            </Badge>
            {items.length > 1 && (
              <Tooltip content="Hapus item" relationship="label">
                <Button appearance="subtle" size="small" icon={<DeleteRegular />} onClick={() => remove(item.key)} />
              </Tooltip>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[110px_1fr_1fr]">
            <Field label="Siklus" required>
              <Input
                type="number"
                min={1}
                required
                value={item.siklus}
                onChange={(_, d) => update(item.key, { siklus: d.value })}
              />
            </Field>
            <Field label="Nama menu" required>
              <CreatableCombobox
                value={item.namaMenu}
                onChange={(v) => update(item.key, { namaMenu: v })}
                options={OPSI_MENU_ITEM}
                placeholder="Ketik atau pilih..."
                aria-label="Nama menu"
              />
            </Field>
            <Field label="Sumber">
              <Select
                value={item.sumber || null}
                onChange={(v) => update(item.key, { sumber: v })}
                options={SUMBER_GIZI_OPSI}
                placeholder="Item ini sumber apa?"
                aria-label="Sumber"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {NUTRISI.map(([key, label, unit]) => (
              <Field key={key} label={label} required>
                <Input
                  type="number"
                  step="any"
                  min={0}
                  required
                  value={item[key]}
                  onChange={(_, d) => update(item.key, { [key]: d.value } as Partial<ItemForm>)}
                  contentAfter={<Caption1 className="text-fg3">{unit}</Caption1>}
                />
              </Field>
            ))}
          </div>

          <LabeledCheckbox
            checked={item.pakaiPanganLokal}
            onChange={(v) => update(item.key, { pakaiPanganLokal: v })}
            label="Pakai pangan lokal"
          />
          {item.pakaiPanganLokal && (
            <Input
              value={item.panganLokalRincian}
              onChange={(_, d) => update(item.key, { panganLokalRincian: d.value })}
              placeholder="Rincian pangan lokal (mis. beras dari petani setempat)"
              contentBefore={<LeafOneRegular />}
              aria-label="Rincian pangan lokal"
            />
          )}
        </div>
      ))}

      <Button appearance="outline" icon={<AddRegular />} onClick={tambah}>
        Tambah item menu
      </Button>
    </div>
  );
}

// --- Form lengkap (dipakai utk upload baru & edit riwayat) --------------------------

function MenuFormFields({
  value,
  onChange,
  sekolahList,
}: {
  value: MenuFormValue;
  onChange: (v: MenuFormValue) => void;
  sekolahList: SekolahRingkas[];
}) {
  const sekolahOpsi: SelectOption[] = sekolahList.map((s) => ({
    value: s.id,
    label: s.namaSekolah,
    description: `Jenjang ${s.jenjang}`,
  }));
  const sekolahTerpilih = sekolahList.find((s) => s.id === value.sekolahId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <GrupForm judul="Tujuan & jadwal">
        <Field
          label="Sekolah tujuan"
          required
          hint="Satu menu cuma bisa ditujukan ke satu sekolah. Daftar = sekolah yang dilayani SPPG ini."
        >
          <Select
            value={value.sekolahId || null}
            onChange={(v) => onChange({ ...value, sekolahId: v })}
            options={sekolahOpsi}
            placeholder={sekolahList.length ? "Pilih sekolah..." : "Belum ada sekolah terhubung"}
            disabled={sekolahList.length === 0}
            aria-label="Sekolah tujuan"
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Untuk waktu makan" required>
            <Select
              value={value.untukWaktu || null}
              onChange={(v) => onChange({ ...value, untukWaktu: v })}
              options={WAKTU_OPSI}
              placeholder="Pilih Pagi/Siang..."
              aria-label="Untuk waktu makan"
            />
          </Field>
          <Field label="Nomor menu" required>
            <Input
              type="number"
              min={1}
              required
              value={value.nomorMenu}
              onChange={(_, d) => onChange({ ...value, nomorMenu: d.value })}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Tanggal kirim" required>
            <Input
              type="date"
              required
              value={value.tanggal}
              onChange={(_, d) => onChange({ ...value, tanggal: d.value })}
              contentBefore={<CalendarRegular />}
            />
          </Field>
          <Field label="Jam kirim" required>
            <Input
              type="time"
              required
              value={value.jam}
              onChange={(_, d) => onChange({ ...value, jam: d.value })}
              contentBefore={<ClockRegular />}
            />
          </Field>
        </div>
        <SegmentedRadioGroup
          label="Zona waktu"
          value={value.tz}
          onChange={(v) => onChange({ ...value, tz: v })}
          options={TZ_OPSI as unknown as { value: Tz; label: string }[]}
        />
      </GrupForm>

      <Divider />

      <GrupForm judul="Porsi">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Porsi umum" required>
            <Input
              type="number"
              min={0}
              required
              value={value.porsiUmum}
              onChange={(_, d) => onChange({ ...value, porsiUmum: d.value })}
            />
          </Field>
          <Field label="Porsi khusus" required>
            <Input
              type="number"
              min={0}
              required
              value={value.porsiKhusus}
              onChange={(_, d) => onChange({ ...value, porsiKhusus: d.value })}
            />
          </Field>
        </div>
        <Expandable summary="Apa bedanya porsi umum & khusus?">
          <Caption1 className="text-fg3">
            <strong>Porsi umum</strong> = porsi standar utk siswa pada umumnya. <strong>Porsi khusus</strong> = porsi
            yang disesuaikan utk siswa dengan kebutuhan khusus (mis. disabilitas, alergi/pantangan tertentu) yang
            datanya diisi sekolah. Total keduanya = jumlah porsi yang dikirim.
          </Caption1>
        </Expandable>
      </GrupForm>

      <Divider />

      <GrupForm judul="Foto masakan" deskripsi="Opsional, tapi membantu sekolah & orang tua.">
        <FileInput file={value.foto} onChange={(f) => onChange({ ...value, foto: f })} placeholder="Pilih foto masakan..." />
      </GrupForm>

      <Divider />

      <GrupForm
        judul="Item menu"
        deskripsi="Tiap item boleh siklus beda-beda. Ringkasan gizi & evaluasi BGN dihitung per siklus."
      >
        <ItemEditor items={value.items} onChange={(items) => onChange({ ...value, items })} />
      </GrupForm>

      <RingkasanGiziSiklus items={value.items} jenjang={sekolahTerpilih?.jenjang ?? null} untukWaktu={value.untukWaktu} />
    </div>
  );
}

// --- Panel ringkasan disabilitas & alergi (agregat semua sekolah SPPG ini) ---------

function agregatKebutuhanKhusus(sekolahList: SekolahRingkas[], field: "disabilitasData" | "alergiData") {
  const total: Record<string, number> = {};
  for (const s of sekolahList) {
    const data = s[field];
    if (!data) continue;
    for (const [kode, entri] of Object.entries(data)) {
      total[kode] = (total[kode] ?? 0) + (entri?.jumlah ?? 0);
    }
  }
  return total;
}

function BarisKebutuhan({ label, jumlah, children }: { label: string; jumlah: number; children?: ReactNode }) {
  return (
    <Expandable
      summary={
        <span className="flex w-full items-center justify-between gap-2">
          <span>{label}</span>
          <Badge appearance="tint" color="brand" shape="rounded">
            {jumlah} siswa
          </Badge>
        </span>
      }
    >
      {children}
    </Expandable>
  );
}

function PanelKebutuhanKhusus({ sekolahList }: { sekolahList: SekolahRingkas[] }) {
  const disabilitas = agregatKebutuhanKhusus(sekolahList, "disabilitasData");
  const alergi = agregatKebutuhanKhusus(sekolahList, "alergiData");
  const adaDisabilitas = Object.values(disabilitas).some((v) => v > 0);
  const adaAlergi = Object.values(alergi).some((v) => v > 0);

  if (sekolahList.length === 0) return null;

  return (
    <SectionCard
      title="Ringkasan Kebutuhan Khusus"
      description="Gabungan data dari semua sekolah yang dilayani."
      icon={<AccessibilityRegular />}
    >
      <div className="flex flex-col gap-1">
        <Caption1 className="font-semibold text-fg2">Disabilitas</Caption1>
        {!adaDisabilitas && <Caption1 className="text-fg3">Belum ada data.</Caption1>}
        {KATEGORI_DISABILITAS.filter((k) => (disabilitas[k.kode] ?? 0) > 0).map((k) => {
          const panduan = PANDUAN_DISABILITAS.find((p) => p.kode === k.kode);
          return (
            <BarisKebutuhan key={k.kode} label={`${k.kode} · ${k.label}`} jumlah={disabilitas[k.kode]}>
              {panduan && (
                <Caption1 className="text-fg2">
                  <span className="font-semibold">Perhatian komposisi makanan: </span>
                  {panduan.perhatianKomposisi}
                </Caption1>
              )}
            </BarisKebutuhan>
          );
        })}
      </div>

      <div className="flex flex-col gap-1">
        <Caption1 className="font-semibold text-fg2">Alergi / pantangan</Caption1>
        {!adaAlergi && <Caption1 className="text-fg3">Belum ada data.</Caption1>}
        {KATEGORI_ALERGI.filter((k) => (alergi[k.kode] ?? 0) > 0).map((k) => {
          const panduan = PANDUAN_ALERGI.find((p) => p.kode === k.kode);
          return (
            <BarisKebutuhan key={k.kode} label={k.label} jumlah={alergi[k.kode]}>
              {panduan && (
                <div className="flex flex-col gap-1">
                  <Caption1 className="text-fg2">
                    <span className="font-semibold">Perhatian komposisi makanan: </span>
                    {panduan.perhatianKomposisi}
                  </Caption1>
                  <Caption1 className="text-fg2">
                    <span className="font-semibold">Pengganti: </span>
                    {panduan.pengganti}
                  </Caption1>
                </div>
              )}
            </BarisKebutuhan>
          );
        })}
        {(adaDisabilitas || adaAlergi) && <Caption1 className="mt-1 italic text-fg3">{CATATAN_PANDUAN_KHUSUS}</Caption1>}
      </div>

      <Divider />

      <Expandable summary={`Sekolah yang dilayani (${sekolahList.length})`}>
        <ul className="flex flex-col gap-1.5">
          {sekolahList.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2 rounded-fluent-m border border-stroke2 px-3 py-2">
              <Text weight="semibold" className="block! truncate">
                {s.namaSekolah}
              </Text>
              <Badge appearance="outline" color="informative" shape="rounded">
                {s.jenjang}
              </Badge>
            </li>
          ))}
        </ul>
      </Expandable>
    </SectionCard>
  );
}

// --- Rincian riwayat (menu item + evaluasi BGN + per sekolah) ----------------------

function NilaiGizi({ items }: { items: [string, number, string][] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map(([l, v, u]) => (
        <div key={l} className="flex flex-col">
          <Caption1 className="text-fg3">{l}</Caption1>
          <Text weight="semibold" className="tabular-nums">
            {formatAngkaID(v)} <Caption1 className="text-fg3">{u}</Caption1>
          </Text>
        </div>
      ))}
    </div>
  );
}

function GiziBlockLegacy({
  label,
  energi,
  protein,
  lemak,
  karbohidrat,
}: {
  label: string;
  energi: number;
  protein: number;
  lemak: number;
  karbohidrat: number;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-fluent-m border border-stroke2 bg-bg2 p-3">
      <Caption1 className="font-semibold text-fg2">{label}</Caption1>
      <NilaiGizi
        items={[
          ["Energi", energi, "kkal"],
          ["Protein", protein, "g"],
          ["Lemak", lemak, "g"],
          ["Karbo", karbohidrat, "g"],
        ]}
      />
    </div>
  );
}

function RincianMenu({ menu }: { menu: Menu }) {
  const punyaItems = menu.items.length > 0;
  const sekolahJenjang = menu.distribusi[0]?.sekolah.jenjang ?? null;

  const adaGiziLegacyI =
    menu.energiKategoriI != null && menu.proteinKategoriI != null && menu.lemakKategoriI != null && menu.karbohidratKategoriI != null;
  const adaGiziLegacyII =
    menu.energiKategoriII != null && menu.proteinKategoriII != null && menu.lemakKategoriII != null && menu.karbohidratKategoriII != null;

  return (
    <div className="flex flex-col gap-4">
      {menu.fotoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={menu.fotoUrl}
          alt={`Foto menu ${menu.nomorMenu ?? ""}`}
          className="max-h-80 w-full rounded-fluent-m border border-stroke2 bg-bg3 object-contain"
        />
      )}

      {punyaItems ? (
        <>
          <div className="flex flex-col gap-2">
            <Caption1 className="font-semibold text-fg2">Daftar item</Caption1>
            {menu.items.map((it) => (
              <div key={it.id} className="flex flex-col gap-2 rounded-fluent-m border border-stroke2 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Text weight="semibold">{it.namaMenu}</Text>
                  <div className="flex gap-1">
                    {it.pakaiPanganLokal && (
                      <Badge appearance="tint" color="success" icon={<LeafOneRegular />} shape="rounded">
                        Pangan lokal
                      </Badge>
                    )}
                    <Badge appearance="outline" color="informative" shape="rounded">
                      Siklus {it.siklus}
                    </Badge>
                  </div>
                </div>
                {it.sumber && <Caption1 className="text-fg3">Sumber: {LABEL_SUMBER_GIZI[it.sumber]}</Caption1>}
                <NilaiGizi
                  items={[
                    ["Energi", it.energi, "kkal"],
                    ["Karbo", it.karbohidrat, "g"],
                    ["Lemak", it.lemak, "g"],
                    ["Protein", it.proteinHewani + it.proteinNabati, "g"],
                  ]}
                />
                <Caption1 className="text-fg3">
                  Protein hewani {formatAngkaID(it.proteinHewani)} g / nabati {formatAngkaID(it.proteinNabati)} g
                </Caption1>
                {it.pakaiPanganLokal && it.panganLokalRincian && (
                  <Caption1 className="text-success">Pangan lokal: {it.panganLokalRincian}</Caption1>
                )}
              </div>
            ))}
          </div>
          <RingkasanGiziSiklus items={menu.items} jenjang={sekolahJenjang} untukWaktu={menu.untukWaktu ?? ""} />
        </>
      ) : (
        (adaGiziLegacyI || adaGiziLegacyII) && (
          <div className="flex flex-col gap-2">
            <Caption1 className="italic text-fg3">Menu lama (sebelum model item-per-item)</Caption1>
            {adaGiziLegacyI && (
              <GiziBlockLegacy
                label="Nilai Gizi – Kategori I (SD)"
                energi={menu.energiKategoriI!}
                protein={menu.proteinKategoriI!}
                lemak={menu.lemakKategoriI!}
                karbohidrat={menu.karbohidratKategoriI!}
              />
            )}
            {adaGiziLegacyII && (
              <GiziBlockLegacy
                label="Nilai Gizi – Kategori II (SMP ke atas)"
                energi={menu.energiKategoriII!}
                protein={menu.proteinKategoriII!}
                lemak={menu.lemakKategoriII!}
                karbohidrat={menu.karbohidratKategoriII!}
              />
            )}
          </div>
        )
      )}

      <div className="flex flex-col gap-2">
        <Caption1 className="font-semibold text-fg2">Detail per sekolah</Caption1>
        {menu.distribusi.map((d) => (
          <div key={d.id} className="flex flex-col gap-1 rounded-fluent-m border border-stroke2 p-3">
            <div className="flex items-center justify-between gap-2">
              <Text weight="semibold">{d.sekolah.namaSekolah}</Text>
              <Badge appearance="tint" color={STATUS_COLOR[d.status] ?? "informative"} shape="rounded">
                {STATUS_LABEL[d.status] ?? d.status}
              </Badge>
            </div>
            {(d.porsiDiterimaUmum != null || d.porsiDiterimaKhusus != null) && (
              <Caption1 className="text-fg2">
                Porsi diterima: {d.porsiDiterimaUmum ?? 0} umum + {d.porsiDiterimaKhusus ?? 0} khusus
              </Caption1>
            )}
            {d.porsiDiterima != null && d.porsiDiterimaUmum == null && (
              <Caption1 className="text-fg2">
                Porsi diterima: {d.porsiDiterima}/{menu.jumlahPorsi}
              </Caption1>
            )}
            {(d.layakCount != null || d.tidakLayakCount != null) && (
              <Caption1 className="text-fg2">
                Hasil pemeriksaan: {d.layakCount ?? 0} layak, {d.tidakLayakCount ?? 0} tidak layak
              </Caption1>
            )}
            {d.catatan && <Caption1 className="text-danger">Catatan: {d.catatan}</Caption1>}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Komponen utama ------------------------------------------------------------------

export function SppgDashboard() {
  const [menuList, setMenuList] = useState<Menu[]>([]);
  const [sekolahList, setSekolahList] = useState<SekolahRingkas[]>([]);
  const [rating, setRating] = useState<{ rataRata: number | null; jumlah: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const [formValue, setFormValue] = useState<MenuFormValue>(() => nilaiFormKosong());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<MenuFormValue | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [tab, setTab] = useState<"unggah" | "riwayat" | "pengaduan">("unggah");
  const toast = useAppToast();

  useEffect(() => {
    fetch("/api/sppg/menu")
      .then((r) => r.json())
      .then((d) => setMenuList(d.menu ?? []))
      .finally(() => setLoading(false));
    fetch("/api/sppg/rating")
      .then((r) => r.json())
      .then((d) => setRating({ rataRata: d.rataRata ?? null, jumlah: d.jumlah ?? 0 }));
    fetch("/api/sppg/sekolah")
      .then((r) => r.json())
      .then((d) => setSekolahList(d.sekolahList ?? []));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/sppg/menu", { method: "POST", body: buildFormData(formValue) });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Gagal mengirim menu");
      setSubmitting(false);
      return;
    }

    setMenuList((prev) => [data.menu, ...prev]);
    setFormValue(nilaiFormKosong(formValue.sekolahId));
    setSubmitting(false);
    toast("Menu terkirim ke sekolah", { body: "Sekolah akan menerima notifikasi untuk konfirmasi." });
  }

  function startEdit(menu: Menu) {
    setEditingId(menu.id);
    setEditValue(nilaiFormDariMenu(menu));
    setRowError(null);
  }

  async function saveEdit(menuId: string) {
    if (!editValue) return;
    setRowBusy(menuId);
    setRowError(null);

    const res = await fetch(`/api/sppg/menu/${menuId}`, { method: "PATCH", body: buildFormData(editValue) });
    const data = await res.json();

    if (!res.ok) {
      setRowError(data.error || "Gagal menyimpan perubahan");
      setRowBusy(null);
      return;
    }

    setMenuList((prev) => prev.map((m) => (m.id === menuId ? data.menu : m)));
    setEditingId(null);
    setEditValue(null);
    setRowBusy(null);
    toast("Perubahan menu tersimpan");
  }

  async function deleteMenu(menuId: string) {
    setRowBusy(menuId);
    setRowError(null);
    const res = await fetch(`/api/sppg/menu/${menuId}`, { method: "DELETE" });

    if (!res.ok) {
      const data = await res.json();
      setRowError(data.error || "Gagal menghapus menu");
      setRowBusy(null);
      return;
    }

    setMenuList((prev) => prev.filter((m) => m.id !== menuId));
    setConfirmDeleteId(null);
    setRowBusy(null);
    toast("Menu dihapus", { intent: "info" });
  }

  const punyaSekolah = sekolahList.length > 0;
  const semuaDistribusi = menuList.flatMap((m) => m.distribusi);
  const nDiterima = semuaDistribusi.filter((d) => d.status === "diterima").length;
  const nBermasalah = semuaDistribusi.filter((d) => d.status === "bermasalah").length;
  const nMenunggu = semuaDistribusi.filter((d) => d.status === "dikirim").length;
  const menuEdit = menuList.find((m) => m.id === editingId) ?? null;
  const menuHapus = menuList.find((m) => m.id === confirmDeleteId) ?? null;

  function batalEdit() {
    setEditingId(null);
    setEditValue(null);
    setRowError(null);
  }

  return (
    <DashboardShell title="Portal SPPG" subtitle="Unggah menu harian & distribusi ke sekolah">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Rating sekolah & orang tua"
          value={rating && rating.jumlah > 0 ? `${rating.rataRata?.toFixed(1)} / 5` : "-"}
          hint={rating ? `${rating.jumlah} rating` : undefined}
          icon={<StarRegular />}
          tone="warning"
        />
        <StatTile label="Menunggu konfirmasi" value={nMenunggu} icon={<VehicleTruckProfileRegular />} tone="brand" />
        <StatTile label="Diterima sekolah" value={nDiterima} icon={<CheckmarkCircleRegular />} tone="success" />
        <StatTile label="Bermasalah" value={nBermasalah} icon={<ErrorCircleRegular />} tone="danger" />
      </div>

      <div className="-mx-1 overflow-x-auto">
        <TabList selectedValue={tab} onTabSelect={(_, d) => setTab(d.value as typeof tab)} size="large">
          <Tab value="unggah" icon={<FoodRegular />}>
            Unggah Menu
          </Tab>
          <Tab value="riwayat" icon={<HistoryRegular />}>
            Riwayat Distribusi
          </Tab>
          <Tab value="pengaduan" icon={<ChatWarningRegular />}>
            Pengaduan
          </Tab>
        </TabList>
      </div>

      {tab === "unggah" && (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_340px]">
          <form onSubmit={handleSubmit} className="min-w-0">
            <SectionCard title="Unggah Menu" description="Kirim menu hari ini ke sekolah tujuan." icon={<FoodRegular />}>
              {!punyaSekolah && (
                <MessageBar layout="multiline" intent="warning">
                  <MessageBarBody>Belum ada sekolah yang terhubung ke SPPG ini.</MessageBarBody>
                </MessageBar>
              )}
              <MenuFormFields value={formValue} onChange={setFormValue} sekolahList={sekolahList} />

              {error && (
                <MessageBar layout="multiline" intent="error">
                  <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
              )}

              <Button
                type="submit"
                appearance="primary"
                size="large"
                disabled={submitting || !punyaSekolah}
                icon={submitting ? <Spinner size="tiny" /> : <SendRegular />}
              >
                {submitting ? "Mengirim..." : "Kirim ke Sekolah"}
              </Button>
            </SectionCard>
          </form>

          <div className="lg:sticky lg:top-20">
            <PanelKebutuhanKhusus sekolahList={sekolahList} />
          </div>
        </div>
      )}

      {tab === "riwayat" && (
        <div className="flex flex-col gap-4">
          {loading && (
            <Skeleton aria-label="Memuat riwayat" className="grid gap-4 lg:grid-cols-2">
              <SkeletonItem size={128} shape="rectangle" />
              <SkeletonItem size={128} shape="rectangle" />
            </Skeleton>
          )}
          {!loading && menuList.length === 0 && (
            <SectionCard>
              <EmptyState
                icon={<HistoryRegular />}
                title="Belum ada menu yang diunggah"
                action={
                  <Button appearance="primary" icon={<AddRegular />} onClick={() => setTab("unggah")}>
                    Unggah menu
                  </Button>
                }
              />
            </SectionCard>
          )}
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            {menuList.map((menu) => {
              const canEdit = menu.distribusi.every((d) => d.status === "dikirim");
              return (
                <SectionCard
                  key={menu.id}
                  icon={<CalendarRegular />}
                  title={formatTanggalPanjang(menu.tanggal)}
                  description={
                    <>
                      {menu.nomorMenu != null && `Menu ${menu.nomorMenu}`}
                      {menu.untukWaktu && ` · ${menu.untukWaktu === "pagi" ? "Makan Pagi" : "Makan Siang"}`}
                      {` · ${menu.jumlahPorsi} porsi`}
                    </>
                  }
                  action={
                    canEdit ? (
                      <>
                        <Tooltip content="Edit menu" relationship="label">
                          <Button appearance="subtle" icon={<EditRegular />} onClick={() => startEdit(menu)} />
                        </Tooltip>
                        <Tooltip content="Hapus menu" relationship="label">
                          <Button
                            appearance="subtle"
                            icon={<DeleteRegular />}
                            onClick={() => {
                              setRowError(null);
                              setConfirmDeleteId(menu.id);
                            }}
                          />
                        </Tooltip>
                      </>
                    ) : undefined
                  }
                >
                  {menu.deskripsi && <Body1 className="text-fg2">{menu.deskripsi}</Body1>}
                  <div className="flex flex-wrap gap-1.5">
                    {menu.distribusi.map((d) => (
                      <Badge
                        key={d.id}
                        appearance="tint"
                        color={STATUS_COLOR[d.status] ?? "informative"}
                        icon={<BuildingRegular />}
                        shape="rounded"
                      >
                        {d.sekolah.namaSekolah}: {STATUS_LABEL[d.status] ?? d.status}
                      </Badge>
                    ))}
                  </div>
                  <Expandable summary="Lihat rincian">
                    <RincianMenu menu={menu} />
                  </Expandable>
                </SectionCard>
              );
            })}
          </div>
        </div>
      )}

      {tab === "pengaduan" && (
        <PengaduanPanel endpoint="/api/sppg/pengaduan" title="Pengaduan Masuk" readOnly showSubmitter />
      )}

      {/* Edit menu: drawer lebar penuh di mobile, panel kanan di desktop */}
      <OverlayDrawer
        position="end"
        size="large"
        open={menuEdit != null && editValue != null}
        onOpenChange={(_, d) => !d.open && batalEdit()}
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={<Button appearance="subtle" aria-label="Tutup" icon={<DismissRegular />} onClick={batalEdit} />}
          >
            Edit Menu{menuEdit ? ` · ${formatTanggalPanjang(menuEdit.tanggal)}` : ""}
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
          {editValue && <MenuFormFields value={editValue} onChange={setEditValue} sekolahList={sekolahList} />}
          {rowError && editingId && (
            <MessageBar layout="multiline" intent="error" className="mt-4">
              <MessageBarBody>{rowError}</MessageBarBody>
            </MessageBar>
          )}
        </DrawerBody>
        <DrawerFooter>
          <Button
            appearance="primary"
            disabled={rowBusy === editingId}
            icon={rowBusy === editingId ? <Spinner size="tiny" /> : <SaveRegular />}
            onClick={() => editingId && saveEdit(editingId)}
          >
            {rowBusy === editingId ? "Menyimpan..." : "Simpan"}
          </Button>
          <Button onClick={batalEdit}>Batal</Button>
        </DrawerFooter>
      </OverlayDrawer>

      {/* Konfirmasi hapus */}
      <Dialog open={menuHapus != null} onOpenChange={(_, d) => !d.open && setConfirmDeleteId(null)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Hapus menu?</DialogTitle>
            <DialogContent className="flex flex-col gap-3">
              <Body1>
                Menu {menuHapus ? formatTanggalPanjang(menuHapus.tanggal) : ""} beserta distribusinya akan dihapus
                permanen.
              </Body1>
              {rowError && (
                <MessageBar layout="multiline" intent="error">
                  <MessageBarBody>{rowError}</MessageBarBody>
                </MessageBar>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmDeleteId(null)}>Batal</Button>
              <Button
                appearance="primary"
                disabled={rowBusy === confirmDeleteId}
                icon={rowBusy === confirmDeleteId ? <Spinner size="tiny" /> : <DeleteRegular />}
                onClick={() => confirmDeleteId && deleteMenu(confirmDeleteId)}
              >
                Ya, hapus
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </DashboardShell>
  );
}
