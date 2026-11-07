"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Body1,
  Button,
  Caption1,
  CounterBadge,
  Divider,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  OverlayDrawer,
  Skeleton,
  SkeletonItem,
  Spinner,
  Subtitle2,
  Tab,
  TabList,
  Text,
  makeStyles,
  mergeClasses,
  tokens,
  type BadgeProps,
} from "@fluentui/react-components";
import {
  AlertUrgentRegular,
  ArrowClockwiseRegular,
  CheckmarkCircleRegular,
  ChevronRightRegular,
  DataPieRegular,
  DismissRegular,
  FlagRegular,
  SettingsRegular,
  TaskListLtrRegular,
} from "@fluentui/react-icons";
import { DashboardShell } from "@/components/dashboard-shell";
import { SekolahLokasiManager } from "@/components/sekolah-lokasi-manager";
import { SppgProfilManager } from "@/components/sppg-profil-manager";
import { PengaduanManager } from "@/components/pengaduan-manager";
import { FeedbackAnakViewer } from "@/components/feedback-anak-viewer";
import { DinasStatistik } from "@/components/dinas-statistik";
import { SectionCard } from "@/components/ui/section-card";
import { StatTile } from "@/components/ui/stat-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { useMediaQuery } from "@/components/ui/use-media";
import { useAppToast } from "@/components/ui/toast";

type Flag = {
  id: string;
  jenisKetidaksesuaian: string;
  detail: string;
  status: string;
  createdAt: string;
  distribusi: {
    sekolah: { namaSekolah: string };
    menu: { tanggal: string; sppg: { namaSppg: string } };
  };
};

type FilterValue = "semua" | "terbuka" | "ditindaklanjuti" | "selesai";
type TabValue = "flag" | "statistik" | "kelola";

const STATUS: Record<string, { label: string; color: BadgeProps["color"] }> = {
  terbuka: { label: "Terbuka", color: "danger" },
  ditindaklanjuti: { label: "Ditindaklanjuti", color: "warning" },
  selesai: { label: "Selesai", color: "success" },
};

const NEXT_LABEL: Record<string, string> = {
  terbuka: "Tandai Ditindaklanjuti",
  ditindaklanjuti: "Tandai Selesai",
};

const useStyles = makeStyles({
  row: {
    width: "100%",
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    backgroundColor: "transparent",
    border: "none",
    borderRadius: tokens.borderRadiusMedium,
    cursor: "pointer",
    color: tokens.colorNeutralForeground1,
    transitionProperty: "background-color",
    transitionDuration: tokens.durationFaster,
    ":hover": { backgroundColor: tokens.colorSubtleBackgroundHover },
    ":focus-visible": { outline: `2px solid ${tokens.colorStrokeFocus2}` },
  },
  rowSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    ":hover": { backgroundColor: tokens.colorBrandBackground2Hover },
  },
});

function FlagStatusBadge({ status }: { status: string }) {
  const st = STATUS[status] ?? { label: status, color: "informative" as const };
  return (
    <Badge appearance="tint" color={st.color} shape="rounded" className="shrink-0">
      {st.label}
    </Badge>
  );
}

