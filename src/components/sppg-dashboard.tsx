"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { DashboardShell } from "@/components/dashboard-shell";
import { PengaduanPanel } from "@/components/pengaduan-panel";
import { Select, type SelectOption } from "@/components/ui/select";
import { SegmentedRadioGroup } from "@/components/ui/radio-group";
import { CreatableCombobox } from "@/components/ui/combobox";
import { LabeledCheckbox } from "@/components/ui/checkbox";
import { FileInput } from "@/components/ui/file-input";
import { Expandable } from "@/components/ui/expandable";
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

// --- Ringkasan nilai gizi per siklus + evaluasi BGN (SMA aja utk sekarang) ---------

// --- Editor baris item menu ---------------------------------------------------------

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

  const namaOpsi = OPSI_MENU_ITEM;

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        return (
          <div key={item.key} className="rounded-md border border-neutral-200 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">Item #{idx + 1}</span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(item.key)}
                  className="cursor-pointer text-neutral-400 hover:text-red-600"
                  aria-label="Hapus item"
                >
                  <TrashIcon className="size-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs text-neutral-500">Siklus</label>
                <input
                  required
                  type="number"
                  min={1}
                  value={item.siklus}
                  onChange={(e) => update(item.key, { siklus: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-neutral-500">Nama menu</label>
                <CreatableCombobox
                  value={item.namaMenu}
                  onChange={(v) => update(item.key, { namaMenu: v })}
                  options={namaOpsi}
                  placeholder="Ketik atau pilih nama menu..."
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-neutral-500">Sumber</label>
              <Select
                value={item.sumber || null}
                onChange={(v) => update(item.key, { sumber: v })}
                options={SUMBER_GIZI_OPSI}
                placeholder="Item ini sumber apa?"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {(
                [
                  ["energi", "Energi (kkal)"],
                  ["karbohidrat", "Karbohidrat (g)"],
                  ["lemak", "Lemak (g)"],
                  ["proteinHewani", "Protein Hewani (g)"],
                  ["proteinNabati", "Protein Nabati (g)"],
                ] as [NutrisiKey, string][]
              ).map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs text-neutral-500">{label}</label>
                  <input
                    required
                    type="number"
                    step="any"
                    min={0}
                    value={item[key]}
                    onChange={(e) => update(item.key, { [key]: e.target.value } as Partial<ItemForm>)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>

            <LabeledCheckbox
              checked={item.pakaiPanganLokal}
              onChange={(v) => update(item.key, { pakaiPanganLokal: v })}
              label="Pakai pangan lokal"
            />
            {item.pakaiPanganLokal && (
              <input
                type="text"
                value={item.panganLokalRincian}
                onChange={(e) => update(item.key, { panganLokalRincian: e.target.value })}
                placeholder="Rincian pangan lokal (mis. beras dari petani setempat)"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={tambah}
        className="cursor-pointer w-full flex items-center justify-center gap-1.5 rounded-md border border-dashed border-neutral-300 py-2 text-sm text-neutral-600 hover:bg-neutral-50 hover:border-neutral-400"
      >
        <PlusIcon className="size-4" /> Tambah item menu
      </button>
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
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Sekolah tujuan</label>
        <p className="text-xs text-neutral-500">
          Satu menu cuma bisa ditujukan ke satu sekolah. Daftar di bawah = sekolah yang dilayani SPPG ini.
        </p>
        <Select
          value={value.sekolahId || null}
          onChange={(v) => onChange({ ...value, sekolahId: v })}
          options={sekolahOpsi}
          placeholder={sekolahList.length ? "Pilih sekolah..." : "Belum ada sekolah terhubung"}
          disabled={sekolahList.length === 0}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Untuk waktu makan</label>
        <Select
          value={value.untukWaktu || null}
          onChange={(v) => onChange({ ...value, untukWaktu: v })}
          options={WAKTU_OPSI}
          placeholder="Pilih Pagi/Siang..."
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Nomor menu</label>
        <input
          required
          type="number"
          min={1}
          value={value.nomorMenu}
          onChange={(e) => onChange({ ...value, nomorMenu: e.target.value })}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <div>
          <label className="text-sm font-medium">Porsi umum &amp; porsi khusus</label>
          <Expandable summary="Apa bedanya porsi umum & khusus?">
            <p className="text-xs text-neutral-500">
              <strong>Porsi umum</strong> = porsi standar utk siswa pada umumnya. <strong>Porsi khusus</strong> =
              porsi yang disesuaikan utk siswa dengan kebutuhan khusus (mis. disabilitas, alergi/pantangan
              tertentu) yang datanya diisi sekolah. Total keduanya = jumlah porsi yang dikirim.
            </p>
          </Expandable>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-xs text-neutral-500">Porsi umum</label>
            <input
              required
              type="number"
              min={0}
              value={value.porsiUmum}
              onChange={(e) => onChange({ ...value, porsiUmum: e.target.value })}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-neutral-500">Porsi khusus</label>
            <input
              required
              type="number"
              min={0}
              value={value.porsiKhusus}
              onChange={(e) => onChange({ ...value, porsiKhusus: e.target.value })}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Waktu kirim</label>
        <div className="grid grid-cols-2 gap-2.5">
          <input
            required
            type="date"
            value={value.tanggal}
            onChange={(e) => onChange({ ...value, tanggal: e.target.value })}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            required
            type="time"
            value={value.jam}
            onChange={(e) => onChange({ ...value, jam: e.target.value })}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <SegmentedRadioGroup
          value={value.tz}
          onChange={(v) => onChange({ ...value, tz: v })}
          options={TZ_OPSI as unknown as { value: Tz; label: string }[]}
          className="mt-1.5"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Foto masakan (opsional)</label>
        <FileInput file={value.foto} onChange={(f) => onChange({ ...value, foto: f })} placeholder="Pilih foto masakan..." />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Item menu</label>
        <p className="text-xs text-neutral-500">
          Tiap item boleh siklus beda-beda -- ringkasan gizi & evaluasi BGN dihitung per siklus.
        </p>
        <ItemEditor items={value.items} onChange={(items) => onChange({ ...value, items })} />
      </div>

      <RingkasanGiziSiklus
        items={value.items}
        jenjang={sekolahTerpilih?.jenjang ?? null}
        untukWaktu={value.untukWaktu}
      />
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

function PanelKebutuhanKhusus({ sekolahList }: { sekolahList: SekolahRingkas[] }) {
  const disabilitas = agregatKebutuhanKhusus(sekolahList, "disabilitasData");
  const alergi = agregatKebutuhanKhusus(sekolahList, "alergiData");
  const adaDisabilitas = Object.values(disabilitas).some((v) => v > 0);
  const adaAlergi = Object.values(alergi).some((v) => v > 0);

  if (sekolahList.length === 0) return null;

  return (
    <div className="rounded-lg border border-neutral-200 p-4 lg:sticky lg:top-6 space-y-4">
      <div>
        <h2 className="font-medium text-sm">Ringkasan Kebutuhan Khusus</h2>
        <p className="text-xs text-neutral-500 mt-0.5">Gabungan data dari semua sekolah yang dilayani.</p>
      </div>

      <div>
        <p className="text-xs font-medium text-neutral-600 mb-1.5">Disabilitas</p>
        {!adaDisabilitas && <p className="text-xs text-neutral-400">Belum ada data.</p>}
        <div className="space-y-1.5">
          {KATEGORI_DISABILITAS.filter((k) => (disabilitas[k.kode] ?? 0) > 0).map((k) => {
            const panduan = PANDUAN_DISABILITAS.find((p) => p.kode === k.kode);
            return (
              <Expandable
                key={k.kode}
                summary={
                  <span className="flex-1 flex items-center justify-between">
                    <span>
                      {k.kode} &middot; {k.label}
                    </span>
                    <span className="font-medium text-neutral-900">{disabilitas[k.kode]}</span>
                  </span>
                }
              >
                {panduan && (
                  <p className="text-xs text-neutral-600 pl-4.5">
                    <span className="font-medium text-neutral-700">Perhatian komposisi makanan: </span>
                    {panduan.perhatianKomposisi}
                  </p>
                )}
              </Expandable>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-neutral-600 mb-1.5">Alergi / pantangan</p>
        {!adaAlergi && <p className="text-xs text-neutral-400">Belum ada data.</p>}
        <div className="space-y-1.5">
          {KATEGORI_ALERGI.filter((k) => (alergi[k.kode] ?? 0) > 0).map((k) => {
            const panduan = PANDUAN_ALERGI.find((p) => p.kode === k.kode);
            return (
              <Expandable
                key={k.kode}
                summary={
                  <span className="flex-1 flex items-center justify-between">
                    <span>{k.label}</span>
                    <span className="font-medium text-neutral-900">{alergi[k.kode]}</span>
                  </span>
                }
              >
                {panduan && (
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
                )}
              </Expandable>
            );
          })}
        </div>
        {(adaDisabilitas || adaAlergi) && (
          <p className="text-[11px] text-neutral-400 italic mt-2">{CATATAN_PANDUAN_KHUSUS}</p>
        )}
      </div>

      <Expandable summary="Rincian per sekolah">
        <div className="space-y-2">
          {sekolahList.map((s) => (
            <div key={s.id} className="text-xs border border-neutral-100 rounded-md p-2">
              <p className="font-medium text-neutral-800">{s.namaSekolah}</p>
              <p className="text-neutral-500">Jenjang {s.jenjang}</p>
            </div>
          ))}
        </div>
      </Expandable>
    </div>
  );
}

// --- Rincian riwayat (menu item + evaluasi BGN + per sekolah) ----------------------

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
    <div className="text-xs">
      <p className="font-medium text-neutral-700">{label}</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-neutral-500 mt-1">
        <span>Energi: {formatAngkaID(energi)} kkal</span>
        <span>Protein: {formatAngkaID(protein)} g</span>
        <span>Lemak: {formatAngkaID(lemak)} g</span>
        <span>Karbohidrat: {formatAngkaID(karbohidrat)} g</span>
      </div>
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
    <div className="mt-3 pt-3 border-t border-neutral-200 space-y-3">
      {menu.fotoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={menu.fotoUrl}
          alt={`Foto menu ${menu.nomorMenu ?? ""}`}
          className="w-full max-h-80 object-contain rounded-md border border-neutral-200 bg-neutral-50"
        />
      )}

      {punyaItems ? (
        <>
          <div className="space-y-2">
            <p className="text-xs font-medium text-neutral-700">Daftar item</p>
            <div className="space-y-1.5">
              {menu.items.map((it) => (
                <div key={it.id} className="text-xs border border-neutral-100 rounded-md p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-800">{it.namaMenu}</span>
                    <span className="text-neutral-400">Siklus {it.siklus}</span>
                  </div>
                  {it.sumber && (
                    <p className="text-neutral-500 mt-0.5">Sumber: {LABEL_SUMBER_GIZI[it.sumber]}</p>
                  )}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-neutral-500 mt-1">
                    <span>Energi: {formatAngkaID(it.energi)} kkal</span>
                    <span>Karbohidrat: {formatAngkaID(it.karbohidrat)} g</span>
                    <span>Lemak: {formatAngkaID(it.lemak)} g</span>
                    <span>
                      Protein: {formatAngkaID(it.proteinHewani + it.proteinNabati)} g (hewani{" "}
                      {formatAngkaID(it.proteinHewani)} / nabati {formatAngkaID(it.proteinNabati)})
                    </span>
                  </div>
                  {it.pakaiPanganLokal && (
                    <p className="text-green-700 mt-1">
                      Pangan lokal{it.panganLokalRincian ? `: ${it.panganLokalRincian}` : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
          <RingkasanGiziSiklus items={menu.items} jenjang={sekolahJenjang} untukWaktu={menu.untukWaktu ?? ""} />
        </>
      ) : (
        (adaGiziLegacyI || adaGiziLegacyII) && (
          <div className="space-y-2">
            <p className="text-xs text-neutral-400 italic">Menu lama (sebelum model item-per-item)</p>
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

      <div className="space-y-2">
        <p className="text-xs font-medium text-neutral-700">Detail per sekolah</p>
        {menu.distribusi.map((d) => (
          <div key={d.id} className="text-xs text-neutral-600 border border-neutral-100 rounded-md p-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-neutral-800">{d.sekolah.namaSekolah}</span>
              <span>{STATUS_LABEL[d.status] ?? d.status}</span>
            </div>
            {(d.porsiDiterimaUmum != null || d.porsiDiterimaKhusus != null) && (
              <div className="mt-0.5">
                Porsi diterima: {d.porsiDiterimaUmum ?? 0} umum + {d.porsiDiterimaKhusus ?? 0} khusus
              </div>
            )}
            {d.porsiDiterima != null && d.porsiDiterimaUmum == null && (
              <div className="mt-0.5">
                Porsi diterima: {d.porsiDiterima}/{menu.jumlahPorsi}
              </div>
            )}
            {(d.layakCount != null || d.tidakLayakCount != null) && (
              <div className="mt-0.5">
                Hasil pemeriksaan: {d.layakCount ?? 0} layak, {d.tidakLayakCount ?? 0} tidak layak
              </div>
            )}
            {d.catatan && <div className="mt-0.5 text-red-600">Catatan: {d.catatan}</div>}
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
  }

  const punyaSekolah = sekolahList.length > 0;

  return (
    <DashboardShell title="Portal SPPG" subtitle="Unggah menu harian & distribusi ke sekolah">
      <main className="max-w-5xl mx-auto p-6">
        {rating && rating.jumlah > 0 && (
          <div className="border border-neutral-200 rounded-lg p-4 text-sm flex items-center justify-between mb-6">
            <span className="text-neutral-600">Rating dari Sekolah &amp; Orangtua</span>
            <span className="font-semibold">
              ⭐ {rating.rataRata?.toFixed(1)}{" "}
              <span className="text-neutral-400 font-normal">({rating.jumlah})</span>
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
          <div className="space-y-8 min-w-0">
            <form onSubmit={handleSubmit} className="space-y-4 border border-neutral-200 rounded-lg p-5">
              <h2 className="font-medium text-sm">Unggah Menu</h2>
              {!punyaSekolah && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                  Belum ada sekolah yang terhubung ke SPPG ini.
                </p>
              )}
              <MenuFormFields value={formValue} onChange={setFormValue} sekolahList={sekolahList} />

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting || !punyaSekolah}
                className="cursor-pointer w-full rounded-md bg-neutral-900 text-white text-sm font-medium py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Mengirim..." : "Kirim ke Sekolah"}
              </button>
            </form>

            <div>
              <h2 className="font-medium text-sm mb-3">Riwayat Distribusi</h2>
              {loading && <p className="text-sm text-neutral-500">Memuat...</p>}
              {!loading && menuList.length === 0 && (
                <p className="text-sm text-neutral-500">Belum ada menu yang diunggah.</p>
              )}
              <div className="space-y-3">
                {menuList.map((menu) => {
                  const canEdit = menu.distribusi.every((d) => d.status === "dikirim");
                  const isEditing = editingId === menu.id;
                  const busy = rowBusy === menu.id;
                  const expanded = expandedIds.has(menu.id);

                  return (
                    <div key={menu.id} className="border border-neutral-200 rounded-lg p-4 text-sm">
                      {!isEditing && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {new Date(menu.tanggal).toLocaleDateString("id-ID", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                              })}
                            </span>
                            <span className="text-neutral-500">{menu.jumlahPorsi} porsi</span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {menu.nomorMenu != null && `Menu ${menu.nomorMenu}`}
                            {menu.untukWaktu && ` · ${menu.untukWaktu === "pagi" ? "Makan Pagi" : "Makan Siang"}`}
                          </p>
                          {menu.deskripsi && <p className="text-neutral-600 mt-1">{menu.deskripsi}</p>}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {menu.distribusi.map((d) => (
                              <span key={d.id} className="text-xs rounded-full px-2.5 py-1 bg-neutral-100 text-neutral-700">
                                {d.sekolah.namaSekolah}: {STATUS_LABEL[d.status] ?? d.status}
                              </span>
                            ))}
                          </div>

                          <button
                            onClick={() => toggleExpand(menu.id)}
                            className="cursor-pointer mt-3 flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800"
                          >
                            {expanded ? (
                              <>
                                <ChevronUpIcon className="size-3.5" /> Sembunyikan rincian
                              </>
                            ) : (
                              <>
                                <ChevronDownIcon className="size-3.5" /> Lihat rincian
                              </>
                            )}
                          </button>

                          {expanded && <RincianMenu menu={menu} />}

                          {canEdit && (
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => startEdit(menu)}
                                className="cursor-pointer text-xs rounded-md border border-neutral-300 px-3 py-1.5"
                              >
                                Edit
                              </button>
                              {confirmDeleteId === menu.id ? (
                                <>
                                  <span className="text-xs text-neutral-500 self-center">Yakin hapus?</span>
                                  <button
                                    disabled={busy}
                                    onClick={() => deleteMenu(menu.id)}
                                    className="cursor-pointer text-xs rounded-md bg-red-600 text-white px-3 py-1.5 disabled:opacity-60"
                                  >
                                    Ya, hapus
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="cursor-pointer text-xs rounded-md border border-neutral-300 px-3 py-1.5"
                                  >
                                    Batal
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteId(menu.id)}
                                  className="cursor-pointer text-xs rounded-md border border-neutral-300 px-3 py-1.5 text-red-600"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                          )}
                          {rowError && confirmDeleteId === menu.id && <p className="text-xs text-red-600 mt-2">{rowError}</p>}
                        </>
                      )}

                      {isEditing && editValue && (
                        <div className="space-y-3">
                          <MenuFormFields value={editValue} onChange={setEditValue} sekolahList={sekolahList} />
                          {rowError && <p className="text-xs text-red-600">{rowError}</p>}
                          <div className="flex gap-2">
                            <button
                              disabled={busy}
                              onClick={() => saveEdit(menu.id)}
                              className="cursor-pointer flex-1 rounded-md bg-neutral-900 text-white text-sm py-2 disabled:opacity-60"
                            >
                              {busy ? "Menyimpan..." : "Simpan"}
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditValue(null);
                              }}
                              className="cursor-pointer flex-1 rounded-md border border-neutral-300 text-sm py-2"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <PengaduanPanel endpoint="/api/sppg/pengaduan" title="Pengaduan Masuk" readOnly showSubmitter />
          </div>

          <PanelKebutuhanKhusus sekolahList={sekolahList} />
        </div>
      </main>
    </DashboardShell>
  );
}
