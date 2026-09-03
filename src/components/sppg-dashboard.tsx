"use client";

import { useEffect, useState, type FormEvent } from "react";
import { DashboardShell } from "@/components/dashboard-shell";

type Distribusi = {
  id: string;
  status: string;
  sekolah: { namaSekolah: string };
};

type Menu = {
  id: string;
  tanggal: string;
  deskripsi: string;
  fotoUrl: string | null;
  jumlahPorsi: number;
  distribusi: Distribusi[];
};

const STATUS_LABEL: Record<string, string> = {
  dikirim: "Dikirim",
  diterima: "Diterima",
  bermasalah: "Bermasalah",
};

type EditState = { deskripsi: string; jumlahPorsi: string; foto: File | null };

export function SppgDashboard() {
  const [menuList, setMenuList] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [deskripsi, setDeskripsi] = useState("");
  const [jumlahPorsi, setJumlahPorsi] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ deskripsi: "", jumlahPorsi: "", foto: null });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sppg/menu")
      .then((r) => r.json())
      .then((d) => setMenuList(d.menu ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData();
    formData.set("deskripsi", deskripsi);
    formData.set("jumlahPorsi", jumlahPorsi);
    if (foto) formData.set("foto", foto);

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
    setSubmitting(false);
  }

  function startEdit(menu: Menu) {
    setEditingId(menu.id);
    setEditState({ deskripsi: menu.deskripsi, jumlahPorsi: String(menu.jumlahPorsi), foto: null });
    setRowError(null);
  }

  async function saveEdit(menuId: string) {
    setRowBusy(menuId);
    setRowError(null);
    const formData = new FormData();
    formData.set("deskripsi", editState.deskripsi);
    formData.set("jumlahPorsi", editState.jumlahPorsi);
    if (editState.foto) formData.set("foto", editState.foto);

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
            <label className="text-sm font-medium">Foto masakan (opsional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
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
                      <div className="space-y-1">
                        <label className="text-xs text-neutral-500">Ganti foto (opsional)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setEditState((s) => ({ ...s, foto: e.target.files?.[0] ?? null }))}
                          className="w-full text-sm"
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
      </main>
    </DashboardShell>
  );
}