function FlagDetail({ flag, busy, onAdvance }: { flag: Flag; busy: boolean; onAdvance: (f: Flag) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Subtitle2>{flag.distribusi.sekolah.namaSekolah}</Subtitle2>
        <Body1 className="text-fg2">{flag.jenisKetidaksesuaian}</Body1>
        <Caption1 className="text-fg3">
          SPPG {flag.distribusi.menu.sppg.namaSppg} ·{" "}
          {new Date(flag.distribusi.menu.tanggal).toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </Caption1>
        <div className="mt-1">
          <FlagStatusBadge status={flag.status} />
        </div>
      </div>
      <Divider />
      <Body1 className="leading-relaxed whitespace-pre-line">{flag.detail}</Body1>
      {NEXT_LABEL[flag.status] && (
        <Button
          appearance="primary"
          disabled={busy}
          onClick={() => onAdvance(flag)}
          icon={busy ? <Spinner size="tiny" /> : <CheckmarkCircleRegular />}
        >
          {NEXT_LABEL[flag.status]}
        </Button>
      )}
      {flag.status === "selesai" && (
        <Caption1 className="inline-flex items-center gap-1 font-semibold text-success">
          <CheckmarkCircleRegular /> Sudah ditindaklanjuti tuntas.
        </Caption1>
      )}
    </div>
  );
}

export function DinasDashboard() {
  const s = useStyles();
  const toast = useAppToast();
  const isWide = useMediaQuery("(min-width: 1024px)");
  const [tab, setTab] = useState<TabValue>("flag");
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterValue>("semua");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function loadFlags() {
    return fetch("/api/dinas/flags")
      .then((r) => r.json())
      .then((d) => setFlags(d.flags ?? []));
  }

  useEffect(() => {
    loadFlags().finally(() => setLoading(false));
  }, []);

  const counts = useMemo(
    () => ({
      terbuka: flags.filter((f) => f.status === "terbuka").length,
      ditindaklanjuti: flags.filter((f) => f.status === "ditindaklanjuti").length,
      selesai: flags.filter((f) => f.status === "selesai").length,
    }),
    [flags]
  );

  const visible = filter === "semua" ? flags : flags.filter((f) => f.status === filter);
  const selected = flags.find((f) => f.id === selectedId) ?? null;

  async function advanceStatus(flag: Flag) {
    setBusy(true);
    const res = await fetch(`/api/dinas/flags/${flag.id}`, { method: "PATCH" });
    if (res.ok) {
      await loadFlags();
      toast("Status flag diperbarui");
    } else {
      toast("Gagal memperbarui status", { intent: "error" });
    }
    setBusy(false);
  }

  async function refresh() {
    setLoading(true);
    await loadFlags().finally(() => setLoading(false));
  }

  return (
    <DashboardShell
      title="Dashboard Dinas"
      subtitle="Flag triangulasi otomatis dari SPPG, sekolah & orang tua"
      actions={
        <Button appearance="secondary" icon={<ArrowClockwiseRegular />} onClick={refresh}>
          Muat ulang
        </Button>
      }
    >
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatTile label="Flag terbuka" value={counts.terbuka} icon={<AlertUrgentRegular />} tone="danger" />
        <StatTile label="Ditindaklanjuti" value={counts.ditindaklanjuti} icon={<TaskListLtrRegular />} tone="warning" />
        <StatTile label="Selesai" value={counts.selesai} icon={<CheckmarkCircleRegular />} tone="success" />
      </div>

      <div className="-mx-1 overflow-x-auto">
        <TabList selectedValue={tab} onTabSelect={(_, d) => setTab(d.value as TabValue)} size="large">
          <Tab value="flag" icon={<FlagRegular />}>
            Flag Triangulasi
          </Tab>
          <Tab value="statistik" icon={<DataPieRegular />}>
            Statistik
          </Tab>
          <Tab value="kelola" icon={<SettingsRegular />}>
            Pengelolaan
          </Tab>
        </TabList>
      </div>

      {tab === "flag" && (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_360px]">
          <SectionCard title="Daftar Flag" icon={<FlagRegular />}>
            <div className="-mx-2 overflow-x-auto">
              <TabList
                size="small"
                appearance="subtle"
                selectedValue={filter}
                onTabSelect={(_, d) => setFilter(d.value as FilterValue)}
              >
                <Tab value="semua">Semua</Tab>
                <Tab value="terbuka">
                  <span className="inline-flex items-center gap-1.5">
                    Terbuka <CounterBadge count={counts.terbuka} size="small" color="danger" />
                  </span>
                </Tab>
                <Tab value="ditindaklanjuti">Ditindaklanjuti</Tab>
                <Tab value="selesai">Selesai</Tab>
              </TabList>
            </div>
            {loading && (
              <Skeleton aria-label="Memuat flag" className="flex flex-col gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <SkeletonItem key={i} size={40} />
                ))}
              </Skeleton>
            )}
            {!loading && visible.length === 0 && (
              <EmptyState icon={<FlagRegular />} title="Belum ada flag untuk filter ini" />
            )}
            {!loading && visible.length > 0 && (
              <ul className="-mx-2 flex flex-col">
                {visible.map((f) => (
                  <li key={f.id}>
                    <button
                      onClick={() => setSelectedId(f.id)}
                      className={mergeClasses(s.row, selectedId === f.id && isWide ? s.rowSelected : undefined)}
                    >
                      <div className="min-w-0 flex-1">
                        <Text weight="semibold" className="block! truncate">
                          {f.distribusi.sekolah.namaSekolah}
                        </Text>
                        <Caption1 className="block! truncate text-fg3">{f.jenisKetidaksesuaian}</Caption1>
                      </div>
                      <Caption1 className="hidden shrink-0 text-fg3 sm:block">
                        {new Date(f.distribusi.menu.tanggal).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </Caption1>
                      <FlagStatusBadge status={f.status} />
                      <ChevronRightRegular className="shrink-0 text-fg3 lg:hidden" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <div className="hidden lg:sticky lg:top-20 lg:block">
            <SectionCard title="Detail" icon={<TaskListLtrRegular />}>
              {selected ? (
                <FlagDetail flag={selected} busy={busy} onAdvance={advanceStatus} />
              ) : (
                <EmptyState
                  title="Pilih flag"
                  description="Pilih salah satu flag di daftar untuk lihat detail & tindak lanjuti."
                />
              )}
            </SectionCard>
          </div>

          <OverlayDrawer
            position="end"
            size="medium"
            open={!isWide && selected != null}
            onOpenChange={(_, d) => !d.open && setSelectedId(null)}
          >
            <DrawerHeader>
              <DrawerHeaderTitle
                action={
                  <Button
                    appearance="subtle"
                    aria-label="Tutup"
                    icon={<DismissRegular />}
                    onClick={() => setSelectedId(null)}
                  />
                }
              >
                Detail Flag
              </DrawerHeaderTitle>
            </DrawerHeader>
            <DrawerBody>{selected && <FlagDetail flag={selected} busy={busy} onAdvance={advanceStatus} />}</DrawerBody>
          </OverlayDrawer>
        </div>
      )}

      {tab === "statistik" && <DinasStatistik />}

      {tab === "kelola" && (
        <div className="flex flex-col gap-3">
          <PengaduanManager />
          <FeedbackAnakViewer />
          <SekolahLokasiManager />
          <SppgProfilManager />
        </div>
      )}
    </DashboardShell>
  );
}
