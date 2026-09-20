"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { LabeledCheckbox } from "@/components/ui/checkbox";

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
        <main className="max-w-lg mx-auto p-6">
          <p className="text-sm text-neutral-500">Memuat...</p>
        </main>
      </DashboardShell>
    );
  }

  if (step === "error") {
    return (
      <DashboardShell title="Portal Orang Tua">
        <main className="max-w-lg mx-auto p-6">
          <p className="text-sm text-red-600">{errorMsg}</p>
        </main>
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
      <main className="max-w-lg mx-auto p-6">
        {totalAnak > 1 && (
          <p className="text-xs text-neutral-500 mb-4">
            {totalAnak - totalBelum + 1} dari {totalAnak} anak &middot; isi formulir untuk tiap anak sebelum bisa
            mengakses dashboard.
          </p>
        )}
        <SatuFormulirAnak
          key={anakBerikutnya.siswa.id}
          child={anakBerikutnya}
          onSelesai={() => load()}
        />
      </main>
    </DashboardShell>
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

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <div className="p-4 space-y-6">
        <div>
          <h2 className="font-semibold">Formulir Persetujuan Program Makan Bergizi Gratis</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Mohon diisi sebelum bisa menggunakan fitur harian aplikasi untuk anak ini.
          </p>
        </div>

        {/* A. Identitas Siswa */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">A. Identitas Siswa</p>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
            <dt className="text-neutral-500">Nama Siswa</dt>
            <dd className="font-medium">{child.siswa.nama}</dd>
            <dt className="text-neutral-500">Kelas</dt>
            <dd className="font-medium">{child.siswa.kelas || "-"}</dd>
            <dt className="text-neutral-500">Sekolah</dt>
            <dd className="font-medium">{child.siswa.namaSekolah}</dd>
            <dt className="text-neutral-500">Nama Orang Tua/Wali</dt>
            <dd className="font-medium">{child.orangtua.nama}</dd>
          </dl>
          <div className="pt-1">
            <label className="text-sm font-medium">Nomor HP Orang Tua</label>
            <input
              value={noHpOrangTua}
              onChange={(e) => setNoHpOrangTua(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* B. Kesediaan Mengikuti Program */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            B. Kesediaan Mengikuti Program
          </p>
          <div className="space-y-2">
            <LabeledCheckbox
              checked={bersedia === true}
              onChange={(v) => setBersedia(v ? true : bersedia === true ? null : bersedia)}
              label="Bersedia mengikutsertakan anak dalam Program Makan Bergizi Gratis"
            />
            <LabeledCheckbox
              checked={bersedia === false}
              onChange={(v) => setBersedia(v ? false : bersedia === false ? null : bersedia)}
              label="Tidak bersedia"
            />
          </div>
          {bersedia === false && (
            <textarea
              value={alasanTidakBersedia}
              onChange={(e) => setAlasanTidakBersedia(e.target.value)}
              placeholder="Alasan tidak bersedia..."
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm min-h-16"
            />
          )}
        </div>

        {/* C. Informasi Alergi Makanan */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            C. Informasi Alergi Makanan
          </p>
          <div className="space-y-2">
            <LabeledCheckbox
              checked={adaAlergi === true}
              onChange={(v) => setAdaAlergi(v ? true : adaAlergi === true ? null : adaAlergi)}
              label="Ya, ada alergi/pantangan makanan"
            />
            <LabeledCheckbox
              checked={adaAlergi === false}
              onChange={(v) => setAdaAlergi(v ? false : adaAlergi === false ? null : adaAlergi)}
              label="Tidak ada"
            />
          </div>
          {adaAlergi === true && (
            <textarea
              value={jenisAlergi}
              onChange={(e) => setJenisAlergi(e.target.value)}
              placeholder="Sebutkan jenis alergi/pantangannya..."
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm min-h-16"
            />
          )}
        </div>

        {/* D. Tanda Tangan Persetujuan */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            D. Tanda Tangan Persetujuan
          </p>
          <LabeledCheckbox
            checked={setujuTandaTangan}
            onChange={setSetujuTandaTangan}
            label="Saya menyatakan data di atas benar dan menyetujui formulir ini sebagai pengganti tanda tangan basah."
          />
          <div>
            <label className="text-sm font-medium">Nama Lengkap (sebagai tanda tangan digital)</label>
            <input
              value={namaTandaTangan}
              onChange={(e) => setNamaTandaTangan(e.target.value)}
              placeholder="Ketik nama lengkap Anda"
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

        <button
          disabled={!bisaKirim || busy}
          onClick={submit}
          className="cursor-pointer w-full rounded-md bg-neutral-900 text-white text-sm font-medium py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? "Mengirim..." : "Kirim Persetujuan"}
        </button>
      </div>
    </div>
  );
}
