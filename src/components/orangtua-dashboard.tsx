"use client";

import { useEffect, useState } from "react";
import {
  Avatar,
  Body1,
  Button,
  Caption1,
  Divider,
  Field,
  MessageBar,
  MessageBarBody,
  Skeleton,
  SkeletonItem,
  Spinner,
  Subtitle2,
  Text,
  Textarea,
} from "@fluentui/react-components";
import {
  CheckmarkCircleRegular,
  ClockRegular,
  DismissRegular,
  FoodRegular,
  PeopleCommunityRegular,
  SendRegular,
  StarRegular,
  WarningRegular,
} from "@fluentui/react-icons";
import { DashboardShell } from "@/components/dashboard-shell";
import { RatingWidget } from "@/components/rating-widget";
import { PengaduanPanel } from "@/components/pengaduan-panel";
import { PersetujuanOrangtuaGate } from "@/components/formulir-persetujuan-orangtua";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Expandable } from "@/components/ui/expandable";
import { useAppToast } from "@/components/ui/toast";
import { formatAngkaID } from "@/lib/format";

type ChildData = {
  siswa: { id: string; nama: string; kelas: string | null };
  sekolah: { namaSekolah: string };
  distribusi: {
    id: string;
    status: string;
    menu: {
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
      sppg: { id: string; namaSppg: string };
    };
  } | null;
  konfirmasi: { statusTerima: string; catatan: string | null } | null;
};

