"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PhotoIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { DashboardShell } from "@/components/dashboard-shell";
import { PengaduanPanel } from "@/components/pengaduan-panel";
import { formatAngkaID } from "@/lib/format";

type Distribusi = {
  id: string;
  status: string;
  porsiDiterima: number | null;
  catatan: string | null;
  sekolah: { namaSekolah: string };
};

type Menu = {
  id: string;
  tanggal: string;
  deskripsi: string;
  fotoUrl: string | null;
  jumlahPorsi: number;
  nomorMenu: number | null;
  siklus: number | null;
  energiKategoriI: number | null;
  proteinKategoriI: number | null;
  lemakKategoriI: number | null;
  karbohidratKategoriI: number | null;
  energiKategoriII: number | null;
  proteinKategoriII: number | null;
  lemakKategoriII: number | null;
  karbohidratKategoriII: number | null;
  distribusi: Distribusi[];
};

const STATUS_LABEL: Record<string, string> = {
  dikirim: "Dikirim",
  diterima: "Diterima",
  bermasalah: "Bermasalah",
};

// Nilai gizi disimpan sbg string di form state (biar input kosong gampang dicek/dikirim),
// baru di-parse jadi number di server (lihat src/lib/gizi.ts).
type GiziForm = {
  nomorMenu: string;
  siklus: string;
  energiKategoriI: string;
  proteinKategoriI: string;
  lemakKategoriI: string;
  karbohidratKategoriI: string;
  energiKategoriII: string;
  proteinKategoriII: string;
  lemakKategoriII: string;
  karbohidratKategoriII: string;
};

const GIZI_KOSONG: GiziForm = {
  nomorMenu: "",
  siklus: "",
  energiKategoriI: "",
  proteinKategoriI: "",
  lemakKategoriI: "",
  karbohidratKategoriI: "",
  energiKategoriII: "",
  proteinKategoriII: "",
  lemakKategoriII: "",
  karbohidratKategoriII: "",
};

function giziFromMenu(menu: Menu): GiziForm {
  return {
    nomorMenu: menu.nomorMenu != null ? String(menu.nomorMenu) : "",
    siklus: menu.siklus != null ? String(menu.siklus) : "",
    energiKategoriI: menu.energiKategoriI != null ? String(menu.energiKategoriI) : "",
    proteinKategoriI: menu.proteinKategoriI != null ? String(menu.proteinKategoriI) : "",
    lemakKategoriI: menu.lemakKategoriI != null ? String(menu.lemakKategoriI) : "",
    karbohidratKategoriI: menu.karbohidratKategoriI != null ? String(menu.karbohidratKategoriI) : "",
    energiKategoriII: menu.energiKategoriII != null ? String(menu.energiKategoriII) : "",
    proteinKategoriII: menu.proteinKategoriII != null ? String(menu.proteinKategoriII) : "",
    lemakKategoriII: menu.lemakKategoriII != null ? String(menu.lemakKategoriII) : "",
    karbohidratKategoriII: menu.karbohidratKategoriII != null ? String(menu.karbohidratKategoriII) : "",
  };
}

function setGiziOnFormData(formData: FormData, gizi: GiziForm) {
  (Object.keys(gizi) as (keyof GiziForm)[]).forEach((key) => formData.set(key, gizi[key]));
}

// Kontrol upload foto yang lebih jelas keliatan bisa diklik (feedback Teh Lingga: "Choose
// File" bawaan browser kurang distinct) -- input aslinya disembunyikan, label yang jadi
// kontrol visualnya, dikasih ikon + nama file yang lagi dipilih.
function FotoInput({
  file,
  onChange,
  placeholder,
}: {
  file: File | null;
  onChange: (f: File | null) => void;
  placeholder: string;
}) {
  return (
    <label className="cursor-pointer flex items-center gap-2 rounded-md border border-dashed border-neutral-300 px-3 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 hover:border-neutral-400 transition-colors">
      <PhotoIcon className="size-5 text-neutral-400 flex-shrink-0" />
      <span className="truncate">{file ? file.name : placeholder}</span>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="hidden"
      />
    </label>
  );
}

function GiziFields({
  value,
  onChange,
}: {
  value: GiziForm;
  onChange: (next: GiziForm) => void;
}) {
  function field(key: keyof GiziForm) {
    return (
      <input
        required
        type="number"
        step="any"
        min={0}
        value={value[key]}
        onChange={(e) => onChange({ ...value, [key]: e.target.value })}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
      />
    );
  }

  return (
    <div className="space-y-3 border border-neutral-200 rounded-md p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-600">Nomor menu</label>
          {field("nomorMenu")}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-neutral-600">Siklus</label>
          {field("siklus")}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-neutral-600">Nilai Gizi – Kategori I (SD)</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-neutral-500">Energi (kkal)</label>
            {field("energiKategoriI")}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-neutral-500">Protein (g)</label>
            {field("proteinKategoriI")}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-neutral-500">Lemak (g)</label>
            {field("lemakKategoriI")}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-neutral-500">Karbohidrat (g)</label>
            {field("karbohidratKategoriI")}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-neutral-600">Nilai Gizi – Kategori II (SMP ke atas)</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-neutral-500">Energi (kkal)</label>
            {field("energiKategoriII")}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-neutral-500">Protein (g)</label>
            {field("proteinKategoriII")}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-neutral-500">Lemak (g)</label>
            {field("lemakKategoriII")}
          </div>
          <div className="space-y-1">
            <label className="text-xs text-neutral-500">Karbohidrat (g)</label>
            {field("karbohidratKategoriII")}
          </div>
        </div>
      </div>
    </div>
  );
}

