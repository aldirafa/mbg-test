"use client";

import { useEffect, useState } from "react";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { DashboardShell } from "@/components/dashboard-shell";
import { LokasiSekolahCard } from "@/components/lokasi-sekolah-card";
import { RatingWidget } from "@/components/rating-widget";
import { PengaduanPanel } from "@/components/pengaduan-panel";
import { SekolahKebutuhanKhususForm } from "@/components/sekolah-kebutuhan-khusus-form";
import { SekolahRefleksiMingguanForm } from "@/components/sekolah-refleksi-mingguan-form";
import { LabeledCheckbox } from "@/components/ui/checkbox";
import { Expandable } from "@/components/ui/expandable";
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
  return (
    <div className="space-y-2">
      {CHECKLIST_BGN.map((item) => (
        <div key={item.id} className="border border-neutral-100 rounded-md p-2.5">
          <LabeledCheckbox
            checked={jawaban[item.id] ?? false}
            onChange={(v) => onChange({ ...jawaban, [item.id]: v })}
            label={item.label}
            description={item.required ? undefined : "Opsional"}
          />
          {item.guidance && (
            <Expandable summary="Lihat panduan" className="mt-1.5 ml-7">
              <p className="text-xs text-neutral-500">{item.guidance}</p>
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
    <div className="space-y-3 border-t border-neutral-200 pt-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-neutral-600">Waktu terima</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={draft.tanggal}
            onChange={(e) => onChange({ tanggal: e.target.value })}
            className="w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm"
          />
          <input
            type="time"
            value={draft.jam}
            onChange={(e) => onChange({ jam: e.target.value })}
            className="w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm"
          />
        </div>
        <SegmentedRadioGroup value={draft.tz} onChange={(v) => onChange({ tz: v })} options={[...TZ_OPSI]} className="mt-1" />
        <p className="text-xs text-neutral-400">
          Wajib maksimal 4 jam sejak dikirim, kalau lewat otomatis ditandai bermasalah.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-600">Porsi diterima (umum)</label>
          <input
            type="number"
            min={0}
            value={draft.porsiDiterimaUmum}
            onChange={(e) => onChange({ porsiDiterimaUmum: e.target.value })}
            className="w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-600">Porsi diterima (khusus)</label>
          <input
            type="number"
            min={0}
            value={draft.porsiDiterimaKhusus}
            onChange={(e) => onChange({ porsiDiterimaKhusus: e.target.value })}
            className="w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-600">Jumlah layak</label>
          <input
            type="number"
            min={0}
            value={draft.layakCount}
            onChange={(e) => onChange({ layakCount: e.target.value })}
            className="w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-600">Jumlah tidak layak</label>
          <input
            type="number"
            min={0}
            value={draft.tidakLayakCount}
            onChange={(e) => onChange({ tidakLayakCount: e.target.value })}
            className="w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-neutral-600">Checklist pra-penerimaan BGN</label>
        <ChecklistBgnForm jawaban={draft.checklist} onChange={(v) => onChange({ checklist: v })} />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        disabled={busy}
        onClick={onSubmit}
        className="cursor-pointer w-full rounded-md bg-neutral-900 text-white text-sm font-medium py-2 disabled:opacity-60"
      >
        {busy ? "Memproses..." : "Konfirmasi Terima"}
      </button>
    </div>
  );
}

function RincianDistribusi({ d, sekolahJenjang }: { d: Distribusi; sekolahJenjang: JenjangBgn | null }) {
  const punyaItems = d.menu.items.length > 0;
  return (
    <div className="mt-3 pt-3 border-t border-neutral-200 space-y-3">
      {d.menu.fotoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={d.menu.fotoUrl}
          alt={`Foto menu ${d.menu.nomorMenu ?? ""}`}
          className="w-full max-h-80 object-contain rounded-md border border-neutral-200 bg-neutral-50"
        />
      )}
      {punyaItems ? (
        <>
          <div className="space-y-1.5">
            {d.menu.items.map((it) => (
              <div key={it.id} className="text-xs border border-neutral-100 rounded-md p-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-800">{it.namaMenu}</span>
                  <span className="text-neutral-400">Siklus {it.siklus}</span>
                </div>
                {it.sumber && <p className="text-neutral-500 mt-0.5">Sumber: {LABEL_SUMBER_GIZI[it.sumber]}</p>}
              </div>
            ))}
          </div>
          <RingkasanGiziSiklus items={d.menu.items} jenjang={sekolahJenjang} untukWaktu={d.menu.untukWaktu ?? ""} />
        </>
      ) : (
        d.menu.deskripsi && <p className="text-xs text-neutral-500 italic">{d.menu.deskripsi} (menu lama)</p>
      )}
      {d.checklistBgn && (
        <Expandable summary="Lihat jawaban checklist BGN">
          <div className="space-y-1">
            {CHECKLIST_BGN.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-2 text-xs">
                <span className="text-neutral-600">{item.label}</span>
                <span
                  className={
                    d.checklistBgn?.[item.id]
                      ? "text-green-700 font-medium whitespace-nowrap"
                      : "text-red-600 font-medium whitespace-nowrap"
                  }
                >
                  {d.checklistBgn?.[item.id] ? "Layak" : "Tidak layak"}
                </span>
              </div>
            ))}
          </div>
        </Expandable>
      )}
    </div>
  );
}

function SeksiRiwayat({
  label,
  badgeClass,
  list,
  defaultOpen,
  children,
}: {
  label: string;
  badgeClass: string;
  list: Distribusi[];
  defaultOpen: boolean;
  children: (d: Distribusi) => React.ReactNode;
}) {
  return (
    <Disclosure defaultOpen={defaultOpen} as="div" className="group">
      <DisclosureButton className="cursor-pointer w-full flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium hover:bg-neutral-50">
        <span className="flex items-center gap-2">
          {label}
          <span className={`text-xs rounded-full px-2 py-0.5 ${badgeClass}`}>{list.length}</span>
        </span>
        <ChevronDownIcon className="size-4 text-neutral-400 transition-transform group-data-open:rotate-180" />
      </DisclosureButton>
      <DisclosurePanel className="mt-2 space-y-3">
        {list.length === 0 ? (
          <p className="text-xs text-neutral-400 px-1">Tidak ada.</p>
        ) : (
          list.map((d) => children(d))
        )}
      </DisclosurePanel>
    </Disclosure>
  );
}

export function SekolahDashboard() {
  const [list, setList] = useState<Distribusi[]>([]);
  const [jenjang, setJenjang] = useState<JenjangBgn | null>(null);
  const [loading, setLoading] = useState(true);
  const [rowState, setRowState] = useState<Record<string, RowState>>({});

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
    }
    patchRow(d.id, { busy: false });
  }

  function kartuDistribusi(d: Distribusi) {
    const rs = rowState[d.id] ?? {};
    const draft = rs.konfirmasi ?? draftAwal(d);

    return (
      <div key={d.id} className="border border-neutral-200 rounded-lg p-4 text-sm space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-medium">{d.menu.sppg.namaSppg}</div>
            <div className="text-neutral-500">
              {d.menu.nomorMenu != null && `Menu ${d.menu.nomorMenu}`}
              {d.menu.untukWaktu && ` · ${d.menu.untukWaktu === "pagi" ? "Makan Pagi" : "Makan Siang"}`}
              {!d.menu.nomorMenu && !d.menu.untukWaktu && (d.menu.deskripsi ?? "")}
            </div>
            <div className="text-neutral-400 text-xs mt-1">
              {new Date(d.menu.tanggal).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}{" "}
              &middot; {d.menu.jumlahPorsi} porsi
            </div>
            {d.ketepatanWaktu && (
              <div className="mt-1">
                <span
                  className={
                    "text-xs rounded-full px-2 py-0.5 " +
                    (d.ketepatanWaktu === "tepat_waktu"
                      ? "bg-green-50 text-green-700"
                      : d.ketepatanWaktu === "terlambat_ringan"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700")
                  }
                >
                  {LABEL_KETEPATAN_WAKTU[d.ketepatanWaktu]}
                </span>
              </div>
            )}
          </div>
          <span
            className={
              "text-xs rounded-full px-2.5 py-1 whitespace-nowrap " +
              (d.status === "diterima"
                ? "bg-green-100 text-green-700"
                : d.status === "bermasalah"
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700")
            }
          >
            {STATUS_LABEL[d.status] ?? d.status}
          </span>
        </div>

        <button
          onClick={() => patchRow(d.id, { rincianOpen: !rs.rincianOpen })}
          className="cursor-pointer flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800"
        >
          {rs.rincianOpen ? (
            <>
              <ChevronUpIcon className="size-3.5" /> Sembunyikan rincian
            </>
          ) : (
            <>
              <ChevronDownIcon className="size-3.5" /> Lihat rincian
            </>
          )}
        </button>
        {rs.rincianOpen && <RincianDistribusi d={d} sekolahJenjang={jenjang} />}

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
          <div className="space-y-2">
            <div className="text-xs text-neutral-500">
              Dikonfirmasi {(d.porsiDiterimaUmum ?? 0) + (d.porsiDiterimaKhusus ?? 0)}/{d.menu.jumlahPorsi} porsi (
              {d.porsiDiterimaUmum ?? 0} umum, {d.porsiDiterimaKhusus ?? 0} khusus).
            </div>
            {!rs.pesanText && (
              <button
                onClick={() => generatePesan(d)}
                className="cursor-pointer w-full rounded-md bg-neutral-900 text-white text-sm font-medium py-2"
              >
                Generate Pesan Siap-Bagi
              </button>
            )}
            {rs.pesanText && (
              <>
                <pre className="whitespace-pre-wrap bg-neutral-50 border border-dashed border-neutral-300 rounded-md p-3 text-xs">
                  {rs.pesanText}
                </pre>
                <button
                  onClick={() => copyPesan(d.id)}
                  className="cursor-pointer w-full rounded-md border border-neutral-300 text-sm font-medium py-2"
                >
                  {rs.copied ? "Tersalin!" : "Salin Teks"}
                </button>
              </>
            )}
          </div>
        )}

        {d.status === "bermasalah" && d.catatan && <p className="text-xs text-red-600">Catatan: {d.catatan}</p>}

        {d.status === "dikirim" && (
          <div>
            {!rs.komplainOpen && (
              <button onClick={() => patchRow(d.id, { komplainOpen: true })} className="cursor-pointer text-xs text-neutral-500 underline">
                Ajukan komplain
              </button>
            )}
            {rs.komplainOpen && (
              <div className="space-y-2 mt-1">
                <textarea
                  className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm min-h-16"
                  placeholder="Contoh: ayam kurang matang di beberapa porsi..."
                  value={rs.komplainText ?? ""}
                  onChange={(e) => patchRow(d.id, { komplainText: e.target.value })}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => patchRow(d.id, { komplainOpen: false })}
                    className="cursor-pointer flex-1 rounded-md border border-neutral-300 text-sm py-1.5"
                  >
                    Batal
                  </button>
                  <button
                    disabled={rs.busy}
                    onClick={() => submitKomplain(d)}
                    className="cursor-pointer flex-1 rounded-md bg-neutral-900 text-white text-sm py-1.5 disabled:opacity-60"
                  >
                    Kirim
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const menunggu = list.filter((d) => d.status === "dikirim");
  const diterima = list.filter((d) => d.status === "diterima");
  const bermasalah = list.filter((d) => d.status === "bermasalah");

  return (
    <DashboardShell title="Portal Sekolah" subtitle="Konfirmasi distribusi & bagikan info ke orangtua">
      <main className="max-w-lg mx-auto p-6 space-y-4">
        <LokasiSekolahCard />
        <SekolahKebutuhanKhususForm />
        <SekolahRefleksiMingguanForm />
        <div className="border border-neutral-200 rounded-lg p-4">
          <RatingWidget endpoint="/api/sekolah/rating" label="Kasih rating buat SPPG" />
        </div>
        <PengaduanPanel endpoint="/api/sekolah/pengaduan" title="Pengaduan ke SPPG" />

        {loading && <p className="text-sm text-neutral-500">Memuat...</p>}
        {!loading && list.length === 0 && <p className="text-sm text-neutral-500">Belum ada distribusi masuk.</p>}

        {!loading && list.length > 0 && (
          <div className="space-y-3">
            <SeksiRiwayat label="Menunggu Konfirmasi" badgeClass="bg-amber-100 text-amber-700" list={menunggu} defaultOpen>
              {kartuDistribusi}
            </SeksiRiwayat>
            <SeksiRiwayat label="Bermasalah" badgeClass="bg-red-100 text-red-700" list={bermasalah} defaultOpen>
              {kartuDistribusi}
            </SeksiRiwayat>
            <SeksiRiwayat label="Diterima" badgeClass="bg-green-100 text-green-700" list={diterima} defaultOpen={false}>
              {kartuDistribusi}
            </SeksiRiwayat>
          </div>
        )}
      </main>
    </DashboardShell>
  );
}