// Blok nilai gizi read-only.
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
  const nilai: [string, number, string][] = [
    ["Energi", energi, "kkal"],
    ["Protein", protein, "g"],
    ["Lemak", lemak, "g"],
    ["Karbo", karbohidrat, "g"],
  ];
  return (
    <div className="rounded-fluent-m border border-stroke2 bg-bg2 p-3">
      <Caption1 className="font-semibold text-fg2">{label}</Caption1>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {nilai.map(([l, v, u]) => (
          <div key={l} className="flex flex-col">
            <Caption1 className="text-fg3">{l}</Caption1>
            <Text weight="semibold" className="tabular-nums">
              {formatAngkaID(v)} <Caption1 className="text-fg3">{u}</Caption1>
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrangtuaDashboard() {
  const [children, setChildren] = useState<ChildData[]>([]);
  const [loading, setLoading] = useState(true);
  const [masalahOpenFor, setMasalahOpenFor] = useState<string | null>(null);
  const [catatan, setCatatan] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useAppToast();

  function load() {
    return fetch("/api/orangtua/menu-hari-ini")
      .then((r) => r.json())
      .then((d) => setChildren(d.children ?? []));
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function submitKonfirmasi(child: ChildData, statusTerima: "diterima" | "ada_masalah", note?: string) {
    if (!child.distribusi) return;
    setBusy(true);
    await fetch("/api/orangtua/konfirmasi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        distribusiId: child.distribusi.id,
        siswaId: child.siswa.id,
        statusTerima,
        catatan: note,
      }),
    });
    await load();
    toast(statusTerima === "diterima" ? "Terima kasih, konfirmasi tercatat" : "Laporan terkirim", {
      intent: statusTerima === "diterima" ? "success" : "warning",
    });
    setBusy(false);
    setMasalahOpenFor(null);
    setCatatan("");
  }

  return (
    <PersetujuanOrangtuaGate>
      <DashboardShell title="Portal Orang Tua" subtitle="Menu hari ini & konfirmasi anak menerima makan">
        {loading && (
          <Skeleton aria-label="Memuat data anak" className="grid gap-4 lg:grid-cols-2">
            <SkeletonItem size={128} shape="rectangle" />
            <SkeletonItem size={128} shape="rectangle" />
          </Skeleton>
        )}
        {!loading && children.length === 0 && (
          <SectionCard>
            <EmptyState icon={<PeopleCommunityRegular />} title="Belum ada data anak terhubung ke akun ini" />
          </SectionCard>
        )}

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          {children.map((child) => {
            const menungguSekolah = child.distribusi?.status === "dikirim";
            const menu = child.distribusi?.menu;
            const adaGiziI =
              menu &&
              menu.energiKategoriI != null &&
              menu.proteinKategoriI != null &&
              menu.lemakKategoriI != null &&
              menu.karbohidratKategoriI != null;
            const adaGiziII =
              menu &&
              menu.energiKategoriII != null &&
              menu.proteinKategoriII != null &&
              menu.lemakKategoriII != null &&
              menu.karbohidratKategoriII != null;

            return (
              <SectionCard
                key={child.siswa.id}
                icon={<Avatar name={child.siswa.nama} size={36} color="colorful" />}
                title={child.siswa.nama}
                description={`${child.siswa.kelas ? `${child.siswa.kelas} · ` : ""}${child.sekolah.namaSekolah}`}
              >
                <div className="flex flex-col gap-1 rounded-fluent-l bg-brand-bg2 p-3">
                  <Caption1 className="inline-flex items-center gap-1 font-semibold text-brand">
                    <FoodRegular /> Menu hari ini
                  </Caption1>
                  {child.distribusi && menu ? (
                    <>
                      <Subtitle2>{menu.deskripsi}</Subtitle2>
                      {menu.nomorMenu != null && menu.siklus != null && (
                        <Caption1 className="text-fg3">
                          Menu {menu.nomorMenu} · Siklus {menu.siklus}
                        </Caption1>
                      )}
                    </>
                  ) : (
                    <Body1 className="text-fg3">Belum ada menu yang tercatat hari ini.</Body1>
                  )}
                </div>

                {child.distribusi && menu && (menu.fotoUrl || adaGiziI || adaGiziII) && (
                  <Expandable summary="Lihat rincian menu">
                    <div className="flex flex-col gap-3">
                      {menu.fotoUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={menu.fotoUrl}
                          alt={`Foto menu: ${menu.deskripsi}`}
                          className="max-h-80 w-full rounded-fluent-m border border-stroke2 bg-bg3 object-contain"
                        />
                      )}
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
                  </Expandable>
                )}

                {child.distribusi && menungguSekolah && (
                  <MessageBar layout="multiline" intent="info" icon={<ClockRegular />}>
                    <MessageBarBody>Menunggu konfirmasi sekolah, belum bisa dikonfirmasi dulu.</MessageBarBody>
                  </MessageBar>
                )}

                {child.distribusi && !menungguSekolah && !child.konfirmasi && masalahOpenFor !== child.siswa.id && (
                  <div className="flex flex-col gap-2">
                    <Subtitle2>Apakah {child.siswa.nama} menerima makan hari ini?</Subtitle2>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Button
                        appearance="primary"
                        size="large"
                        disabled={busy}
                        icon={busy ? <Spinner size="tiny" /> : <CheckmarkCircleRegular />}
                        onClick={() => submitKonfirmasi(child, "diterima")}
                      >
                        Ya, diterima
                      </Button>
                      <Button
                        size="large"
                        disabled={busy}
                        icon={<WarningRegular />}
                        onClick={() => setMasalahOpenFor(child.siswa.id)}
                      >
                        Tidak / ada masalah
                      </Button>
                    </div>
                  </div>
                )}

                {masalahOpenFor === child.siswa.id && (
                  <div className="flex flex-col gap-2 mbg-rise">
                    <Field label="Ceritain apa yang terjadi">
                      <Textarea
                        resize="vertical"
                        rows={3}
                        value={catatan}
                        onChange={(_, d) => setCatatan(d.value)}
                        placeholder={`Contoh: ${child.siswa.nama} bilang gak kebagian nasi hari ini...`}
                      />
                    </Field>
                    <div className="flex justify-end gap-2">
                      <Button icon={<DismissRegular />} onClick={() => setMasalahOpenFor(null)}>
                        Batal
                      </Button>
                      <Button
                        appearance="primary"
                        disabled={busy}
                        icon={busy ? <Spinner size="tiny" /> : <SendRegular />}
                        onClick={() => submitKonfirmasi(child, "ada_masalah", catatan)}
                      >
                        Kirim Laporan
                      </Button>
                    </div>
                  </div>
                )}

                {child.konfirmasi &&
                  (child.konfirmasi.statusTerima === "diterima" ? (
                    <MessageBar layout="multiline" intent="success">
                      <MessageBarBody>
                        Terima kasih sudah konfirmasi. {child.siswa.nama} tercatat menerima makan hari ini.
                      </MessageBarBody>
                    </MessageBar>
                  ) : (
                    <MessageBar layout="multiline" intent="warning">
                      <MessageBarBody>Laporan terkirim. Status: menunggu ditindaklanjuti.</MessageBarBody>
                    </MessageBar>
                  ))}

                {child.distribusi && !menungguSekolah && (
                  <>
                    <Divider />
                    <div className="flex flex-col gap-2">
                      <Caption1 className="inline-flex items-center gap-1 font-semibold text-fg2">
                        <StarRegular /> Rating
                      </Caption1>
                      <RatingWidget
                        endpoint="/api/orangtua/rating"
                        extraBody={{ sppgId: child.distribusi.menu.sppg.id }}
                        label={`Kasih rating buat ${child.distribusi.menu.sppg.namaSppg}`}
                      />
                    </div>
                  </>
                )}
              </SectionCard>
            );
          })}
        </div>

        {children.some((c) => c.distribusi) && (
          <PengaduanPanel
            endpoint="/api/orangtua/pengaduan"
            title="Pengaduan ke SPPG"
            extraBody={(() => {
              const withDistribusi = children.find((c) => c.distribusi);
              return withDistribusi
                ? {
                    sppgId: withDistribusi.distribusi!.menu.sppg.id,
                    distribusiId: withDistribusi.distribusi!.id,
                  }
                : {};
            })()}
          />
        )}
      </DashboardShell>
    </PersetujuanOrangtuaGate>
  );
}