// Blok nilai gizi read-only, dipakai di rincian riwayat distribusi (bukan form edit).
function GiziBlock({
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

type EditState = { deskripsi: string; jumlahPorsi: string; foto: File | null; gizi: GiziForm };

export function SppgDashboard() {
  const [menuList, setMenuList] = useState<Menu[]>([]);
  const [rating, setRating] = useState<{ rataRata: number | null; jumlah: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deskripsi, setDeskripsi] = useState("");
  const [jumlahPorsi, setJumlahPorsi] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [gizi, setGizi] = useState<GiziForm>(GIZI_KOSONG);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({
    deskripsi: "",
    jumlahPorsi: "",
    foto: null,
    gizi: GIZI_KOSONG,
  });
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
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData();
    formData.set("deskripsi", deskripsi);
    formData.set("jumlahPorsi", jumlahPorsi);
    if (foto) formData.set("foto", foto);
    setGiziOnFormData(formData, gizi);

    const res = await fetch("/api/sppg/menu", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Gagal mengirim menu");
      setSubmitting(false);
      return;
    }

    setMenuList((prev) => [data.menu, ...prev]);
    setDeskripsi("");
    setJumlahPorsi("");
    setFoto(null);
    setGizi(GIZI_KOSONG);
    setSubmitting(false);
  }

  function startEdit(menu: Menu) {
    setEditingId(menu.id);
    setEditState({
      deskripsi: menu.deskripsi,
      jumlahPorsi: String(menu.jumlahPorsi),
      foto: null,
      gizi: giziFromMenu(menu),
    });
    setRowError(null);
  }

  async function saveEdit(menuId: string) {
    setRowBusy(menuId);
    setRowError(null);
    const formData = new FormData();
    formData.set("deskripsi", editState.deskripsi);
    formData.set("jumlahPorsi", editState.jumlahPorsi);
    if (editState.foto) formData.set("foto", editState.foto);
    setGiziOnFormData(formData, editState.gizi);

    const res = await fetch(`/api/sppg/menu/${menuId}`, { method: "PATCH", body: formData });
    const data = await res.json();

    if (!res.ok) {
      setRowError(data.error || "Gagal menyimpan perubahan");
      setRowBusy(null);
      return;
    }

    setMenuList((prev) => prev.map((m) => (m.id === menuId ? data.menu : m)));
    setEditingId(null);
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

  return (
    <DashboardShell title="Portal SPPG" subtitle="Unggah menu harian & distribusi ke sekolah">
      <main className="max-w-lg mx-auto p-6 space-y-8">
        {rating && rating.jumlah > 0 && (
          <div className="border border-neutral-200 rounded-lg p-4 text-sm flex items-center justify-between">
            <span className="text-neutral-600">Rating dari Sekolah &amp; Orangtua</span>
            <span className="font-semibold">
              ⭐ {rating.rataRata?.toFixed(1)}{" "}
              <span className="text-neutral-400 font-normal">({rating.jumlah})</span>
            </span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 border border-neutral-200 rounded-lg p-5">
          <h2 className="font-medium text-sm">Unggah Menu Hari Ini</h2>

          <div className="space-y-1">
            <label className="text-sm font-medium">Deskripsi menu</label>
            <textarea
              required
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Nasi, Ayam Bakar Bumbu Kecap, Tumis Kangkung, Pisang"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm min-h-20"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Jumlah porsi</label>
            <input
              required
              type="number"
              min={1}
              value={jumlahPorsi}
              onChange={(e) => setJumlahPorsi(e.target.value)}
              placeholder="300"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Nomor menu, siklus & nilai gizi</label>
            <p className="text-xs text-neutral-500">
              Wajib diisi -- ikut ditampilkan di pesan WA ke sekolah (permintaan tim Prof Elly).
            </p>
            <GiziFields value={gizi} onChange={setGizi} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Foto masakan (opsional)</label>
            <FotoInput file={foto} onChange={setFoto} placeholder="Pilih foto masakan..." />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-neutral-900 text-white text-sm font-medium py-2.5 disabled:opacity-60"
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
              const adaGiziI =
                menu.energiKategoriI != null &&
                menu.proteinKategoriI != null &&
                menu.lemakKategoriI != null &&
                menu.karbohidratKategoriI != null;
              const adaGiziII =
                menu.energiKategoriII != null &&
                menu.proteinKategoriII != null &&
                menu.lemakKategoriII != null &&
                menu.karbohidratKategoriII != null;

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
                      {menu.nomorMenu != null && menu.siklus != null && (
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Menu {menu.nomorMenu} Siklus {menu.siklus}
                        </p>
                      )}
                      <p className="text-neutral-600 mt-1">{menu.deskripsi}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {menu.distribusi.map((d) => (
                          <span
                            key={d.id}
                            className="text-xs rounded-full px-2.5 py-1 bg-neutral-100 text-neutral-700"
                          >
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

                      {expanded && (
                        <div className="mt-3 pt-3 border-t border-neutral-200 space-y-3">
                          {menu.fotoUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={menu.fotoUrl}
                              alt={`Foto menu: ${menu.deskripsi}`}
                              className="w-full max-h-80 object-contain rounded-md border border-neutral-200 bg-neutral-50"
                            />
                          )}
                          {(adaGiziI || adaGiziII) && (
                            <div className="space-y-2">
                              {adaGiziI && (
                                <GiziBlock
                                  label="Nilai Gizi – Kategori I (SD)"
                                  energi={menu.energiKategoriI!}
                                  protein={menu.proteinKategoriI!}
                                  lemak={menu.lemakKategoriI!}
                                  karbohidrat={menu.karbohidratKategoriI!}
                                />
                              )}
                              {adaGiziII && (
                                <GiziBlock
                                  label="Nilai Gizi – Kategori II (SMP ke atas)"
                                  energi={menu.energiKategoriII!}
                                  protein={menu.proteinKategoriII!}
                                  lemak={menu.lemakKategoriII!}
                                  karbohidrat={menu.karbohidratKategoriII!}
                                />
                              )}
                            </div>
                          )}
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-neutral-700">Detail per sekolah</p>
                            {menu.distribusi.map((d) => (
                              <div key={d.id} className="text-xs text-neutral-600 border border-neutral-100 rounded-md p-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-neutral-800">{d.sekolah.namaSekolah}</span>
                                  <span>{STATUS_LABEL[d.status] ?? d.status}</span>
                                </div>
                                {d.porsiDiterima != null && (
                                  <div className="mt-0.5">
                                    Porsi diterima: {d.porsiDiterima}/{menu.jumlahPorsi}
                                  </div>
                                )}
                                {d.catatan && <div className="mt-0.5 text-red-600">Catatan: {d.catatan}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {canEdit && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => startEdit(menu)}
                            className="text-xs rounded-md border border-neutral-300 px-3 py-1.5"
                          >
                            Edit
                          </button>
                          {confirmDeleteId === menu.id ? (
                            <>
                              <span className="text-xs text-neutral-500 self-center">Yakin hapus?</span>
                              <button
                                disabled={busy}
                                onClick={() => deleteMenu(menu.id)}
                                className="text-xs rounded-md bg-red-600 text-white px-3 py-1.5 disabled:opacity-60"
                              >
                                Ya, hapus
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-xs rounded-md border border-neutral-300 px-3 py-1.5"
                              >
                                Batal
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(menu.id)}
                              className="text-xs rounded-md border border-neutral-300 px-3 py-1.5 text-red-600"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      )}
                      {rowError && confirmDeleteId === menu.id && (
                        <p className="text-xs text-red-600 mt-2">{rowError}</p>
                      )}
                    </>
                  )}

                  {isEditing && (
                    <div className="space-y-3">
                      <textarea
                        value={editState.deskripsi}
                        onChange={(e) => setEditState((s) => ({ ...s, deskripsi: e.target.value }))}
                        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm min-h-16"
                      />
                      <input
                        type="number"
                        min={1}
                        value={editState.jumlahPorsi}
                        onChange={(e) => setEditState((s) => ({ ...s, jumlahPorsi: e.target.value }))}
                        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <GiziFields
                        value={editState.gizi}
                        onChange={(next) => setEditState((s) => ({ ...s, gizi: next }))}
                      />
                      <div className="space-y-1">
                        <label className="text-xs text-neutral-500">Ganti foto (opsional)</label>
                        <FotoInput
                          file={editState.foto}
                          onChange={(f) => setEditState((s) => ({ ...s, foto: f }))}
                          placeholder="Pilih foto baru..."
                        />
                      </div>
                      {rowError && <p className="text-xs text-red-600">{rowError}</p>}
                      <div className="flex gap-2">
                        <button
                          disabled={busy}
                          onClick={() => saveEdit(menu.id)}
                          className="flex-1 rounded-md bg-neutral-900 text-white text-sm py-2 disabled:opacity-60"
                        >
                          {busy ? "Menyimpan..." : "Simpan"}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 rounded-md border border-neutral-300 text-sm py-2"
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

        <PengaduanPanel
          endpoint="/api/sppg/pengaduan"
          title="Pengaduan Masuk"
          readOnly
          showSubmitter
        />
      </main>
    </DashboardShell>
  );
}
