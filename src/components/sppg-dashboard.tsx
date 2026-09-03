"use client";

import { useEffect, useState, type FormEvent } from "react";

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

export function SppgDashboard() {
  const [menuList, setMenuList] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [deskripsi, setDeskripsi] = useState("");
  const [jumlahPorsi, setJumlahPorsi] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <main className="max-w-lg mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Portal SPPG</h1>
        <p className="text-sm text-neutral-500">Unggah menu harian &amp; distribusi ke sekolah.</p>
      </div>

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
          {menuList.map((menu) => (
            <div key={menu.id} className="border border-neutral-200 rounded-lg p-4 text-sm">
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
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
